// src/app/page.tsx
"use client";

import React, { useState } from "react";

type ImageData = {
  base64: string;
  type: string;
};

const Home: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData[]>([]);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = e.target.files;
    if (!files) return;
    if (files.length > 4) {
      setError("You can upload up to 4 images.");
      return;
    }
    const fileArray = Array.from(files);

    // Convert each file to a Base64 string
    Promise.all(
      fileArray.map(
        (file) =>
          new Promise<ImageData>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              if (typeof reader.result === "string") {
                // The result is a Data URL: "data:<mime-type>;base64,<data>"
                const resultStr = reader.result as string;
                const parts = resultStr.split(",");
                const base64 = parts[1];
                const mimeMatch = resultStr.match(/^data:(.*);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : file.type;
                resolve({ base64, type: mimeType });
              } else {
                reject("Failed to read file");
              }
            };
            reader.onerror = (error) => reject(error);
          })
      )
    )
      .then((data) => setImageData(data))
      .catch((err) => {
        console.error(err);
        setError("Error reading files.");
      });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (imageData.length === 0) {
      setError("Please select at least one image.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: imageData }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong");
      }
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      let message = "Error occurred";
      if (err instanceof Error) {
        message = err.message;
      }
      console.error(err);
      setError(message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h1>Grocery Items Identifier</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          multiple
          onChange={handleFileChange}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
      {result && (
        <div style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;
