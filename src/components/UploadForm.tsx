"use client";

import { useState, useRef } from "react";
import { FiUpload, FiLink } from "react-icons/fi";
import { useAuth } from "@clerk/nextjs";

interface UploadFormProps {
  brandId: number;
  onClose: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ brandId, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const { getToken } = useAuth();

  const logWithTimestamp = (message: string, data: any = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, {
      ...data,
      environment: process.env.NODE_ENV || "unknown",
    });
  };

  const handleFileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || !fileInputRef.current?.files?.[0]) {
      setError("Please select a video file.");
      logWithTimestamp("Form ref or file missing");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    logWithTimestamp("Submitting file upload", { brandId });

    const formData = new FormData(formRef.current);

    const attemptUpload = async (): Promise<void> => {
      try {
        const stream = new ReadableStream({
          start(controller) {
            const reader = (formData as any).get("reel").stream().getReader();
            let loaded = 0;
            const total = (formData as any).get("reel").size;

            const pump = async () => {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                return;
              }
              loaded += value.length;
              const percentComplete = (loaded / total) * 100;
              setProgress(percentComplete);
              logWithTimestamp("Upload progress", { percentComplete });
              controller.enqueue(value);
              pump();
            };
            pump();
          },
        });

        const response = await fetch("/api/upload-reel", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(600000),
        });

        logWithTimestamp("Fetch response", {
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
            logWithTimestamp("Failed to parse success response", { error: errorMessage, text });
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
            let details = "";
            if (!text) {
              errorMsg = `HTTP ${response.status || "Unknown"}`;
              details = response.statusText ? ` - ${response.statusText}` : " - No response body";
            } else {
              try {
                const errorResponse = JSON.parse(text);
                errorMsg = errorResponse.error || `HTTP ${response.status || "Unknown"}`;
                details = errorResponse.details ? ` - ${errorResponse.details}` : "";
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                logWithTimestamp("Failed to parse error response", { error: errorMessage, text });
                errorMsg = response.status ? `HTTP ${response.status}` : "Unknown error";
                details = response.statusText ? ` - ${response.statusText}` : " - Invalid response";
              }
            }
            setError(`Upload failed: ${errorMsg}${details}`);
            retryCountRef.current = 0;
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorName = error instanceof Error ? error.name : "Unknown";
        logWithTimestamp("Fetch error", { message: errorMessage, name: errorName });
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

  const handleLinkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!driveLink.trim()) {
      setError("Please enter a Google Drive video link.");
      logWithTimestamp("Drive link empty");
      return;
    }

    // Check for folder links
    const folderRegex = /drive\.google\.com\/drive\/folders\//;
    if (folderRegex.test(driveLink)) {
      setError("Folder links are not allowed. Please provide a direct video file link (e.g., https://drive.google.com/file/d/...).");
      logWithTimestamp("Folder link detected", { driveLink });
      return;
    }

    // Validate video file link
    const driveLinkRegex = /^https:\/\/(drive\.google\.com\/(file\/d\/|open\?id=)|docs\.google\.com\/.*\/d\/)[a-zA-Z0-9_-]+(\/(view|preview|edit|embed)?)?(\?.*)?$/;
    if (!driveLinkRegex.test(driveLink)) {
      setError("Invalid Google Drive video link. Use a direct video file link like https://drive.google.com/file/d/...");
      logWithTimestamp("Invalid Drive link format", { driveLink, regexTest: driveLinkRegex.test(driveLink) });
      return;
    }

    setUploading(true);
    setError(null);
    logWithTimestamp("Submitting Drive link", { brandId, driveLink });

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/submit-drive-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandId, driveLink }),
      });

      logWithTimestamp("Drive link submission response", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const text = await response.text();
      logWithTimestamp("Raw response text", { text: text || "(empty)" });

      if (response.ok) {
        try {
          const json = text ? JSON.parse(text) : { message: "No response body" };
          logWithTimestamp("Drive link saved", json);
          setUploading(false);
          alert("Drive link submitted successfully!");
          window.location.reload();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          logWithTimestamp("Failed to parse success response", { error: errorMessage, text });
          setError("Submission completed but response invalid. Please refresh.");
          setUploading(false);
        }
      } else {
        logWithTimestamp("Drive link submission failed", {
          status: response.status,
          statusText: response.statusText,
          text,
        });
        setUploading(false);
        let errorMsg = "Server error";
        let details = "";
        if (!text) {
          errorMsg = `HTTP ${response.status || "Unknown"}`;
          details = response.statusText ? ` - ${response.statusText}` : " - No response body";
        } else {
          try {
            const errorResponse = JSON.parse(text);
            errorMsg = errorResponse.error || `HTTP ${response.status || "Unknown"}`;
            details = errorResponse.details ? ` - ${errorResponse.details}` : "";
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            logWithTimestamp("Failed to parse error response", { error: errorMessage, text });
            errorMsg = response.status ? `HTTP ${response.status}` : "Unknown error";
            details = response.statusText ? ` - ${response.statusText}` : " - Invalid response";
          }
        }
        setError(`Submission failed: ${errorMsg}${details}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logWithTimestamp("Fetch error for Drive link", { message: errorMessage });
      setUploading(false);
      setError(`Submission failed: ${errorMessage || "Please check your connection and try again."}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setError(null);
      return;
    }

    const maxSize = 600 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 600MB. Please select a smaller video.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload an MP4, WebM, or MPEG video file.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    logWithTimestamp("Selected file", { name: file.name, size: file.size, type: file.type });
    setFileName(file.name);
    setError(null);
  };

  return (
    <div className="backdrop-blur-md bg-black/40 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform transition-all hover:scale-[1.02] perspective-1000">
      <div className="flex mb-4 border-b border-gray-600">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "file"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("file")}
        >
          Upload File
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "link"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("link")}
        >
          Add Drive Link
        </button>
      </div>

      {activeTab === "file" ? (
        <form
          ref={formRef}
          onSubmit={handleFileSubmit}
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
              <span className="text-white">{fileName || "Choose a video file"}</span>
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
      ) : (
        <form onSubmit={handleLinkSubmit} className="space-y-6">
          <input type="hidden" name="brandId" value={brandId} />
          <div>
            <label
              htmlFor="driveLink"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Paste Google Drive Video File Link
            </label>
            <div className="relative flex items-center p-4 rounded-lg bg-gray-800/50 border border-gray-600">
              <FiLink className="text-blue-400 text-2xl mr-2" />
              <input
                type="text"
                id="driveLink"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value.trim())}
                placeholder="https://drive.google.com/file/d/xyz/view"
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                disabled={uploading}
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Use a direct video file link (e.g., https://drive.google.com/file/d/xyz/view), not a folder link. Ensure it’s publicly viewable or shared with access.
            </p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? "Submitting..." : "Submit Link"}
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
      )}
    </div>
  );
};

export default UploadForm;