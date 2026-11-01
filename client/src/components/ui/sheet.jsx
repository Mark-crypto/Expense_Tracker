import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// A side panel: keeps the page visible behind it, unlike a centred dialog.
export const Sheet = ({ open, onClose, title, children, onOpenAutoFocus }) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent
      aria-describedby={undefined}
      onOpenAutoFocus={onOpenAutoFocus}
      className="top-0 right-0 left-auto flex h-dvh max-w-[min(100vw,27rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-y-0 border-r-0 bg-card p-0 duration-300 data-[state=closed]:slide-out-to-right data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-right data-[state=open]:zoom-in-100 sm:max-w-[27rem]"
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {children}
    </DialogContent>
  </Dialog>
);
