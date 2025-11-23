import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Smartphone,
  BarChart3,
  Shield,
} from "lucide-react";

const UploadMpesaPdf = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsUploaded(false);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    // Simulate upload and processing
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsUploading(false);
    setIsUploaded(true);

    // Reset after success
    setTimeout(() => {
      setFile(null);
      setFileName("");
      setIsUploaded(false);
    }, 3000);
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

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
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
                      PDF format only • Max 10MB
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
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </motion.button>
                  </div>

                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
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
                    disabled={isUploading}
                    className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all text-sm ${
                      isUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/25 hover:shadow-xl"
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white">Processing...</span>
                      </div>
                    ) : (
                      <span className="text-white">Analyze Statement</span>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {isUploaded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800 text-sm mb-1">
                    Analysis Complete!
                  </h3>
                  <p className="text-green-600 text-xs">
                    Your M-Pesa transactions have been processed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Features & Benefits */}
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
        </div>
      </motion.div>
    </div>
  );
};

export default UploadMpesaPdf;
