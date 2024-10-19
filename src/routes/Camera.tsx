import { useEffect, useRef, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select.tsx'

export function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream>(null)

  const [availableCameras, setAvailableCameras] = useState<{ value: string; label: string }[]>([])
  const [selectedCameraLabel, setSelectedCameraLabel] = useState<string>('')
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  const [hasCameraError, setHasCameraError] = useState(false)

  useEffect(() => {
    async function startCamera() {
      try {
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop())
        }

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
      } catch {
        setHasCameraError(true)
      }
    }

    function stopCameras() {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }

    startCamera()

    return () => stopCameras()
  }, [selectedDeviceId])

  if (hasCameraError) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <p className="text-red-500 text-center">Camera error. Please try again.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
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

      <video ref={videoRef} className="h-full w-full" autoPlay playsInline />
    </div>
  )
}
