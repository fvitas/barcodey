import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader, Result } from '@zxing/library'
import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat'

export function Camera() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream>(null)

  const [hasCameraError, setHasCameraError] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    reader.timeBetweenDecodingAttempts = 100

    async function startCamera() {
      try {
        const constraints = { video: { facingMode: { ideal: 'environment' } } }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        stream.current = newStream

        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }
      } catch {
        setHasCameraError(true)
      }
    }

    async function runScan() {
      if (!stream.current) {
        return
      }

      const selectedCameraLabel = stream.current?.getVideoTracks()?.at(0)?.label
      const videoInputDevices = await reader.listVideoInputDevices()
      const deviceId = videoInputDevices.find(device => device.label === selectedCameraLabel)?.deviceId

      if (!deviceId) {
        return
      }

      await reader.decodeFromVideoDevice(deviceId, 'video', (result: Result) => {
        if (result) {
          reader.reset()
          stopCameras()

          navigate(`/new-barcode/`, {
            state: {
              barcodeValue: result.getText(),
              barcodeType: BarcodeFormat[result.getBarcodeFormat()],
            },
          })
        }
      })
    }

    function stopCameras() {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop())

        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    }

    startCamera().then(runScan)

    return () => {
      reader.reset()
      stopCameras()
    }
  }, [])

  if (hasCameraError) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <p className="text-red-500 text-center">Camera error. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center">
      <video
        ref={videoRef}
        id="video"
        className="h-full w-full"
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-lg aspect-video rounded-lg"
        style={{
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
        }}
      />
    </div>
  )
}
