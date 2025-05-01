import React from "react";

const RemainderForm = () => {
  return (
    <div className="p-6">
      <h2 className="font-semibold text-lg mb-4">New Remainder</h2>

      <label className="block text-sm mb-1">Project Title</label>
      <input className="w-full border p-2 mb-4 rounded" placeholder="Enter your project title" />

      <label className="block text-sm mb-1">Description</label>
      <textarea
        className="w-full border p-2 mb-2 rounded h-24"
        placeholder="Write your description here……"
        maxLength={300}
      />

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="text-sm block mb-1">Assigned To</label>
          <select className="border p-2 rounded w-40">
            <option>Shivakumar</option>
            {/* Add more users */}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">Date</label>
          <input type="date" className="border p-2 rounded w-40" />
        </div>

        <div>
          <label className="text-sm block mb-1">Time</label>
          <div className="flex">
            <input type="time" className="border p-2 rounded w-28" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <label><input type="checkbox" /> For Me</label>
        <label><input type="checkbox" /> Follow Up</label>
      </div>

      <div className="flex gap-4">
        <button className="bg-white border px-6 py-2 rounded">Save as Draft</button>
        <button className="bg-black text-white px-6 py-2 rounded">Submit</button>
      </div>
    </div>
  );
};

export default RemainderForm;
