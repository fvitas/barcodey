import { useEffect, useState } from 'react'
import { loadBrandCatalog, loadedBrandIndex, type Brand } from '@/lib/brands'

// undefined = catalog still loading, null = no brand, unknown id, or the catalog failed to load
export function useBrand(brandId: string | undefined): Brand | null | undefined {
  // the index lives in state, not a module read at render — the React Compiler memoizes those
  const [index, setIndex] = useState(loadedBrandIndex)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (index !== null || brandId === undefined) return
    let cancelled = false
    loadBrandCatalog().then(
      () => {
        if (!cancelled) setIndex(loadedBrandIndex())
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [index, brandId])

  if (brandId === undefined || failed) return null
  if (index === null) return undefined
  return index.get(brandId) ?? null
}
