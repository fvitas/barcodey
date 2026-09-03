import { useState } from 'react'
import { haptic } from '@/lib/haptics'
import type { Card } from '@/lib/model'
import { useUiState } from '@/state/ui-state-context'
import { useWallet } from '@/state/wallet-context'

// per-card actions shared by the wallet and folder screens so the behaviors never drift
export function useCardActions() {
  const { cards, removeCard, updateCard } = useWallet()
  const { state, update } = useUiState()
  const [pendingDelete, setPendingDelete] = useState<Card | null>(null)

  function handleToggle(id: string) {
    haptic('light')
    update({ expandedCardId: state.expandedCardId === id ? null : id })
  }

  function handleDelete(id: string) {
    const card = cards.find(current => current.id === id)
    if (card !== undefined) setPendingDelete(card)
  }

  function handleConfirmDelete() {
    if (pendingDelete === null) return
    haptic('medium')
    removeCard(pendingDelete.id)
    if (state.expandedCardId === pendingDelete.id) {
      update({ expandedCardId: null })
    }
    setPendingDelete(null)
  }

  function handleToggleFavorite(id: string) {
    const card = cards.find(current => current.id === id)
    if (card !== undefined) {
      haptic('light')
      updateCard(id, { favorite: !card.favorite })
    }
  }

  return { pendingDelete, setPendingDelete, handleToggle, handleDelete, handleConfirmDelete, handleToggleFavorite }
}
