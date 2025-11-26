import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  BarChart3,
  Shield,
  AlertCircle,
  Edit3,
  Trash2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";

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

const UploadMpesaPdf = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingRow, setEditingRow] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  // Process extracted transactions from API response
  const processExtractedTransactions = (data) => {
    const extractedTransactions =
      data.expenses || data.transactions || data.data || [];

    return extractedTransactions.map((transaction, index) => ({
      id: index + 1,
      amount: transaction.amount || 0,
      date: transaction.date || new Date().toISOString().split("T")[0],
      description: transaction.description || "Unknown transaction",
      category: transaction.category || "Uncategorized",
      subcategory: transaction.subcategory || "Unknown",
      isSelected: true,
    }));
  };

  // Upload mutation - extracts transactions from PDF
  const { mutate: uploadMutate, isPending: isUploadPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await axiosInstance.post("/upload/mpesa", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("PDF processed successfully! Review your transactions.");
      const processedTransactions = processExtractedTransactions(data);
      setTransactions(processedTransactions);
      setIsUploaded(true);

      // Auto-select all transactions
      setSelectedRows(new Set(processedTransactions.map((t) => t.id)));
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to process PDF. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Save mutation - stores confirmed transactions in database
  const { mutate: saveMutate, isPending: isSavePending } = useMutation({
    mutationFn: async (confirmedTransactions) => {
      const response = await axiosInstance.post("/transactions/save", {
        transactions: confirmedTransactions.map((transaction) => ({
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
      toast.success(`Successfully saved ${data.savedCount} transactions!`);
      // Reset everything
      setFile(null);
      setFileName("");
      setTransactions([]);
      setSelectedRows(new Set());
      setIsUploaded(false);
      setError("");

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save transactions. Please try again.";
      toast.error(errorMessage);
    },
  });

  const validateFile = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      setError("Please select a file");
      return false;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file only");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return false;
    }

    if (selectedFile.size === 0) {
      setError("File appears to be empty");
      return false;
    }

    return true;
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsUploaded(false);
      setTransactions([]);
      setSelectedRows(new Set());
      setError("");
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const removeFile = () => {
    setFile(null);
    setFileName("");
    setTransactions([]);
    setSelectedRows(new Set());
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("mpesaStatement", file);
      formData.append("fileName", fileName);

      uploadMutate(formData);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsUploading(false);
    }
  };

  const handleEdit = (transactionId) => {
    setEditingRow(transactionId);
  };

  const handleSaveEdit = (transactionId, field, value) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, [field]: value }
          : transaction
      )
    );
    setEditingRow(null);
  };

  const handleDelete = (transactionId) => {
    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== transactionId)
    );
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(transactionId);
      return newSet;
    });
  };

  const toggleRowSelection = (transactionId) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === transactions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleSaveTransactions = () => {
    const transactionsToSave = transactions.filter((transaction) =>
      selectedRows.has(transaction.id)
    );

    if (transactionsToSave.length === 0) {
      toast.error("Please select at least one transaction to save");
      return;
    }

    saveMutate(transactionsToSave);
  };

  const getSelectedCount = () => {
    return selectedRows.size;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const handleBackToUpload = () => {
    setIsUploaded(false);
    setTransactions([]);
    setSelectedRows(new Set());
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="space-y-6">
          {/* Upload Section - Only show when no transactions to review */}
          {!isUploaded && (
            <div className="space-y-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="upload-area"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`border-3 border-dashed rounded-2xl p-6 transition-all duration-300 ${
                      isDragging
                        ? "border-purple-400 bg-purple-50"
                        : error
                        ? "border-red-200 bg-red-50"
                        : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ y: isDragging ? -5 : 0 }}
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${
                          error
                            ? "bg-red-100"
                            : "bg-gradient-to-r from-purple-100 to-indigo-100"
                        }`}
                      >
                        {isDragging ? (
                          <Upload className="w-6 h-6 text-purple-500" />
                        ) : error ? (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <FileText className="w-6 h-6 text-purple-500" />
                        )}
                      </motion.div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {isDragging ? "Drop PDF here" : "Upload M-Pesa PDF"}
                      </h3>

                      <p className="text-gray-500 text-sm mb-4">
                        Drag & drop your statement or click to browse
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerFileInput}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all text-sm"
                      >
                        Choose PDF File
                      </motion.button>

                      <p className="text-xs text-gray-400 mt-3">
                        PDF format only • Max {formatFileSize(MAX_FILE_SIZE)}
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-indigo-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">
                            {fileName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {file && formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={removeFile}
                        className="p-1 hover:bg-white rounded-lg transition-colors"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </motion.button>
                    </div>

                    {isUploading && (
                      <div className="w-full bg-purple-200 rounded-full h-1.5 mb-2">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2 }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Button */}
              <AnimatePresence>
                {file && !isUploaded && (
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
                          <span className="text-white">
                            {isUploadPending ? "Uploading..." : "Processing..."}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white">Analyze Statement</span>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Transactions Review Table */}
          {isUploaded && transactions.length > 0 && (
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
                <div className="text-sm text-gray-600">
                  {getSelectedCount()} of {transactions.length} selected
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={
                              selectedRows.size === transactions.length &&
                              transactions.length > 0
                            }
                            onChange={toggleAllSelection}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Subcategory
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(transaction.id)}
                              onChange={() =>
                                toggleRowSelection(transaction.id)
                              }
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                            {transaction.description}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <span
                              className={
                                transaction.amount < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {editingRow === transaction.id ? (
                              <select
                                value={transaction.category}
                                onChange={(e) =>
                                  handleSaveEdit(
                                    transaction.id,
                                    "category",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                autoFocus
                              >
                                {Object.keys(CATEGORIES).map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{transaction.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {editingRow === transaction.id ? (
                              <select
                                value={transaction.subcategory}
                                onChange={(e) =>
                                  handleSaveEdit(
                                    transaction.id,
                                    "subcategory",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                {CATEGORIES[transaction.category]?.map(
                                  (subcategory) => (
                                    <option
                                      key={subcategory}
                                      value={subcategory}
                                    >
                                      {subcategory}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <span>{transaction.subcategory}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {editingRow === transaction.id ? (
                                <button
                                  onClick={() => setEditingRow(null)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEdit(transaction.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(transaction.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Transactions Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveTransactions}
                disabled={isSavePending || getSelectedCount() === 0}
                className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all text-sm ${
                  isSavePending || getSelectedCount() === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25 hover:shadow-xl"
                }`}
              >
                {isSavePending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white">Saving...</span>
                  </div>
                ) : (
                  <span className="text-white">
                    Save {getSelectedCount()} Transaction
                    {getSelectedCount() !== 1 ? "s" : ""}
                  </span>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Features & Benefits - Show when no transactions to review */}
          {!isUploaded && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  What We Analyze
                </h3>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Transaction amounts and dates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Payment recipients
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Transaction fees
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Balance history
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Security & Privacy
                </h3>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Bank-level encryption</li>
                  <li>• Automatic file deletion</li>
                  <li>• No personal data stored</li>
                  <li>• SSL secured</li>
                </ul>
              </div>

              {/* Quick Tips */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-800">
                  💡 <strong>Tip:</strong> Download statement from M-Pesa app or
                  Safaricom website
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UploadMpesaPdf;
