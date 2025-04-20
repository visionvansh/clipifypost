"use client";

import { useState, useRef } from "react";
import { FiUpload, FiFile } from "react-icons/fi";

interface UploadFormProps {
  brandId: number;
  onClose: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ brandId, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) {
      console.error("Form ref missing");
      return;
    }

    setUploading(true);
    setProgress(0);
    console.log("Submitting form for brandId:", brandId);

    const formData = new FormData(formRef.current);

    const attemptUpload = async (): Promise<void> => {
      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(percentComplete);
            console.log("Upload progress:", percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          console.log("XHR load event, status:", xhr.status, "response:", xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log("Upload response:", response);
              setUploading(false);
              retryCountRef.current = 0; // Reset retries
              window.location.reload();
            } catch (err) {
              console.error("Failed to parse response:", err, "responseText:", xhr.responseText);
              setUploading(false);
              alert("Upload completed but response invalid. Please refresh.");
            }
          } else {
            console.error("Upload failed with status:", xhr.status, "response:", xhr.responseText);
            setUploading(false);
            try {
              const errorResponse = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              const errorMsg = errorResponse.error || "Unknown error";
              const details = errorResponse.details ? ` - ${errorResponse.details}` : "";
              alert(`Upload failed: ${errorMsg}${details}`);
            } catch (err) {
              console.error("Failed to parse error response:", err, "responseText:", xhr.responseText);
              alert(`Upload failed: ${xhr.status} ${xhr.statusText || "Server error"}`);
            }
          }
        });

        xhr.addEventListener("error", () => {
          console.error("XHR error event, response:", xhr.responseText);
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            console.log(`Retrying upload, attempt ${retryCountRef.current + 1}`);
            setTimeout(() => attemptUpload(), 2000); // Retry after 2s
          } else {
            setUploading(false);
            alert("Upload failed due to a network or server error. Please check your connection and try again.");
            retryCountRef.current = 0; // Reset retries
          }
        });

        xhr.addEventListener("timeout", () => {
          console.error("XHR timeout event");
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            console.log(`Retrying upload, attempt ${retryCountRef.current + 1}`);
            setTimeout(() => attemptUpload(), 2000); // Retry after 2s
          } else {
            setUploading(false);
            alert("Upload timed out. Please try again with a better connection.");
            retryCountRef.current = 0; // Reset retries
          }
        });

        xhr.timeout = 300000; // 5-minute timeout
        xhr.open("POST", "/api/upload-reel");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.send(formData);
      } catch (error) {
        console.error("Submit error:", error);
        setUploading(false);
        alert("Upload failed. Please try again.");
      }
    };

    await attemptUpload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }

    // Validate file size (600MB = 600 * 1024 * 1024 bytes)
    const maxSize = 600 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 600MB. Please select a smaller video.");
      e.target.value = ""; // Clear the input
      setFileName(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload an MP4, WebM, or MPEG video file.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    console.log("Selected file:", { name: file.name, size: file.size, type: file.type });
    setFileName(file.name);
  };

  return (
    <div className="backdrop-blur-md bg-black/40 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform transition-all hover:scale-[1.02] perspective-1000">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <input type="hidden" name="brandId" value={brandId} />
        <div>
          <label
            htmlFor="reel"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Upload Reel (Max 600MB, MP4/WebM/MPEG)
          </label>
          <div
            className="relative flex items-center justify-center p-4 rounded-lg bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="reel"
              id="reel"
              accept="video/mp4,video/webm,video/mpeg"
              className="hidden"
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            <FiUpload className="text-blue-400 text-2xl mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-white">
              {fileName || "Choose a video file"}
            </span>
          </div>
        </div>
        <div>
          <progress
            value={progress}
            max="100"
            className={`w-full h-3 rounded-full bg-gray-700/50 [&::-webkit-progress-bar]:bg-gray-700/50 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-blue-500 [&::-webkit-progress-value]:to-purple-600 [&::-webkit-progress-value]:rounded-full transition-all duration-300 ${
              uploading ? "block" : "hidden"
            }`}
          ></progress>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rotate-3d"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Reel"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;