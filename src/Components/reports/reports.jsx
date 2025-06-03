import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "../../Components/common/ProfileHeader";
import { usePopup } from "../../context/PopupContext";
import { ENDPOINTS } from "../../api/constraints";
const cardsData = [
  {
    title: "Sales by Stage Analytics",
    description: "View performance of opportunities across sales stages.",
    route: "/sales-by-stage-analytics",
    image: "/public/illustrations/Analytics-rafiki.svg", // Use your actual image path here
  },
  {
    title: "Lead Lost Analytics",
    description: "Analyze lost leads and identify drop-off patterns.",
    route: "/lead-lost-analytics",
    image: "/public/illustrations/oversight-amico.svg", // Use your actual image path here
  },
    {
    title: "Territory Based Analytics",
    description: "Territory-Based Analytics shows lead and sales performance by region to identify key growth areas.",
    route: "/territory-based-analytics",
    image: "/public/illustrations/analytics.svg", // Use your actual image path here
  },
];
const CardsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showPopup } = usePopup();  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    report_type: "general",
  });

  const filteredCards = cardsData.filter((card) =>
    card.title.toLowerCase().includes(query.toLowerCase())
  );
  

  const addFeedback = async (form) => {
  try {
    const response = await fetch(ENDPOINTS.FEEDBACK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      throw new Error("Failed to add feedback");
    }

    const data = await response.json();
      showPopup("Success", "🎉Thank you for your valuable feedback!!", "success")
    setIsModalOpen(false);
    setFormData({
      title: "",
      description: "",
      report_type: "general",
    });
  } catch (error) {
    showPopup("Error", "Error adding feedback", "error")
    console.error("Error adding feedback:", error);
  }
};

  return (
    
   <div className="flex min-h-screen bg-gray-50 text-gray-900">

      {/* Main Content */}

      <div className="flex-1 px-8 py-10">
        <ProfileHeader />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full px-5 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={() => console.log("Searching for:", query)}
              className="absolute right-3 top-2.5 text-sm text-blue-500 hover:text-blue-700"
            >
              Search
            </button>
          </div>
        </div>
<div className="flex justify-end mb-4">
 <button
  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full shadow hover:bg-blue-700 active:scale-95 transition"
  // onClick={() => setIsModalOpen(true)}
onClick={() => setIsModalOpen(true)}
>
  Add Feedback
</button>
</div>
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md mx-auto p-6 rounded-xl shadow-xl relative">
      <h3 className="text-xl font-semibold mb-4">Create Report</h3>

      {/* Title */}
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        rows={3}
      ></textarea>

      {/* Report Type */}
      <select
        value={formData.report_type}
        onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="general">General</option>
        <option value="new">New</option>
        <option value="stage_report">Stage Report</option>
        <option value="lost_report">Lost Report</option>
      </select>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={() => {

            console.log("Submitted Report:", formData);
            addFeedback(formData);
          }}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}
        {/* Header */}
        <h2 className="text-3xl font-semibold mb-8 tracking-tight">Analytics Dashboard</h2>

        {/* Cards */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCards.map((card, index) => (
              <div
                key={index}
                onClick={() => navigate(card.route)}
                className="flex items-center justify-between bg-white rounded-2xl p-6 min-h-[180px] shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 hover:border-blue-400"
              >
                {/* Text Content */}
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>

                {/* Image */}
              <div className="w-40 h-40 flex-shrink-0">
  <img
    src={card.image}
    alt={card.title}
    className="w-full h-full object-cover rounded-lg"
  />
</div>
              </div>
            ))}
          </div>

          
        ) : (
          <p className="text-gray-500 text-sm">No results found for "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default CardsPage;