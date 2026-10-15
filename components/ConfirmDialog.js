'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/**
 * "Are you sure?" — the one shape for it.
 *
 * Three destructive actions in the app used to take effect on a single tap and
 * were unrecoverable: logging out (from /profile and the account menu) and
 * clearing the notification history. CreateFlareForm's discard confirmation was
 * the only one that asked, and it was assembled inline out of eight primitives.
 * This is that assembly, once, so a fourth confirmation is a five-line call
 * rather than a fourth opinion about how one should look.
 *
 * `tone="danger"` styles the confirm button as the destructive action it is;
 * `tone="brand"` is for a confirmation that merely can't be undone.
 *
 * @param {boolean}  open
 * @param {Function} onOpenChange
 * @param {Function} onConfirm     called after the dialog closes itself
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              tone === 'danger' &&
                'bg-danger-strong text-destructive-foreground shadow-e1 hover:bg-danger-strong/90'
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
