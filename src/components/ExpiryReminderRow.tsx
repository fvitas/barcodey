import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { ensureNotificationPermission } from '@/lib/notifications'
import { useUiState } from '@/state/ui-state-context'

// appears in the drawers only once a date is entered — reminders are opt-in, off by default
export function ExpiryReminderRow({ expiry }: { expiry: string | undefined }) {
  const { state, update } = useUiState()
  const [denied, setDenied] = useState(false)

  function handleToggle(checked: boolean) {
    if (!checked) {
      setDenied(false)
      update({ expiryReminders: false })
      return
    }
    void ensureNotificationPermission().then(granted => {
      setDenied(!granted)
      if (granted) update({ expiryReminders: true })
    })
  }

  if (expiry === undefined) return null

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
      <div className="min-w-0 pr-3">
        <p className="text-sm font-semibold text-foreground">Notify me</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground/80">
          {denied
            ? 'Allow notifications in device Settings to enable'
            : state.expiryReminders
              ? 'You’ll be notified 30, 7 and 1 day before'
              : 'A heads-up 30, 7 and 1 day before it expires'}
        </p>
      </div>
      <Switch checked={state.expiryReminders} onCheckedChange={handleToggle} aria-label="Notify me" />
    </div>
  )
}
