import { AnimatePresence, motion } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Shared modal shell (backdrop + centered card, same look as
// features/auth/ConsentModal.tsx) so every confirmation dialog in the app
// stays visually consistent instead of falling back to the browser's
// native confirm().
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 text-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm text-neutral-300">{description}</p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className={
                  destructive
                    ? 'rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500'
                    : 'rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200'
                }
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-400 transition hover:text-white"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
