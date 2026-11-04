import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// A plain yes-or-no question. For permanent deletions, use ConfirmDelete, which asks for a typed word.
export const Confirm = ({ open, title, description, confirmLabel, cancelLabel = "Keep it", danger, loading, onCancel, onConfirm }) => (
  <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
