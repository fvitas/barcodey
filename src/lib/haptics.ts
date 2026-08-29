import { Capacitor } from '@capacitor/core'

export type HapticCue = 'light' | 'medium' | 'success' | 'warning'

const hasNativeHaptics = Capacitor.isNativePlatform()

// module flag instead of context: call sites stay one-liners outside react
let enabled = true

export function setHapticsEnabled(value: boolean): void {
  enabled = value
}

async function fire(cue: HapticCue): Promise<void> {
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
  if (cue === 'light') return Haptics.impact({ style: ImpactStyle.Light })
  if (cue === 'medium') return Haptics.impact({ style: ImpactStyle.Medium })
  return Haptics.notification({ type: cue === 'success' ? NotificationType.Success : NotificationType.Warning })
}

let lastFiredAt = 0

export function haptic(cue: HapticCue): void {
  if (!enabled || !hasNativeHaptics) return
  lastFiredAt = Date.now()
  void fire(cue).catch(() => {})
}

const tapTargets =
  'button, a, input, select, textarea, label, [role="button"], [role="switch"], [role="checkbox"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"]'

// global light tap on every interactive element; the recency guard keeps
// call-site cues (medium/success/warning fire first on the same click) single
export function installTapHaptics(): () => void {
  function handleClick(event: MouseEvent): void {
    if (!(event.target instanceof Element) || event.target.closest(tapTargets) === null) return
    if (Date.now() - lastFiredAt < 150) return
    haptic('light')
  }
  document.addEventListener('click', handleClick)
  return () => document.removeEventListener('click', handleClick)
}
