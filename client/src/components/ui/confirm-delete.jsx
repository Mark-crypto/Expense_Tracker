import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

const WORD = "delete";

export const ConfirmDelete = ({ open, title, description, confirmLabel, onCancel, onConfirm, loading }) => {
  const [text, setText] = useState("");
  const close = () => {
    setText("");
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() !== WORD) return;
            setText("");
            onConfirm();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="confirmDelete">
              Type <span className="font-semibold">{WORD}</span> to confirm
            </Label>
            <Input
              id="confirmDelete"
              autoFocus
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={text.trim() !== WORD} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
