import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  CheckCircle,
  Camera,
  Edit3,
  Save,
  ArrowLeft,
  DollarSign,
  Calendar,
  Tag,
  FileDigit,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";

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

const UploadReceipt = () => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    date: "",
    description: "",
    category: "Uncategorized",
    subcategory: "Unknown",
    merchant: "",
  });

  // Update the upload mutation with better error handling
  const { mutate: uploadMutate, isPending: isUploadPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await axiosInstance.post("/upload/receipt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 45000, // 45 second timeout
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Receipt processed successfully! Review the details.");

      const extracted = data.extractedData || data;
      setExtractedData(extracted);

      setFormData({
        amount: extracted.amount || "",
        date: extracted.date || new Date().toISOString().split("T")[0],
        description: extracted.description || "Receipt Purchase",
        category: extracted.category || "Expenses",
        subcategory: extracted.subcategory || "Healthcare",
        merchant: extracted.merchant || "",
      });

      setIsUploaded(true);
      setIsEditing(true);
    },
    onError: (error) => {
      let errorMessage = "Failed to process receipt. Please try again.";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Processing took too long. Please try with a clearer image.";
      } else if (error.response?.status === 408) {
        errorMessage = "OCR timeout. Please try a smaller or clearer image.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      console.error("OCR Error:", error);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Save mutation - stores the expense in database
  const { mutate: saveMutate, isPending: isSavePending } = useMutation({
    mutationFn: async (expenseData) => {
      const response = await axiosInstance.post("/expenses/save", expenseData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Expense saved successfully!");

      // Reset everything
      setPreview(null);
      setFile(null);
      setExtractedData(null);
      setIsUploaded(false);
      setIsEditing(false);
      setFormData({
        amount: "",
        date: "",
        description: "",
        category: "Uncategorized",
        subcategory: "Unknown",
        merchant: "",
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save expense. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setIsUploaded(false);
      setExtractedData(null);
      setIsEditing(false);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const removeImage = () => {
    setPreview(null);
    setFile(null);
    setExtractedData(null);
    setIsUploaded(false);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a receipt image first");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("receiptImage", file);

      uploadMutate(formData);
    } catch (err) {
      toast.error("An unexpected error occurred");
      setIsUploading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveExpense = () => {
    // Validate required fields
    if (!formData.amount || !formData.date || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const expenseData = {
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      merchant: formData.merchant,
      receiptImage: file?.name || "",
      budgeted: false,
    };

    saveMutate(expenseData);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const handleBackToUpload = () => {
    setIsUploaded(false);
    setIsEditing(false);
    setExtractedData(null);
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="space-y-6">
          {/* Upload Section - Show when not editing extracted data */}
          {!isEditing && (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!preview ? (
                  <motion.div
                    key="upload-area"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`border-3 border-dashed rounded-2xl p-6 transition-all duration-300 ${
                      isDragging
                        ? "border-purple-400 bg-purple-50"
                        : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ y: isDragging ? -5 : 0 }}
                        className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl mb-3"
                      >
                        {isDragging ? (
                          <Upload className="w-6 h-6 text-purple-500" />
                        ) : (
                          <Camera className="w-6 h-6 text-purple-500" />
                        )}
                      </motion.div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {isDragging ? "Drop receipt here" : "Upload Receipt"}
                      </h3>

                      <p className="text-gray-500 text-sm mb-4">
                        Drag & drop or click to browse files
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={triggerFileInput}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all text-sm"
                        >
                          Choose File
                        </motion.button>
                      </div>

                      <p className="text-xs text-gray-400 mt-3">
                        PNG, JPG, JPEG up to 10MB
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview-area"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    {/* Preview Image */}
                    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <img
                        src={preview}
                        alt="Receipt Preview"
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={removeImage}
                          className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg transition-all"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Remove Button - Always visible on mobile */}
                    <button
                      onClick={removeImage}
                      className="sm:hidden absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg"
                    >
                      <X className="w-3 h-3 text-gray-700" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Button */}
              <AnimatePresence>
                {preview && !isUploaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <motion.button
                      whileHover={{ scale: isUploading ? 1 : 1.02 }}
                      whileTap={{ scale: isUploading ? 1 : 0.98 }}
                      onClick={handleUpload}
                      disabled={isUploading || isUploadPending}
                      className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all text-sm ${
                        isUploading || isUploadPending
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/25 hover:shadow-xl"
                      }`}
                    >
                      {isUploading || isUploadPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-white">Processing OCR...</span>
                        </div>
                      ) : (
                        <span className="text-white">Extract Receipt Data</span>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Extracted Data Review Form */}
          {isEditing && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToUpload}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Upload
                </button>
                <div className="text-sm text-gray-600">Review & Confirm</div>
              </div>

              {/* Receipt Preview */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">
                      Receipt Preview
                    </h4>
                    <p className="text-xs text-gray-500">
                      {file?.name || "Receipt image"}
                    </p>
                  </div>
                </div>
                <img
                  src={preview}
                  alt="Receipt"
                  className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                />
              </div>

              {/* Expense Form */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-500" />
                  Expense Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFormChange("date", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        handleFormChange("description", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="What was this expense for?"
                    />
                  </div>

                  {/* Merchant */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileDigit className="w-4 h-4" />
                      Merchant/Store
                    </label>
                    <input
                      type="text"
                      value={formData.merchant}
                      onChange={(e) =>
                        handleFormChange("merchant", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Where did you make this purchase?"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        handleFormChange("category", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {Object.keys(CATEGORIES).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag className="w-4 h-4" />
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) =>
                        handleFormChange("subcategory", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {CATEGORIES[formData.category]?.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveExpense}
                  disabled={isSavePending}
                  className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${
                    isSavePending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25 hover:shadow-xl"
                  }`}
                >
                  {isSavePending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-white">Save Expense</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Features - Show when not in edit mode */}
          {!isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3 text-center"
            >
              <div className="p-2 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Text Extraction</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <ImageIcon className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Auto-Crop</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Smart OCR</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UploadReceipt;
