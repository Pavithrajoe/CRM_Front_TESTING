import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

const UserLead = ({ userId, token }) => {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [lostLeads, setLostLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !token) return;

    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const resLeads = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=5000`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const dataLeads = await resLeads.json();
        setLeads(dataLeads?.details || []);

        const resLost = await fetch(`${ENDPOINTS.LOST_DETAILS}/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const dataLost = await resLost.json();
        setLostLeads(dataLost?.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [userId, token]);

  const applyFilters = (list) => {
    return list.filter((item) => {
      const matchesSearchTerm =
        item.clead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.iphone_no?.includes(searchTerm);

      const itemDate = new Date(item.dcreated_dt);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      return (!from || itemDate >= from) && (!to || itemDate <= to) && matchesSearchTerm;
    });
  };

  const renderTable = (dataList) => {
    const filteredData = applyFilters(dataList);

    if (loading) return <p className="text-blue-600 text-center">Loading...</p>;
    if (error) return <p className="text-red-600 text-center">{error}</p>;
    if (filteredData.length === 0)
      return <p className="text-gray-500 text-center py-8">No records found.</p>;

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const isLostTab = activeTab === "lost";

    return (
      <>
        {/* Pagination */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3">S.No.</th>
                <th className="px-6 py-3">Lead Name</th>
                <th className="px-6 py-3">Organization</th>
                <th className="px-6 py-3">Website</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">WhatsApp</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                {!isLostTab && <th className="px-6 py-3">Owner</th>}
                <th className="px-6 py-3">Created Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((item, index) => (
                <tr
                  key={item.ilead_id}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/leaddetailview/${item.ilead_id}`)} 
                >
                  <td className="px-6 py-4">{startIndex + index + 1}</td>
                  <td className="px-6 py-4">{item.clead_name}</td>
                  <td className="px-6 py-4">{item.corganization}</td>
                  <td className="px-6 py-4">{item.cwebsite}</td>
                  <td className="px-6 py-4">{item.iphone_no}</td>
                  <td className="px-6 py-4">{item.whatsapp_number}</td>
                  <td className="px-6 py-4">{item.cemail}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {item.lead_status?.clead_name || "-"}
                    </span>
                  </td>
                  {!isLostTab && <td className="px-6 py-4">{item.user?.cFull_name || "-"}</td>}
                  <td className="px-6 py-4">
                    {item.dcreated_dt ? new Date(item.dcreated_dt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-full mx-auto bg-white h-[100vh] rounded-xl shadow-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">User Leads</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => {
              setActiveTab("leads");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium ${
              activeTab === "leads"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600"
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => {
              setActiveTab("lost");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium ${
              activeTab === "lost"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-gray-600"
            }`}
          >
            Lost Leads
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === "leads" && renderTable(leads)}
          {activeTab === "lost" && renderTable(lostLeads)}
        </div>
      </div>
    </div>
  );
};

export default UserLead;
