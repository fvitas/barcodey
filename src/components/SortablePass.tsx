import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVerticalIcon } from 'lucide-react'
import { WallPass } from '@/components/WallPass'
import type { Card, ViewMode } from '@/lib/model'

type SortablePassProps = {
  card: Card
  active: boolean
  view: ViewMode
  draggable: boolean
  trailing?: React.ReactNode
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export function SortablePass({ card, active, view, draggable, trailing, ...passProps }: SortablePassProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !draggable,
  })

  // list drags from the grip handle; grid tiles drag as a whole (press-and-hold sensor)
  const gridDrag = draggable && view === 'grid' && !active
  const gripHandle = draggable && (view === 'list' || active) && (
    <button
      {...attributes}
      {...listeners}
      aria-label="Reorder"
      className="relative -ml-1 shrink-0 cursor-grab touch-none p-1 text-white/60 active:cursor-grabbing"
    >
      <GripVerticalIcon className="size-5" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: gridDrag ? 'manipulation' : undefined,
      }}
      className={`${isDragging ? 'relative z-20' : ''} ${view === 'grid' && active ? 'col-span-2' : ''}`}
      {...(gridDrag ? { ...attributes, ...listeners } : {})}
    >
      <WallPass card={card} active={active} view={view} leading={gripHandle || undefined} trailing={trailing} {...passProps} />
    </div>
  )
}
