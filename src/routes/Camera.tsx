import { twJoin } from 'tailwind-merge'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader, Result } from '@zxing/library'

export function Camera() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream>(null)

  const [hasCameraError, setHasCameraError] = useState(false)
  const [detectedNewBarcode, setDetectedNewBarcode] = useState<Result | null>(null)

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

      await reader.decodeFromVideoDevice(deviceId, 'video', result => {
        if (result) {
          setDetectedNewBarcode(result)
          reader.reset()
          // navigate(`/new-barcode/`, { state: result.text })
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
      stopCameras()
      reader.reset()
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
        className={twJoin(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-lg aspect-video rounded-lg',
          detectedNewBarcode && 'border-2 border-lime-500',
        )}
        style={{
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
        }}
      />

      {detectedNewBarcode && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {detectedNewBarcode.getText()}
          </p>
        </div>
      )}
    </div>
  )
}
