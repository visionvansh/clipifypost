"use client";

import { useState, useRef } from "react";
import { FiUpload, FiFile } from "react-icons/fi";

interface UploadFormProps {
  brandId: number;
  onClose: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ brandId, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const logWithTimestamp = (message: string, data: any = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, {
      ...data,
      environment: process.env.NODE_ENV || "unknown",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) {
      logWithTimestamp("Form ref missing");
      setError("Form error. Please try again.");
      return;
    }

    setUploading(true);
    setError(null);
    logWithTimestamp("Submitting form", { brandId });

    const formData = new FormData(formRef.current);

    const attemptUpload = async (): Promise<void> => {
      try {
        logWithTimestamp("Sending fetch request to /api/upload-reel");
        const response = await fetch("/api/upload-reel", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(600000), // 10-minute timeout
        });

        logWithTimestamp("Fetch response received", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        const text = await response.text();
        logWithTimestamp("Raw response text", { text: text || "(empty)" });

        if (response.ok) {
          try {
            const json = text ? JSON.parse(text) : { message: "No response body" };
            logWithTimestamp("Upload response", json);
            setUploading(false);
            retryCountRef.current = 0;
            alert("Video uploaded successfully!");
            window.location.reload();
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            logWithTimestamp("Failed to parse success response", {
              error: errorMessage,
              text,
            });
            setError("Upload completed but response invalid. Please refresh.");
            setUploading(false);
          }
        } else {
          logWithTimestamp("Upload failed", {
            status: response.status,
            statusText: response.statusText,
            text,
          });
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            logWithTimestamp(`Retrying upload, attempt ${retryCountRef.current + 1}`);
            setTimeout(() => attemptUpload(), 2000);
          } else {
            setUploading(false);
            let errorMsg = "Server error";
            let details = "No additional details";
            if (!text) {
              errorMsg = `HTTP ${response.status || "Unknown"}`;
              details = response.statusText || "Empty response";
            } else {
              try {
                const errorResponse = JSON.parse(text);
                errorMsg = errorResponse.error || `HTTP ${response.status || "Unknown"}`;
                details = errorResponse.details || "Invalid response format";
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                logWithTimestamp("Failed to parse error response", {
                  error: errorMessage,
                  text,
                });
                errorMsg = response.status ? `HTTP ${response.status}` : "Unknown error";
                details = text || "Malformed response";
              }
            }
            setError(`Upload failed: ${errorMsg} - ${details}`);
            retryCountRef.current = 0;
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorName = error instanceof Error ? error.name : "Unknown";
        const errorStack = error instanceof Error ? error.stack : undefined;
        logWithTimestamp("Fetch error", {
          message: errorMessage,
          name: errorName,
          stack: errorStack,
        });
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          logWithTimestamp(`Retrying upload, attempt ${retryCountRef.current + 1}`);
          setTimeout(() => attemptUpload(), 2000);
        } else {
          setUploading(false);
          const errorMsg = errorName === "TimeoutError" ? "Upload timed out" : "Network or client error";
          setError(`${errorMsg}: ${errorMessage || "Please check your connection and try again."}`);
          retryCountRef.current = 0;
        }
      }
    };

    await attemptUpload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setError(null);
      return;
    }

    // Validate file size (600MB = 600 * 1024 * 1024 bytes)
    const maxSize = 600 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 600MB. Please select a smaller video.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload an MP4, WebM, or MPEG video file.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    logWithTimestamp("Selected file", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setFileName(file.name);
    setError(null);
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
        {error && <p className="text-red-400 text-sm">{error}</p>}
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