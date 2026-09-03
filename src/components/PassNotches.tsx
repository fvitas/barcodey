import { AnimatePresence, motion } from 'motion/react'

type PassNotchesProps = {
  active: boolean
}

// punch holes sit on the divider and extend past the card edge so they cut the drop shadow too;
// on close they stay through the fold-up, then shrink as the corners round off
export function PassNotches({ active }: PassNotchesProps) {
  return (
    <AnimatePresence initial={false}>
      {active && (
        <>
          <motion.span
            key="notch-left"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
            exit={{ scale: 0, transition: { delay: 0.18, duration: 0.15, ease: 'easeOut' } }}
            className="absolute -bottom-3 -left-3 z-10 size-6 rounded-full bg-background"
          />
          <motion.span
            key="notch-right"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
            exit={{ scale: 0, transition: { delay: 0.18, duration: 0.15, ease: 'easeOut' } }}
            className="absolute -right-3 -bottom-3 z-10 size-6 rounded-full bg-background"
          />
        </>
      )}
    </AnimatePresence>
  )
}
