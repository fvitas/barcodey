import { CheckIcon, ChevronLeftIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from 'vaul'
import { Input } from '@/components/ui/input'
import { searchCountries, type Country } from '@/lib/countries'
import { pressable } from '@/lib/utils'

type CountryPickerProps = {
  open: boolean
  selected: string
  onClose: () => void
  onPick: (country: Country) => void
}

export function CountryPicker({ open, selected, onClose, onPick }: CountryPickerProps) {
  const [query, setQuery] = useState('')
  const countries = searchCountries(query)

  function handleClose() {
    setQuery('')
    onClose()
  }

  function handlePick(country: Country) {
    setQuery('')
    onPick(country)
  }

  return (
    <Drawer.NestedRoot repositionInputs={false} open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/40" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[110] mx-auto flex h-[90dvh] max-w-[26rem] flex-col rounded-t-[1.75rem] bg-card outline-none">
          <div className="flex items-center gap-1 px-3 pt-4 pb-2">
            <button
              onClick={handleClose}
              aria-label="Back"
              className={`${pressable} flex size-10 items-center justify-center rounded-full text-primary`}
            >
              <ChevronLeftIcon className="size-6" />
            </button>
            <Drawer.Title className="text-lg font-extrabold text-foreground">Choose country</Drawer.Title>
          </div>

          <div className="px-5 pb-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                placeholder="Search countries"
                className="h-11 pl-10 text-sm font-semibold"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
            {countries.length === 0 && (
              <p className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">
                No countries match “{query.trim()}”
              </p>
            )}
            {countries.map(country => (
              <button
                key={country.code}
                onClick={() => handlePick(country)}
                className={`${pressable} flex h-12 w-full items-center gap-3 px-5 text-left`}
              >
                <span className={`fi fi-${country.code} shrink-0 rounded-[3px] text-lg ring-1 ring-black/10`} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{country.name}</span>
                {country.code === selected && <CheckIcon className="size-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  )
}
