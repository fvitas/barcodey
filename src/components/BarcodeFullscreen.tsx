import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { haptic } from '@/lib/haptics'
import { squareFormats, type BarcodeFormat } from '@/lib/model'

type BarcodeFullscreenProps = {
  name: string
  value: string
  format: BarcodeFormat
  svg: string
  onClose: () => void
}

// hand-over view: always white so scanners read it in dark mode too
export function BarcodeFullscreen({ name, value, format, svg, onClose }: BarcodeFullscreenProps) {
  const square = squareFormats.has(format)
  const plateHtml = useMemo(
    () => ({ __html: square ? svg : svg.replace('<svg', '<svg preserveAspectRatio="none"') }),
    [svg, square],
  )

  useEffect(() => {
    haptic('medium')
  }, [])

  return createPortal(
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        haptic('light')
        onClose()
      }}
      aria-label="Close barcode"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white p-8"
    >
      <p className="absolute top-[max(3.5rem,calc(env(safe-area-inset-top)+1rem))] right-8 left-8 truncate text-center text-base font-extrabold text-slate-900">
        {name}
      </p>
      <motion.div
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        className={
          square
            ? 'w-full max-w-[68vmin] [&_svg]:h-auto [&_svg]:w-full'
            : 'h-[36vh] max-h-80 w-full [&_svg]:h-full [&_svg]:w-full'
        }
        dangerouslySetInnerHTML={plateHtml}
      />
      <p className="mt-8 font-mono text-sm font-medium tracking-[0.25em] break-all text-slate-500">{value}</p>
    </motion.button>,
    document.body,
  )
}
