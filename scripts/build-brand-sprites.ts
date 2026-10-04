// Converts the TinyPNG'd sprite sheets (scripts/sprites/tiny/) into the shipped public/brands/logos-<n>.webp.
// Each tiny sheet is diffed cell by cell against its raw sheet (TinyPNG rewrites mtimes, so they can't be
// trusted) — a sheet that changed in build:brands but wasn't re-tinified fails the run.
//
// run: node scripts/build-brand-sprites.ts [--quality 90] — lossless by default: TinyPNG's palette makes
// lossless webp smaller than any lossy quality, and pixel-identical to what was approved
import { readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const rawSheetDir = path.join(scriptsDir, 'sprites', 'raw')
const tinySheetDir = path.join(scriptsDir, 'sprites', 'tiny')
const outDir = path.join(scriptsDir, '..', 'public', 'brands')
// must match logoPitch in build-brand-catalog.ts
const logoPitch = 104
// TinyPNG never moves a pixel this far; a new or shifted logo moves 100+ of them in its cell
const sharpChange = 96
const maxChangedPixels = 16

function parseQuality(): number | 'lossless' {
  const args = process.argv.slice(2)
  const index = args.indexOf('--quality')
  if (index === -1) return 'lossless'
  const value = args[index + 1]
  return value === 'lossless' ? value : Number(value)
}

async function isStale(rawFile: string, tinyFile: string): Promise<boolean> {
  const raw = await sharp(rawFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const tiny = await sharp(tinyFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = raw.info
  if (tiny.info.width !== width || tiny.info.height !== height) return true
  const columns = width / logoPitch
  const changedPixels = new Uint32Array(columns * (height / logoPitch))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      const rawAlpha = raw.data[offset + 3]
      const tinyAlpha = tiny.data[offset + 3]
      let change = Math.abs(rawAlpha - tinyAlpha)
      for (let channel = 0; channel < 3; channel++) {
        const premultiplied = Math.abs(raw.data[offset + channel] * rawAlpha - tiny.data[offset + channel] * tinyAlpha) / 255
        change = Math.max(change, premultiplied)
      }
      if (change > sharpChange) changedPixels[Math.floor(y / logoPitch) * columns + Math.floor(x / logoPitch)] += 1
    }
  }
  return Math.max(...changedPixels) > maxChangedPixels
}

async function main() {
  const quality = parseQuality()
  const sheets = (await readdir(rawSheetDir)).filter(file => /^logos-[a-z]+\.png$/.test(file))
  const stale: string[] = []
  for (const file of sheets) {
    const tinyFile = path.join(tinySheetDir, file)
    const exists = await stat(tinyFile).then(() => true, () => false)
    if (!exists || (await isStale(path.join(rawSheetDir, file), tinyFile))) stale.push(file)
  }
  if (stale.length > 0) {
    console.error(`re-run through TinyPNG into scripts/sprites/tiny/: ${stale.join(', ')}`)
    process.exit(1)
  }

  const valid = new Set(['catalog.json'])
  let totalBytes = 0
  for (const file of sheets) {
    const name = file.replace(/\.png$/, '.webp')
    const image = sharp(path.join(tinySheetDir, file))
    const webp = await (quality === 'lossless'
      ? image.webp({ lossless: true, effort: 6 })
      : image.webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true })
    ).toBuffer()
    await writeFile(path.join(outDir, name), webp)
    valid.add(name)
    totalBytes += webp.length
  }
  for (const file of await readdir(outDir)) {
    if (!valid.has(file)) await rm(path.join(outDir, file))
  }
  console.log(`${sheets.length} sheets at quality ${quality}: ${(totalBytes / 1_048_576).toFixed(2)} MB`)
}

await main()
