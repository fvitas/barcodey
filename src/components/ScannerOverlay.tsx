import { FlashlightIcon, FlashlightOffIcon, XIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import { haptic } from '@/lib/haptics'
import {
  hasTorch,
  requestScannerPermission,
  startOverlayScan,
  stopOverlayScan,
  toggleScannerTorch,
  type ScanResult,
} from '@/lib/scanner'
import { pressable } from '@/lib/utils'

type ScannerOverlayProps = {
  open: boolean
  onDetected: (result: ScanResult) => void
  onClose: () => void
}

// chrome for the android overlay scanner, matching the patched ios view: black backdrop
// until the first frame, then an ISO ID-1 viewfinder with torch and close under the thumb
export function ScannerOverlay({ open, onDetected, onClose }: ScannerOverlayProps) {
  const [ready, setReady] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onDetectedRef.current = onDetected
    onCloseRef.current = onClose
  }, [onDetected, onClose])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let detected = false

    async function start() {
      if (!(await requestScannerPermission())) {
        if (!cancelled) onCloseRef.current()
        return
      }
      if (cancelled) return
      await startOverlayScan(result => {
        // single shot, like the ios view: the first hit closes the scanner
        if (detected) return
        detected = true
        // both in one batch, so the chrome unmounts and the app repaints in the same
        // commit — the drawer is never visible under a half-torn-down scanner
        onCloseRef.current()
        onDetectedRef.current(result)
      })
      if (cancelled) return
      setReady(true)
      setTorchAvailable(await hasTorch())
    }

    document.documentElement.classList.add('scanner-active')
    void start()

    return () => {
      cancelled = true
      document.documentElement.classList.remove('scanner-active')
      setReady(false)
      setTorchOn(false)
      setTorchAvailable(false)
      void stopOverlayScan()
    }
  }, [open])

  function handleTorch() {
    haptic('light')
    setTorchOn(on => !on)
    void toggleScannerTorch()
  }

  function handleClose() {
    haptic('light')
    onClose()
  }

  return (
    <Drawer.NestedRoot open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      {/* gated on open so the exit is instant — vaul would otherwise slide the chrome
          down over the drawer for half a second while the camera unbinds */}
      {open && (
        <Drawer.Portal>
          <Drawer.Content data-scanner-overlay className="fixed inset-0 z-80 rounded-none bg-transparent outline-none">
            <Drawer.Title className="sr-only">Scan a barcode</Drawer.Title>

            {/* camerax needs a moment to bind; black until then, like the ios reveal */}
            <motion.div
              className="absolute inset-0 bg-black"
              animate={{ opacity: ready ? 0 : 1 }}
              transition={{ duration: 0.25 }}
            />

            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="absolute top-1/2 left-1/2 aspect-[1.586] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border-4 border-white" />

              {torchAvailable && (
                <button
                  onClick={handleTorch}
                  aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                  className={`${pressable} absolute bottom-[calc(var(--safe-area-inset-bottom,0px)+26px)] left-1/2 flex size-15 -translate-x-1/2 items-center justify-center rounded-full bg-black/50 text-white`}
                >
                  {torchOn ? <FlashlightIcon className="size-6" /> : <FlashlightOffIcon className="size-6" />}
                </button>
              )}

              <button
                onClick={handleClose}
                aria-label="Close scanner"
                className={`${pressable} absolute right-5 bottom-[calc(var(--safe-area-inset-bottom,0px)+26px)] flex size-15 items-center justify-center rounded-full bg-black/50 text-white`}
              >
                <XIcon className="size-6" />
              </button>
            </motion.div>
          </Drawer.Content>
        </Drawer.Portal>
      )}
    </Drawer.NestedRoot>
  )
}
