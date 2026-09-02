import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FolderPlusIcon, IdCardIcon, LockIcon, PlusIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Drawer } from 'vaul'
import { AppWordmark } from '@/components/AppWordmark'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { Input } from '@/components/ui/input'
import { cardFace } from '@/lib/color'
import { haptic } from '@/lib/haptics'
import { orderFolderCards, type Card, type Folder } from '@/lib/model'
import { focusOnMount, pressable } from '@/lib/utils'
import { useWallet } from '@/state/wallet-context'

const bandCap = 4

// a dragged tile stays inside the grid — past the bottom it would grow the page's scroll overflow
const clampToParent: Modifier = ({ transform, containerNodeRect, draggingNodeRect }) => {
  if (!containerNodeRect || !draggingNodeRect) return transform
  const minX = containerNodeRect.left - draggingNodeRect.left
  const maxX = containerNodeRect.left + containerNodeRect.width - (draggingNodeRect.left + draggingNodeRect.width)
  const minY = containerNodeRect.top - draggingNodeRect.top
  const maxY = containerNodeRect.top + containerNodeRect.height - (draggingNodeRect.top + draggingNodeRect.height)
  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  }
}

// later bands overpaint earlier ones, so each band's left edge is the visible
// boundary — anchoring them at i/n fractions keeps the stripes symmetric
function FolderBands({ cards }: { cards: Card[] }) {
  const shown = cards.slice(0, bandCap)
  if (shown.length === 1) {
    const face = cardFace(shown[0])
    return <span className={`absolute inset-0 ${face.className}`} style={face.style} />
  }
  const step = 100 / shown.length
  return (
    <>
      {shown.map((card, index) => {
        const face = cardFace(card)
        return (
          <span
            key={card.id}
            className={`absolute inset-y-0 ${face.className}`}
            style={{
              ...face.style,
              left: index === 0 ? '-12%' : `${index * step}%`,
              width: `calc(${step}% + 40px)`,
              transform: 'skewX(-14deg)',
            }}
          />
        )
      })}
    </>
  )
}

function FolderTileLabel({ name, count, muted }: { name: string; count: number; muted?: boolean }) {
  return (
    <span className="absolute inset-x-4 bottom-3.5 flex flex-col items-start">
      <span className={`w-full truncate text-2xl font-extrabold tracking-tight ${muted ? 'text-foreground' : 'text-white'}`}>
        {name}
      </span>
      <span
        className={`mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${
          muted ? 'bg-muted text-muted-foreground' : 'bg-white/25 text-white backdrop-blur-xs'
        }`}
      >
        {count} {count === 1 ? 'card' : 'cards'}
      </span>
    </span>
  )
}

type SortableFolderTileProps = {
  folder: Folder
  cards: Card[]
  onOpen: (id: string) => void
}

// tiles drag as a whole, so the press-and-hold sensor keeps taps working
function SortableFolderTile({ folder, cards, onOpen }: SortableFolderTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'manipulation' }}
      className={isDragging ? 'relative z-20' : ''}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={() => onOpen(folder.id)}
        className={`${pressable} relative h-37 w-full overflow-hidden rounded-2xl bg-card text-left shadow-sm`}
      >
        {cards.length > 0 && (
          <>
            <FolderBands cards={cards} />
            <span
              className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(to top, rgba(2,6,23,0.78), rgba(2,6,23,0.25) 55%, transparent 80%)' }}
            />
          </>
        )}
        <FolderTileLabel name={folder.name} count={cards.length} muted={cards.length === 0} />
      </button>
    </div>
  )
}

type NewFolderDrawerProps = {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

function NewFolderDrawer({ open, onClose, onCreate }: NewFolderDrawerProps) {
  const [name, setName] = useState('')

  function handleClose() {
    setName('')
    onClose()
  }

  function handleCreate() {
    const trimmed = name.trim()
    if (trimmed === '') return
    onCreate(trimmed)
    handleClose()
  }

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[26rem] rounded-t-[1.75rem] bg-card outline-none">
          <div className="px-5 pt-3 pb-safe">
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-input" />
            <Drawer.Title className="mb-5 text-lg font-extrabold text-foreground">New folder</Drawer.Title>

            <Input
              ref={focusOnMount}
              value={name}
              placeholder="e.g. Groceries"
              autoCapitalize="sentences"
              className="mb-5 h-11 px-4 text-sm font-semibold"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
            />

            <button
              onClick={handleCreate}
              disabled={name.trim() === ''}
              className={`${pressable} w-full rounded-4xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/80`}
            >
              Create folder
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export function FoldersScreen() {
  const { cards, folders, documents, createFolder, moveFolder } = useWallet()
  const navigate = useNavigate()
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 220, tolerance: 8 } }))

  function cardsIn(folder: Folder): Card[] {
    return orderFolderCards(
      cards.filter(card => card.folderId === folder.id),
      folder.order,
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over === null || active.id === over.id) return
    haptic('light')
    moveFolder(String(active.id), String(over.id))
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[26rem]">
      <header className="flex items-center justify-between px-5 pt-safe pb-5">
        <AppWordmark section="Folders" />

        <div className="flex gap-2">
          <button
            onClick={() => setNewFolderOpen(true)}
            className={`${pressable} flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm`}
            aria-label="New folder"
          >
            <FolderPlusIcon className="size-5" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`${pressable} flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground`}
            aria-label="Settings"
          >
            <SettingsIcon className="size-5" />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-2 gap-3 px-5 pb-32">
        <button
          onClick={() => navigate('/folders/documents')}
          className={`${pressable} flex h-37 flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 bg-origin-border p-4 text-left shadow-sm ring-1 ring-white/10`}
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white/80">
            <IdCardIcon className="size-6" />
          </span>
          <span className="flex flex-col items-start">
            <span className="flex items-center gap-1.5 text-[1.375rem] leading-[1.3] font-extrabold tracking-tight text-white">
              Documents
              <LockIcon className="size-4.5 shrink-0 text-white/60" />
            </span>
            <span className="mt-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-xs">
              {documents.length} {documents.length === 1 ? 'card' : 'cards'}
            </span>
          </span>
        </button>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[clampToParent]}
          onDragStart={() => haptic('light')}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={folders.map(folder => folder.id)} strategy={rectSortingStrategy}>
            {folders.map(folder => (
              <SortableFolderTile
                key={folder.id}
                folder={folder}
                cards={cardsIn(folder)}
                onOpen={id => navigate(`/folders/${id}`)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={() => setNewFolderOpen(true)}
          className={`${pressable} flex h-37 flex-col items-center justify-center gap-2 rounded-2xl border-2! border-dashed! border-input! text-sm font-semibold text-muted-foreground hover:text-foreground`}
        >
          <PlusIcon className="size-5" />
          New folder
        </button>
      </main>

      <NewFolderDrawer
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreate={name => createFolder(name)}
      />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
