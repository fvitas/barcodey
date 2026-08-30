import type { BarcodeFormat as MlkitFormat } from '@capacitor-mlkit/barcode-scanning'
import { Capacitor } from '@capacitor/core'
import type { ReaderOptions } from 'zxing-wasm/reader'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import type { BarcodeFormat } from '@/lib/model'

export type ScanResult = { value: string; format: BarcodeFormat }

// zxing-wasm v3 format names have no hyphens ('EAN13', not v2's 'EAN-13')
const zxingFormats: Record<string, BarcodeFormat> = {
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPCA: 'upca',
  UPCE: 'upce',
  Code128: 'code128',
  Code39: 'code39',
  Code93: 'code93',
  Codabar: 'codabar',
  ITF: 'itf',
  QRCode: 'qrcode',
  Aztec: 'aztec',
  DataMatrix: 'datamatrix',
  PDF417: 'pdf417',
}

const readerOptions: ReaderOptions = {
  // only the formats the app supports — an unrestricted search wastes most of each frame's budget
  formats: [
    'EAN13',
    'EAN8',
    'UPCA',
    'UPCE',
    'Code128',
    'Code39',
    'Code93',
    'Codabar',
    'ITF',
    'QRCode',
    'Aztec',
    'DataMatrix',
    'PDF417',
  ],
  tryHarder: true,
  maxNumberOfSymbols: 1,
}

type ZxingFormat = NonNullable<ReaderOptions['formats']>[number]

const zxingNames: Record<BarcodeFormat, ZxingFormat> = {
  ean13: 'EAN13',
  ean8: 'EAN8',
  upca: 'UPCA',
  upce: 'UPCE',
  code128: 'Code128',
  code39: 'Code39',
  code93: 'Code93',
  codabar: 'Codabar',
  itf: 'ITF',
  qrcode: 'QRCode',
  aztec: 'Aztec',
  datamatrix: 'DataMatrix',
  pdf417: 'PDF417',
}

const mlkitFormats: Record<string, BarcodeFormat> = {
  EAN_13: 'ean13',
  EAN_8: 'ean8',
  UPC_A: 'upca',
  UPC_E: 'upce',
  CODE_128: 'code128',
  CODE_39: 'code39',
  CODE_93: 'code93',
  CODABAR: 'codabar',
  ITF: 'itf',
  QR_CODE: 'qrcode',
  AZTEC: 'aztec',
  DATA_MATRIX: 'datamatrix',
  PDF_417: 'pdf417',
}

// zxing fetches its wasm from a cdn unless told otherwise; the object must keep a stable
// identity because prepareZXingModule shallow-compares it and rebuilds the module on a miss
const zxingOverrides = { locateFile: () => zxingWasmUrl }

// browser path: camera frames and picked image files both decode here
export async function scanImage(image: ImageData | Blob, formats?: BarcodeFormat[]): Promise<ScanResult | null> {
  const { prepareZXingModule, readBarcodes } = await import('zxing-wasm/reader')
  prepareZXingModule({ overrides: zxingOverrides })
  const options =
    formats === undefined ? readerOptions : { ...readerOptions, formats: formats.map(format => zxingNames[format]) }
  const results = await readBarcodes(image, options)
  const first = results[0]
  if (!first || !first.isValid) return null
  const format = zxingFormats[first.format]
  return format === undefined ? null : { value: first.text, format }
}

// native path: ML Kit full-screen scanner (wired when platforms are added)
export async function scanWithNativeScanner(): Promise<ScanResult | null> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  const { barcodes } = await BarcodeScanner.scan()
  const first = barcodes[0]
  if (!first || !first.rawValue) return null
  const format = mlkitFormats[first.format]
  return format === undefined ? null : { value: first.rawValue, format }
}

// android's scan() hands off to a play services activity that can't be styled, so there
// we run startScan() — camera behind a transparent webview — and draw our own chrome
export const usesOverlayScanner = Capacitor.getPlatform() === 'android'

// startScan() drives the camera itself, so unlike scan() it needs the runtime permission
export async function requestScannerPermission(): Promise<boolean> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  const granted = ({ camera }: { camera: string }) => camera === 'granted' || camera === 'limited'
  if (granted(await BarcodeScanner.checkPermissions())) return true
  return granted(await BarcodeScanner.requestPermissions())
}

// searching every format wastes most of each frame's budget — same reasoning as readerOptions
const overlayFormats = Object.keys(mlkitFormats) as MlkitFormat[]

export async function startOverlayScan(onDetected: (result: ScanResult) => void): Promise<void> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  await BarcodeScanner.addListener('barcodesScanned', ({ barcodes }) => {
    const first = barcodes[0]
    if (!first || !first.rawValue) return
    const format = mlkitFormats[first.format]
    if (format !== undefined) onDetected({ value: first.rawValue, format })
  })
  await BarcodeScanner.startScan({ formats: overlayFormats })
}

export async function stopOverlayScan(): Promise<void> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  await BarcodeScanner.removeAllListeners()
  await BarcodeScanner.stopScan()
}

export async function hasTorch(): Promise<boolean> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  const { available } = await BarcodeScanner.isTorchAvailable()
  return available
}

export async function toggleScannerTorch(): Promise<void> {
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
  await BarcodeScanner.toggleTorch()
}
