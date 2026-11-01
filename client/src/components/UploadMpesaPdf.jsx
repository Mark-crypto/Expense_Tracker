import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AlertCircle, ArrowLeft, Check, FileText, Info, Pencil, Trash2, X } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/common";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, Input, Select } from "@/components/ui/field";
import { formatDate, formatFileSize, formatKES } from "@/lib/format";

// Mock categories and subcategories
const CATEGORIES = {
  Income: ["Salary", "Business", "Gift", "Refund", "Other Income"],
  Expenses: [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Education",
  ],
  Transfers: ["Send Money", "Withdraw", "Deposit", "Bank Transfer"],
  Savings: ["Investment", "Emergency Fund", "Goal Savings"],
  Uncategorized: ["Unknown"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const UploadMpesaPdf = () => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingRow, setEditingRow] = useState(null);
  const fileInputRef = useRef(null);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Process extracted transactions from API response
  const processExtractedTransactions = (data) => {
    const extracted = data.expenses || data.transactions || data.data || [];
    return extracted.map((transaction, index) => ({
      id: index + 1,
      amount: transaction.amount || 0,
      date: transaction.date || new Date().toISOString().split("T")[0],
      description: transaction.description || "Unknown transaction",
      category: transaction.category || "Uncategorized",
      subcategory: transaction.subcategory || "Unknown",
    }));
  };

  // Upload mutation - extracts transactions from PDF
  const { mutate: uploadMutate, isPending: isUploadPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await axiosInstance.post("/upload/mpesa", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const processed = processExtractedTransactions(data);
      setTransactions(processed);
      setIsUploaded(true);
      setSelectedRows(new Set(processed.map((t) => t.id)));
      if (processed.length > 0) {
        toast.success("Statement read. Review your transactions.");
      }
    },
    onError: (err) => {
      const message = err.response?.data?.message || "Failed to process the PDF. Please try again.";
      toast.error(message);
      setError(message);
    },
  });

  // Save mutation - stores confirmed transactions in database
  const { mutate: saveMutate, isPending: isSavePending } = useMutation({
    mutationFn: async (confirmed) => {
      const response = await axiosInstance.post("mpesa/save", {
        transactions: confirmed.map((transaction) => ({
          amount: transaction.amount,
          category: transaction.category,
          subcategory: transaction.subcategory,
          date: transaction.date,
          description: transaction.description,
          budgeted: false,
        })),
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Saved ${data.savedCount} transactions`);
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      removeFile();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save transactions. Please try again."),
  });

  const validateFile = (selectedFile) => {
    if (selectedFile.type !== "application/pdf") return "Please upload a PDF file";
    if (selectedFile.size === 0) return "This file appears to be empty";
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File size must be under ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return "";
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const problem = validateFile(selectedFile);
    setError(problem);
    if (problem) {
      clearFileInput();
      return;
    }
    setFile(selectedFile);
    setIsUploaded(false);
    setTransactions([]);
    setSelectedRows(new Set());
  };

  const removeFile = () => {
    setFile(null);
    setTransactions([]);
    setSelectedRows(new Set());
    setIsUploaded(false);
    setEditingRow(null);
    setError("");
    setPassword("");
    clearFileInput();
  };

  const handleUpload = () => {
    setError("");
    const formData = new FormData();
    formData.append("mpesaStatement", file);
    formData.append("fileName", file.name);
    if (password) formData.append("password", password);
    uploadMutate(formData);
  };

  const updateTransaction = (transactionId, field, value) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, [field]: value } : t))
    );
  };

  const handleDelete = (transactionId) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(transactionId);
      return next;
    });
  };

  const toggleRowSelection = (transactionId) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(transactionId) ? next.delete(transactionId) : next.add(transactionId);
      return next;
    });
  };

  const toggleAllSelection = () => {
    setSelectedRows(
      selectedRows.size === transactions.length ? new Set() : new Set(transactions.map((t) => t.id))
    );
  };

  const handleSaveTransactions = () => saveMutate(transactions.filter((t) => selectedRows.has(t.id)));

  const backToUpload = () => {
    setIsUploaded(false);
    setTransactions([]);
    setSelectedRows(new Set());
    setEditingRow(null);
  };

  if (isUploaded && transactions.length === 0) {
    return (
      <div className="space-y-4">
        <Notice tone="warning" icon={AlertCircle}>
          We couldn't find any spending in this statement. Check it's a full M-Pesa statement, or
          try another file.
        </Notice>
        <Button variant="secondary" onClick={removeFile}>
          <ArrowLeft /> Try another file
        </Button>
      </div>
    );
  }

  if (isUploaded) {
    const count = selectedRows.size;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={backToUpload}>
            <ArrowLeft /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            {count} of {transactions.length} selected
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    className="size-4"
                    checked={count === transactions.length}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="w-20 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const editing = editingRow === transaction.id;
                return (
                  <tr key={transaction.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${transaction.description}`}
                        className="size-4"
                        checked={selectedRows.has(transaction.id)}
                        onChange={() => toggleRowSelection(transaction.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="max-w-52 truncate px-3 py-2.5" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums">
                      {formatKES(Math.abs(transaction.amount), 2)}
                    </td>
                    <td className="px-3 py-2.5">
                      {editing ? (
                        <Select
                          aria-label="Category"
                          className="h-8 text-xs"
                          value={transaction.category}
                          onChange={(e) => updateTransaction(transaction.id, "category", e.target.value)}
                        >
                          {!CATEGORIES[transaction.category] && (
                            <option value={transaction.category}>{transaction.category}</option>
                          )}
                          {Object.keys(CATEGORIES).map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        transaction.category
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {editing ? (
                        <Select
                          aria-label="Type"
                          className="h-8 text-xs"
                          value={transaction.subcategory}
                          onChange={(e) =>
                            updateTransaction(transaction.id, "subcategory", e.target.value)
                          }
                        >
                          <option value={transaction.subcategory}>{transaction.subcategory}</option>
                          {CATEGORIES[transaction.category]
                            ?.filter((subcategory) => subcategory !== transaction.subcategory)
                            .map((subcategory) => (
                              <option key={subcategory} value={subcategory}>
                                {subcategory}
                              </option>
                            ))}
                        </Select>
                      ) : (
                        transaction.subcategory
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={editing ? "Finish editing" : "Edit"}
                          onClick={() => setEditingRow(editing ? null : transaction.id)}
                        >
                          {editing ? <Check /> : <Pencil />}
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Remove"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button
          className="w-full"
          loading={isSavePending}
          disabled={count === 0}
          onClick={handleSaveTransactions}
        >
          {isSavePending ? "Saving..." : `Save ${count} ${count === 1 ? "transaction" : "transactions"}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Notice tone="danger" icon={AlertCircle}>
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove file"
            disabled={isUploadPending}
            onClick={removeFile}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Dropzone
          inputRef={fileInputRef}
          accept="application/pdf"
          onFile={handleFile}
          icon={FileText}
          title="Drop your M-Pesa statement here"
          hint={`PDF only, up to ${formatFileSize(MAX_FILE_SIZE)}`}
          buttonLabel="Choose PDF"
        />
      )}

      {file && (
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
      )}

      {file && (
        <Button className="w-full" loading={isUploadPending} onClick={handleUpload}>
          {isUploadPending ? "Reading statement..." : "Read statement"}
        </Button>
      )}

      <Notice icon={Info}>
        You review every transaction before anything is saved. Your password is only used to open
        the PDF and is never stored.
      </Notice>
    </div>
  );
};

export default UploadMpesaPdf;
