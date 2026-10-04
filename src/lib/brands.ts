import { z } from 'zod'

const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  countries: z.array(z.string()), // lowercase ISO codes, or '001' for worldwide
  cat: z.string(),
  color: z.string().regex(/^#[0-9a-f]{6}$/),
  logo: z.tuple([z.string().regex(/^[a-z]+$/), z.number().int().nonnegative()]), // [sheet, cell]
})

const brandCatalogSchema = z.object({
  version: z.literal(2),
  sheetRows: z.record(z.string(), z.number().int().positive()),
  brands: z.array(brandSchema),
})

export type BrandLogoCell = { sheet: string; cell: number; rows: number }

export type Brand = Omit<z.infer<typeof brandSchema>, 'logo'> & { logo: BrandLogoCell }

// sprite geometry — must match scripts/build-brand-catalog.ts
const logoSize = 96
const logoPitch = 104
const logoColumns = 16

export type BrandLogoStyle = { backgroundImage: string; backgroundSize: string; backgroundPosition: string }

// percentages keep the cell aligned at any element size, as long as the element is square
export function brandLogoStyle({ sheet, cell, rows }: BrandLogoCell): BrandLogoStyle {
  const inset = (logoPitch - logoSize) / 2
  const sheetWidth = logoColumns * logoPitch
  const sheetHeight = rows * logoPitch
  const x = ((cell % logoColumns) * logoPitch + inset) / (sheetWidth - logoSize)
  const y = (Math.floor(cell / logoColumns) * logoPitch + inset) / (sheetHeight - logoSize)
  return {
    backgroundImage: `url(/brands/logos-${sheet}.webp)`,
    backgroundSize: `${(sheetWidth / logoSize) * 100}% ${(sheetHeight / logoSize) * 100}%`,
    backgroundPosition: `${x * 100}% ${y * 100}%`,
  }
}

export function brandCategoryLabel(brand: Brand): string {
  const label = brand.cat.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function userCountry(): string | undefined {
  try {
    return new Intl.Locale(navigator.language).region?.toLowerCase()
  } catch {
    return undefined
  }
}

function inCountry(brand: Brand, country: string | undefined): boolean {
  return country !== undefined && (brand.countries.includes(country) || brand.countries.includes('001'))
}

// rank: name prefix > alias prefix > name substring > alias substring; local brands before
// foreign ones within a rank, then shorter names (closer match) first
export function searchBrands(brands: Brand[], query: string, country: string | undefined): Brand[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  const scored: { brand: Brand; score: number }[] = []
  for (const brand of brands) {
    const name = brand.name.toLowerCase()
    const aliases = brand.aliases ?? []
    let score = 0
    if (name.startsWith(needle)) score = 4
    else if (aliases.some(alias => alias.startsWith(needle))) score = 3
    else if (name.includes(needle)) score = 2
    else if (aliases.some(alias => alias.includes(needle))) score = 1
    if (score === 0) continue
    if (inCountry(brand, country)) score += 0.5
    scored.push({ brand, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.brand.name.length - b.brand.name.length)
    .map(entry => entry.brand)
}

export type BrandGroup = { letter: string; brands: Brand[] }

// accents file under their base letter (É → E); digits and non-latin scripts pool under '#'.
// Also decides the logo sprite sheet.
export function brandLetter(name: string): string {
  const initial = name.normalize('NFD').charAt(0).toUpperCase()
  return /[A-Z]/.test(initial) ? initial : '#'
}

// A–Z sections for the picker
export function groupBrandsByLetter(brands: Brand[]): BrandGroup[] {
  const groups = new Map<string, Brand[]>()
  for (const brand of brands) {
    const letter = brandLetter(brand.name)
    const group = groups.get(letter) ?? []
    group.push(brand)
    groups.set(letter, group)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([letter, grouped]) => ({ letter, brands: grouped.sort((a, b) => a.name.localeCompare(b.name)) }))
}

let catalogPromise: Promise<Brand[]> | null = null
let brandsById: Map<string, Brand> | null = null

// null until loadBrandCatalog has resolved once
export function loadedBrandIndex(): ReadonlyMap<string, Brand> | null {
  return brandsById
}

export function loadBrandCatalog(): Promise<Brand[]> {
  // a failed load must not stick for the session — drop the cache and retry next call
  catalogPromise ??= fetch('/brands/catalog.json')
    .then(response => {
      if (!response.ok) throw new Error(`catalog HTTP ${response.status}`)
      return response.json()
    })
    .then(json => {
      const { sheetRows, brands } = brandCatalogSchema.parse(json)
      const parsed = brands.map(({ logo: [sheet, cell], ...brand }) => ({
        ...brand,
        logo: { sheet, cell, rows: sheetRows[sheet] ?? 1 },
      }))
      brandsById = new Map(parsed.map(brand => [brand.id, brand]))
      return parsed
    })
    .catch((error: unknown) => {
      catalogPromise = null
      throw error
    })
  return catalogPromise
}
