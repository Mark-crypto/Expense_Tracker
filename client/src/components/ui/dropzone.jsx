import { useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export const Dropzone = ({ inputRef, accept, onFile, icon: Icon, title, buttonLabel, hint }) => {
  const [isDragging, setIsDragging] = useState(false);
  const ShownIcon = isDragging ? UploadSimple : Icon;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFile(e.dataTransfer.files[0]);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragging ? "border-primary bg-accent/60" : "border-input"
      )}
    >
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-accent">
        <ShownIcon className="size-5 text-accent-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium">{isDragging ? "Drop it here" : title}</p>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">{hint}</p>
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
};
