import { Drawer } from 'vaul'
import { pressable } from '@/lib/utils'

type ConfirmDrawerProps = {
  open: boolean
  nested?: boolean // opened from inside a modal drawer — body portals are inert there
  title: string
  description: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDrawer({ open, nested = false, title, description, confirmLabel, onConfirm, onClose }: ConfirmDrawerProps) {
  const Root = nested ? Drawer.NestedRoot : Drawer.Root
  return (
    <Root open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-60 mx-auto max-w-[26rem] rounded-t-[1.75rem] bg-card outline-none">
          <div className="px-5 pt-3 pb-8">
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-input" />
            <Drawer.Title className="mb-2 text-lg font-extrabold text-foreground">{title}</Drawer.Title>

            <p className="mb-6 text-sm text-muted-foreground">{description}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className={`${pressable} rounded-4xl bg-muted py-3 text-sm font-semibold text-foreground/80 hover:text-foreground`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`${pressable} rounded-4xl bg-destructive py-3 text-sm font-semibold text-white hover:bg-destructive/80`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  )
}
