"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import axios from "axios";

export default function UploadTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setUploadResponse(null); // Clear previous response
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // Using a temporary endpoint for testing, e.g., /upload/profile
      const response = await axios.post(
        "/api/v1/upload/profile", // Assuming this endpoint exists and is protected
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploadResponse(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Upload failed:", err);
      if (err.response) {
        setError(`Upload failed: ${err.response.data?.message || err.message}`);
      } else {
        setError(`Upload failed: ${err.message}`);
      }
      setUploadResponse(null);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Image Upload</h1>

      <div className="mb-6 p-6 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center">
        <input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          className="mb-4"
        />
        {selectedFile && (
          <p className="text-sm text-neutral-600 mb-4">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </p>
        )}
        <Button onClick={handleUpload} disabled={!selectedFile} className="px-8 py-3">
          Upload Image
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {uploadResponse && uploadResponse.success && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold mb-2">Upload Successful!</h3>
          <p>
            <span className="font-semibold">URL:</span> {uploadResponse.data.url}
          </p>
          <p>
            <span className="font-semibold">Public ID:</span> {uploadResponse.data.public_id}
          </p>
          {/* Optional: Display the image */}
          <div className="mt-4 w-48 h-48 relative rounded overflow-hidden border border-neutral-200">
            <Image src={uploadResponse.data.url} alt="Uploaded Image" layout="fill" objectFit="cover" />
          </div>
        </div>
      )}
      {!uploadResponse && !error && (
        <p className="text-neutral-500 text-center">Upload your image to see the results here.</p>
      )}
    </div>
  );
}
