
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../api/constraints";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT decoding failed:", e);
    return null;
  }
};

const StatusKanbanTab = () => {
  const [statuses, setStatuses] = useState([]);
  const [leads, setLeads] = useState({});
  const [allLeads, setAllLeads] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const tokenFromStorage = localStorage.getItem("token") || null;
      if (!tokenFromStorage) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const decoded = decodeJwt(tokenFromStorage);

      if (!decoded || !decoded.company_id) {
        throw new Error("Company ID not found in token or token invalid.");
      }

      setToken(tokenFromStorage);
      setCompanyId(decoded.company_id);
      setUserId(decoded.user_id);
    } catch (err) {
      console.error("Token decoding error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      console.log("JWT Token:", token);
      const decoded = decodeJwt(token);
      if (decoded) {
        setCompanyId(decoded.company_id);
        setUserId(decoded.user_id);
      }
      console.log("Company ID:", companyId);
      console.log("User ID:", userId);  
    }
  }, [token]);

  const goToDetail = (id) => {
    navigate(`/leaddetailview/${id}`);
  };

  useEffect(() => {
    if (!token || !companyId || !userId) return;

    const fetchStatusesAndLeads = async () => {
      try {
        // Fetch statuses
        const statusRes = await fetch(ENDPOINTS.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusJson = await statusRes.json();
        const statusData = statusJson.response || statusJson;
        const filteredStatuses = Array.isArray(statusData)
          ? statusData.filter(
              (status) =>
                String(status.icompany_id) === String(companyId) &&
                status.bactive === true
            )
          : [];
        filteredStatuses.sort((a, b) => a.orderId - b.orderId);

        // Add a "Null Status" object to the statuses array
        const nullStatus = {
          ilead_status_id: "null", 
          clead_name: "No Status",
          orderId: -1, 
          icompany_id: companyId,
          bactive: true,
        };

        setStatuses([nullStatus, ...filteredStatuses]);

        // Fetch leads
        const leadRes = await fetch(
          `${ENDPOINTS.CONVERT_TO_LOST}?limit=10000&page=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const leadJson = await leadRes.json();
        const leadData = leadJson.response || leadJson;
        const filteredLeads = Array.isArray(leadData)
          ? leadData.filter(
              (lead) =>
                String(lead.icompany_id) === String(companyId) &&
                String(lead.clead_owner) === String(userId) && // Filter by current user
                lead.bactive === true &&
                lead.bisConverted === false
            )
          : [];

        setAllLeads(filteredLeads); // Store all leads
        groupLeads(filteredLeads);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching statuses or leads:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStatusesAndLeads();
  }, [token, companyId, userId]);

  const groupLeads = (leadsToGroup) => {
    const groupedLeads = leadsToGroup.reduce((acc, lead) => {
      const statusId =
        lead.ileadstatus_id === null || lead.ileadstatus_id === undefined
          ? "null"
          : String(lead.ileadstatus_id);

      if (!acc[statusId]) acc[statusId] = [];
      acc[statusId].push(lead);
      return acc;
    }, {});
    setLeads(groupedLeads);
  };

  useEffect(() => {
    // Filter leads based on search
    const filteredLeads = allLeads.filter((lead) => {
      const query = searchQuery.toLowerCase();
      return (
        (lead.clead_name && lead.clead_name.toLowerCase().includes(query)) ||
        (lead.corganization &&
          lead.corganization.toLowerCase().includes(query)) ||
        (lead.cemail && lead.cemail.toLowerCase().includes(query)) ||
        (lead.iphone_no && lead.iphone_no.includes(query))
      );
    });

    groupLeads(filteredLeads);
  }, [searchQuery, allLeads]);

  // Handle drag end
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatusId = source.droppableId;
    const destStatusId = destination.droppableId;
    const updatedLeads = { ...leads };
    const movedLead = updatedLeads[sourceStatusId]?.[source.index];

    if (!movedLead) return;
    updatedLeads[sourceStatusId].splice(source.index, 1);

    if (!updatedLeads[destStatusId]) updatedLeads[destStatusId] = [];
    updatedLeads[destStatusId].splice(destination.index, 0, {
      ...movedLead,
      ileadstatus_id: destStatusId === "null" ? null : parseInt(destStatusId),
    });

    setLeads(updatedLeads);

    try {
      const newStatusId =
        destStatusId === "null" ? null : parseInt(destStatusId);
      const response = await fetch(
        `${ENDPOINTS.CONVERT_TO_LOST}/${movedLead.ilead_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...movedLead,
            ilead_status_id: newStatusId,
          }),
        }
      );

      if (!response.ok) {
        setLeads(leads);
        throw new Error("Failed to update lead status");
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
      setLeads(leads);
    }
  };

  if (loading)
    return <p className="text-gray-600 text-lg p-4">Loading Kanban Board...</p>;
  if (error)
    return <p className="text-red-500 font-bold text-lg p-4">Error: {error}</p>;

  return (
    <>
      <div className="p-4">
        <input
          type="text"
          placeholder="Search leads by name, organization, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xl p-2 pl-10 text-sm text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px 50%",
            backgroundSize: "18px",
          }}
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto w-full h-[80vh] p-4 bg-gray-50">
          <div className="flex gap-6 min-w-max pb-4">
            {statuses.map((status) => {
              const leadsForStatus = leads[String(status.ilead_status_id)] || [];

              return (
                <Droppable
                  key={status.ilead_status_id}
                  droppableId={String(status.ilead_status_id)}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-72 flex-shrink-0 border border-gray-200 rounded-xl p-3 bg-blue-50 to-blue-100 shadow-lg min-h-[200px]"
                    >
                      <div className="border-b border-gray-200 pb-2 mb-3 font-semibold text-lg text-gray-800 flex justify-between items-center">
                        <span className="flex-1 text-center">
                          {status.clead_name || "Untitled Status"}
                        </span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {leadsForStatus.length}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[calc(70vh-80px)] overflow-y-auto pr-1">
                        {leadsForStatus.length === 0 && (
                          <p className="text-gray-400 italic text-sm p-2 text-center">
                            No active leads in this status
                          </p>
                        )}

                        {leadsForStatus.map((lead, index) => (
                          <Draggable
                            key={lead.ilead_id}
                            draggableId={String(lead.ilead_id)}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => goToDetail(lead.ilead_id)}
  className="p-3 bg-sky-100 hover:bg-sky-200 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out border border-gray-300 text-gray-800"
                              >
                                <span className="font-medium text-black text-base">
                                  {lead.clead_name || "Unnamed Lead"}
                                </span>
                                {lead.corganization && (
                                  <p className="text-base text-black-900 mt-1">
                                    {lead.corganization}
                                  </p>
                                )}
                                {lead.cemail && (
                                  <p className="text-base text-black-900 mt-0.5 truncate">
                                    {lead.cemail}
                                  </p>
                                )}
                                {lead.iphone_no && (
                                  <p className="text-base text-black-900 mt-0.5 truncate">
                                    {lead.iphone_no}
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </>
  );
};

export default StatusKanbanTab;
