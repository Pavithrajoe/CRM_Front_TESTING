import React, { useState, useEffect } from "react";

const dummyAPI = () =>
  Promise.resolve([
    {
      id: 1,
      name: "Shivakumar",
      comment:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
      time: "12:30 PM",
      date: "March 22",
    },
  ]);

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // No initial data load
  }, []);

  const handleNewCommentClick = async () => {
    if (comments.length === 0) {
      const data = await dummyAPI();
      setComments(data);
    }
    setShowForm(true);
  };

  return (
    <div className="relative">
      {/* Header with Button */}
      <div className="flex items-center justify-between px-5 overflow-x-hidden py-4 mb-4">
        <h2 className="text-xl font-semibold">All Comments</h2>
        <button
          onClick={handleNewCommentClick}
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
        >
          + New Comment
        </button>
      </div>

      {comments.length === 0 ? (
        <div className="border border-dashed rounded p-6 text-center max-w-sm mx-auto">
          <div className="text-4xl mb-2">
            <img
              src="images/nav/command.png"
              alt="Comment Icon"
              className="mx-auto w-12 h-12"
            />
          </div>
          <p className="mb-4">No comments have been provided at this time.</p>
        </div>
      ) : (
        <div className="space-y-4 px-5">
          {comments.map((c) => (
            <div
              key={c.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="font-semibold flex items-center gap-2">
                <img
                  src="https://i.pravatar.cc/40"
                  alt="avatar"
                  className="rounded-full w-8 h-8"
                />
                {c.name}
              </div>
              <p className="text-sm mt-2">{c.comment}</p>
              <p className="text-xs text-right text-gray-900 mt-2">
                {c.time}, {c.date}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in Form Panel */}
      <div
        className={`fixed top-[150px] right-0 h-full w-96 bg-white shadow-lg border-l transform transition-transform duration-300 ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Add Comment</h3>
          <button onClick={() => setShowForm(false)}><img src="images/nav/wrong.png" alt="Comment Icon" className="mx-auto w-8 h-8"></img></button>
        </div>
        <div className="p-4">
          <textarea
            className="w-full border rounded bg-black p-2 mb-4"
            rows={4}
            placeholder="Write your comment..."
          />
          <input type="file" className="mb-4 " />
          <button className="bg-blue-900 text-white px-4 py-2 rounded-2xl">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
