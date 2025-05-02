import React from 'react';

const NewReminder = () => {
  return (
    <div className="bg-white shadow ms-[-250px]  bg-grey-500  rounded-lg ">
      <h2 className="text-xl font-semibold mb-4">New Reminder</h2>
      <input type="text" placeholder="Enter your project title" className="w-full mb-4 p-2 border bg-grey-500 rounded" />
      <textarea placeholder="Write your description here..." className="w-full mb-4 p-2 border rounded" rows={4}></textarea>
      <div className="flex gap-4 items-center mb-4">
        <select className="border rounded p-2">
          <option>Shivakumar</option>
        </select>
        <input type="date" className="border rounded p-2" />
        <input type="time" className="border rounded p-2" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <label><input type="checkbox" /> For Me</label>
        <label><input type="checkbox" /> Follow Up</label>
      </div>
      <div className="flex justify-end gap-2">
        <button className="border px-4 py-2 rounded">Save as Draft</button>
        <button className="bg-black text-white px-4 py-2 rounded">Submit</button>
      </div>

    </div>
  );
};

export default NewReminder;
