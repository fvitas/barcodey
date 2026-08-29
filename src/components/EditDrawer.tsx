import { CameraIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from 'vaul'
import { BrandField } from '@/components/BrandField'
import { ColorRow } from '@/components/ColorRow'
import { CoverAdjust } from '@/components/CoverAdjust'
import { ExpiryDateField } from '@/components/ExpiryDateField'
import { PhotoField, usePhotoSrc } from '@/components/PhotoField'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { haptic } from '@/lib/haptics'
import { barcodeFormats, digitsOnlyFormats, formatLabels, type Card, type CardPhotos, type PhotoSide } from '@/lib/model'
import { extractPhotoColor } from '@/lib/photo-color'
import { bakePhotoRotations } from '@/lib/photos'
import { scanWithNativeScanner } from '@/lib/scanner'
import { capitalizeFirst, pressable } from '@/lib/utils'

type EditDrawerProps = {
  card: Card | null
  onClose: () => void
  onChange: (id: string, patch: Partial<Omit<Card, 'id'>>) => void
}

const coverOptions = ['none', 'front', 'back'] as const

export function EditDrawer({ card, onClose, onChange }: EditDrawerProps) {
  // pending quarter turns keyed by photo path — the one deferred edit: previewed live, baked on Done/close
  const [rotations, setRotations] = useState<Record<string, number>>({})
  // name edits buffer here so an emptied field never persists; null mirrors card.name
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [numberOpen, setNumberOpen] = useState(false)
  // same guard for the card number: an emptied field never persists
  const [valueDraft, setValueDraft] = useState<string | null>(null)
  const coverPath = card !== null && card.cover !== undefined ? card.photos[card.cover.side] : undefined
  const coverSrc = usePhotoSrc(coverPath)

  function handleRotate(path: string) {
    setRotations(current => ({ ...current, [path]: ((current[path] ?? 0) + 1) % 4 }))
  }

  function handlePhotosChange(current: Card, photos: CardPhotos) {
    // removing the photo used as cover falls back to the gradient face
    const coverGone = current.cover !== undefined && photos[current.cover.side] === undefined
    onChange(current.id, coverGone ? { photos, cover: undefined } : { photos })
    // auto-apply the photo color: the first photo always recolors, later ones only fill a missing color
    const added = (['front', 'back'] as const).find(
      side => photos[side] !== undefined && photos[side] !== current.photos[side],
    )
    const hadNoPhotos = current.photos.front === undefined && current.photos.back === undefined
    const addedPath = added !== undefined ? photos[added] : undefined
    if (addedPath !== undefined && (hadNoPhotos || current.color === undefined)) {
      void extractPhotoColor(addedPath).then(hex => hex !== null && onChange(current.id, { color: hex }))
    }
  }

  function handleNameChange(current: Card, value: string) {
    const name = capitalizeFirst(value)
    setNameDraft(name)
    if (name.trim() !== '') onChange(current.id, { name })
  }

  function handleValueChange(current: Card, value: string) {
    setValueDraft(value)
    if (value.trim() !== '') onChange(current.id, { value: value.trim() })
  }

  function handleRescan(current: Card) {
    void scanWithNativeScanner()
      .then(result => {
        if (result !== null) {
          haptic('success')
          setValueDraft(null)
          onChange(current.id, { value: result.value, format: result.format })
        }
      })
      .catch(() => {})
  }

  function handleClose() {
    setNameDraft(null)
    setValueDraft(null)
    setNumberOpen(false)
    if (card !== null && Object.keys(rotations).length > 0) {
      const { id, photos } = card
      const pending = rotations
      void bakePhotoRotations(photos, pending).then(baked => {
        if (baked !== photos) onChange(id, { photos: baked })
      })
    }
    setRotations({})
    onClose()
  }

  return (
    <Drawer.Root repositionInputs={false} open={card !== null} onOpenChange={open => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-[26rem] flex-col rounded-t-[1.75rem] bg-card outline-none">
          {card && (
            <>
              <div className="px-5 pt-3">
                <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-input" />
                <Drawer.Title className="mb-5 text-lg font-extrabold text-foreground">Edit card</Drawer.Title>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
                <label className="mb-5 block">
                  <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                    Name
                  </span>
                  <Input
                    value={nameDraft ?? card.name}
                    autoCapitalize="sentences"
                    className="h-11 px-4 text-sm font-semibold"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleNameChange(card, event.target.value)
                    }
                  />
                </label>

                <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                  Brand <span className="normal-case">(optional)</span>
                </span>
                <div className="mb-5">
                  <BrandField
                    brandId={card.brandId}
                    brandBg={card.brandBg}
                    onPick={brand => {
                      setNameDraft(null)
                      onChange(card.id, { brandId: brand.id, name: brand.name, color: brand.color })
                    }}
                    onClear={() => onChange(card.id, { brandId: undefined })}
                    onToggleBg={show => onChange(card.id, { brandBg: show ? undefined : false })}
                  />
                </div>

                <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                  Color
                </span>
                <div className="mb-5">
                  <ColorRow
                    theme={card.theme}
                    color={card.color}
                    photos={card.photos}
                    onPickTheme={theme => onChange(card.id, { theme, color: undefined })}
                    onPickColor={color => onChange(card.id, { color })}
                  />
                </div>

                <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                  Photos
                </span>
                <div className="mb-5">
                  <PhotoField photos={card.photos} onChange={photos => handlePhotosChange(card, photos)} />
                </div>

                {(card.photos.front !== undefined || card.photos.back !== undefined) && (
                  <>
                    <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                      Cover
                    </span>
                    <Tabs
                      value={card.cover?.side ?? 'none'}
                      onValueChange={value =>
                        onChange(card.id, {
                          cover: value === 'none' ? undefined : { side: value as PhotoSide, scale: 1, x: 0, y: 0 },
                        })
                      }
                      className={card.cover !== undefined ? 'mb-4' : 'mb-5'}
                    >
                      <TabsList className="h-11! w-full">
                        {coverOptions.map(option => (
                          <TabsTrigger
                            key={option}
                            value={option}
                            disabled={option !== 'none' && card.photos[option as PhotoSide] === undefined}
                            className="font-semibold capitalize"
                          >
                            {option === 'none' ? 'Color' : option}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {card.cover !== undefined && coverSrc !== null && coverPath !== undefined && (
                      <div className="mb-5">
                        <CoverAdjust
                          src={coverSrc}
                          cover={card.cover}
                          rotation={rotations[coverPath] ?? 0}
                          onChange={cover => onChange(card.id, { cover })}
                          onRotate={() => handleRotate(coverPath)}
                        />
                      </div>
                    )}
                  </>
                )}

                <ExpiryDateField value={card.expiry} onChange={expiry => onChange(card.id, { expiry })} />

                {numberOpen ? (
                  <div className="rounded-xl bg-muted/60 p-4">
                    <label className="mb-4 block">
                      <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                        Card number
                      </span>
                      <Input
                        value={valueDraft ?? card.value}
                        inputMode={digitsOnlyFormats.has(card.format) ? 'numeric' : undefined}
                        className="h-11 bg-card px-4 font-mono text-sm font-medium"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          handleValueChange(card, event.target.value)
                        }
                      />
                    </label>

                    <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                      Format
                    </span>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {barcodeFormats.map(option => (
                        <button
                          key={option}
                          onClick={() => onChange(card.id, { format: option })}
                          className={`${pressable} rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                            card.format === option
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {formatLabels[option]}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleRescan(card)}
                      className={`${pressable} flex w-full items-center justify-center gap-2 rounded-4xl bg-foreground py-3 text-sm font-bold text-background`}
                    >
                      <CameraIcon className="size-4.5" />
                      Rescan barcode
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNumberOpen(true)}
                    className={`${pressable} flex w-full items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left hover:bg-muted`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
                        {formatLabels[card.format]}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-sm font-medium tracking-widest text-muted-foreground">
                        {card.value}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary">
                      <PencilIcon className="size-3.5" />
                      Rescan or edit
                    </span>
                  </button>
                )}
              </div>

              <div className="px-5 pt-4 pb-8">
                <button
                  onClick={handleClose}
                  className={`${pressable} w-full rounded-4xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/80`}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
