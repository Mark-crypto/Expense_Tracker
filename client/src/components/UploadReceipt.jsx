import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, Input, Select } from "@/components/ui/field";

// Categories for the form
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

const emptyForm = {
  amount: "",
  date: "",
  description: "",
  category: "Uncategorized",
  subcategory: "Unknown",
  merchant: "",
};

const UploadReceipt = () => {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const removeImage = () => {
    setPreview(null);
    setFile(null);
    setIsEditing(false);
    setFormData(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { mutate: uploadMutate, isPending: isUploadPending } = useMutation({
    mutationFn: async (body) => {
      const response = await axiosInstance.post("/upload/receipt", body, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Receipt read. Review the details.");
      const extracted = data.extractedData || data;
      setFormData({
        amount: extracted.amount || "",
        date: extracted.date || new Date().toISOString().split("T")[0],
        description: extracted.description || "Receipt Purchase",
        category: extracted.category || "Expenses",
        subcategory: extracted.subcategory || "Healthcare",
        merchant: extracted.merchant || "",
      });
      setIsEditing(true);
    },
    onError: (error) => {
      let message = "Failed to process the receipt. Please try again.";
      if (error.code === "ECONNABORTED") {
        message = "That took too long. Please try a clearer image.";
      } else if (error.response?.status === 408) {
        message = "Reading timed out. Please try a smaller or clearer image.";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    },
  });

  const { mutate: saveMutate, isPending: isSavePending } = useMutation({
    mutationFn: async (expenseData) => {
      const response = await axiosInstance.post("/expenses/save", expenseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Expense saved");
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      removeImage();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to save expense. Please try again."),
  });

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setIsEditing(false);
  };

  const handleUpload = () => {
    const body = new FormData();
    body.append("receiptImage", file);
    uploadMutate(body);
  };

  const handleFormChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.date || !formData.description) {
      toast.error("Please fill in amount, date and description");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    saveMutate({
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      merchant: formData.merchant,
      receiptImage: file?.name || "",
      budgeted: false,
    });
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSaveExpense} className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          <ArrowLeft /> Back
        </Button>

        <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <img
            src={preview}
            alt="Your receipt"
            className="max-h-64 w-full rounded-lg border border-border object-contain"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (KES)" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleFormChange("amount", e.target.value)}
              />
            </Field>
            <Field label="Date" htmlFor="receiptDate">
              <Input
                id="receiptDate"
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
              />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
              />
            </Field>
            <Field label="Merchant" htmlFor="merchant" className="sm:col-span-2">
              <Input
                id="merchant"
                value={formData.merchant}
                onChange={(e) => handleFormChange("merchant", e.target.value)}
              />
            </Field>
            <Field label="Category" htmlFor="receiptCategory">
              <Select
                id="receiptCategory"
                value={formData.category}
                onChange={(e) => handleFormChange("category", e.target.value)}
              >
                {Object.keys(CATEGORIES).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type" htmlFor="receiptSubcategory">
              <Select
                id="receiptSubcategory"
                value={formData.subcategory}
                onChange={(e) => handleFormChange("subcategory", e.target.value)}
              >
                {CATEGORIES[formData.category]?.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <Button type="submit" className="w-full" loading={isSavePending}>
          {!isSavePending && <Save />}
          {isSavePending ? "Saving..." : "Save expense"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-72 w-full rounded-lg border border-border bg-muted object-contain"
          />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Remove image"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Dropzone
          inputRef={fileInputRef}
          accept="image/*"
          onFile={handleFile}
          icon={Camera}
          title="Drop a photo of your receipt here"
          hint="PNG or JPG, up to 10 MB"
          buttonLabel="Choose image"
        />
      )}

      {preview && (
        <Button className="w-full" loading={isUploadPending} onClick={handleUpload}>
          {isUploadPending ? "Reading receipt..." : "Read receipt"}
        </Button>
      )}
    </div>
  );
};

export default UploadReceipt;
