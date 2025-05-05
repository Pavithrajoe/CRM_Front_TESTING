import React, { useState } from "react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const NewComment = () => {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 2MB limit.");
      setFile(null);
    } else {
      setError("");
      setFile(selectedFile);
    }
  };

  return (
    <div className="border rounded p-4 bg-white w-full max-w-2xl shadow mx-auto">
      {/* Top Buttons */}
      <div className="flex flex-wrap space-x-2 mb-4">
        <button className="flex items-center gap-1 border px-3 py-1 rounded bg-black text-white text-sm">
          💬 Comment
        </button>
        <button className="flex items-center gap-1 border px-3 py-1 rounded text-black text-sm">
          ✉️ Reply
        </button>
      </div>

      {/* Textarea */}
      <textarea
        className="w-full border rounded p-2 text-sm resize-none"
        placeholder="Write your comments here........."
        maxLength={1000}
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {/* File Upload and Count */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 text-sm space-y-2 sm:space-y-0">
        <div>
          <label className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded cursor-pointer w-fit">
            📎 Attach file
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {file && <p className="mt-1 text-green-600">{file.name}</p>}
          {error && <p className="text-red-600 mt-1">{error}</p>}
        </div>

        <span className="text-gray-500 text-sm self-end sm:self-center">
          {comment.length}/1000 Characters
        </span>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end mt-4 space-x-2">
        <button className="border border-gray-400 px-4 py-2 rounded text-sm">
          Discard
        </button>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">
          Submit
        </button>
      </div>
    </div>
  );
};

export default NewComment;
