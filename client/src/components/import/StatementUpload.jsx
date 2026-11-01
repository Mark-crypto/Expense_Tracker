import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DeviceMobile, FileText, Info, WarningCircle, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Notice } from "@/components/ui/common";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, Input } from "@/components/ui/field";
import { formatFileSize } from "@/lib/format";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const fileProblem = (file) => {
  if (file.type !== "application/pdf") return "Please upload a PDF file";
  if (file.size === 0) return "This file appears to be empty";
  if (file.size > MAX_FILE_SIZE) return `File size must be under ${formatFileSize(MAX_FILE_SIZE)}`;
  return "";
};

const StatementUpload = ({ onRead }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const clearFile = () => {
    setFile(null);
    setPassword("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const read = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append("mpesaStatement", file);
      if (password) body.append("password", password);
      const response = await axiosInstance.post("/upload/mpesa", body, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    },
    onSuccess: onRead,
    onError: (err) => setError(err.response?.data?.message || "We couldn't read this PDF. Please try again."),
  });

  const chooseFile = (selected) => {
    if (!selected) return;
    const problem = fileProblem(selected);
    setError(problem);
    if (problem) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-4 py-5 sm:p-6">
        {error && (
          <Notice tone="danger" icon={WarningCircle}>
            {error}
          </Notice>
        )}

        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
              <FileText className="size-4 text-accent-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Remove file" onClick={clearFile}>
              <X />
            </Button>
          </div>
        ) : (
          <Dropzone
            inputRef={inputRef}
            accept="application/pdf"
            onFile={chooseFile}
            icon={DeviceMobile}
            title="Drop your M-Pesa statement here"
            hint="PDF, up to 10 MB"
            buttonLabel="Choose PDF"
          />
        )}

        {file && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              read.mutate();
            }}
          >
            <Field
              label="Statement password"
              htmlFor="statementPassword"
              hint="Safaricom sends this by SMS. Leave it blank if the PDF isn't protected."
            >
              <Input
                id="statementPassword"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" loading={read.isPending}>
              {read.isPending ? "Reading statement..." : "Read statement"}
            </Button>
          </form>
        )}

        <Notice icon={Info}>
          Nothing is saved until you confirm. Your password is only used to open the PDF and is never stored.
        </Notice>
      </CardContent>
    </Card>
  );
};

export default StatementUpload;
