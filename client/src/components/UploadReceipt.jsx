import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  CheckCircle,
  Camera,
} from "lucide-react";

const UploadReceipt = () => {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
      setIsUploaded(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
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
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const removeImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsUploading(true);
    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
    setIsUploaded(true);

    // Reset after success
    setTimeout(() => {
      setPreview(null);
      setIsUploaded(false);
    }, 3000);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="space-y-6">
          {/* Upload Area */}
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

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2.5 border-2 border-purple-200 text-purple-600 font-medium rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
                    >
                      Take Photo
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
                    <span className="text-white">Save & Process Receipt</span>
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
                  Receipt Uploaded!
                </h3>
                <p className="text-green-600 text-xs">
                  Your expense has been recorded and processed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features */}
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
        </div>
      </motion.div>
    </div>
  );
};

export default UploadReceipt;
