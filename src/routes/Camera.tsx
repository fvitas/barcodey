import { useEffect, useRef, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select.tsx'
import { BrowserMultiFormatReader, Result } from '@zxing/library'

export function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream>(null)

  const [availableCameras, setAvailableCameras] = useState<{ value: string; label: string }[]>([])
  const [selectedCameraLabel, setSelectedCameraLabel] = useState<string>('')
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  const [hasCameraError, setHasCameraError] = useState(false)
  const [detectedNewBarcode, setDetectedNewBarcode] = useState<Result | null>(null)

  useEffect(() => {
    async function startCamera() {
      try {
        // const isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini|Mobile/i.test(navigator.userAgent)
        //
        // const constraints = selectedDeviceId
        //   ? { video: { deviceId: { exact: selectedDeviceId } } }
        //   : isMobile
        //     ? { video: { facingMode: { exact: 'environment' } } }
        //     : { video: true }
        //
        const constraints = selectedDeviceId ? { video: { deviceId: { exact: selectedDeviceId } } } : { video: true }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        stream.current = newStream

        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }

        const devices = await navigator.mediaDevices.enumerateDevices()

        const streamCameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({ value: device.deviceId, label: device.label }))

        setAvailableCameras(streamCameras)

        setSelectedCameraLabel(
          streamCameras.find(camera => camera.label === newStream?.getVideoTracks()?.at(0)?.label).value,
        )
      } catch (error) {
        console.log(error)
        setHasCameraError(true)
      }
    }

    function stopCameras() {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop())

        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    }

    startCamera()

    return () => stopCameras()
  }, [selectedDeviceId])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    reader.timeBetweenDecodingAttempts = 100

    async function runScan() {
      let deviceId = selectedDeviceId
      if (!deviceId) {
        const videoInputDevices = await reader.listVideoInputDevices()
        deviceId = videoInputDevices[0]?.deviceId
      }

      if (!deviceId) {
        return
      }

      await reader.decodeFromVideoDevice(deviceId, 'video', result => {
        if (result) {
          setDetectedNewBarcode(result)
        }
      })
    }

    runScan()

    return () => reader.reset()
  }, [selectedDeviceId])

  if (hasCameraError) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <p className="text-red-500 text-center">Camera error. Please try again.</p>
      </div>
    )
  }
  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center">
      <label className="grid gap-3">
        <Select value={selectedCameraLabel} onValueChange={value => setSelectedDeviceId(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {availableCameras.map(camera => (
              <SelectItem key={camera.value} value={String(camera.value)}>
                {camera.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <video
        ref={videoRef}
        id="video"
        className="h-full w-full"
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
