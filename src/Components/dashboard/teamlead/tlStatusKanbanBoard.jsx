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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
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

  const goToDetail = (id) => {
        navigate(`/leaddetailview/${id}`);
    };

  useEffect(() => {
    if (!token || !companyId || !userId) return;

    const fetchStatusesAndLeads = async () => {
      try {
        const statusRes = await fetch(ENDPOINTS.STATUS, { // for fetching lead status
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const statusJson = await statusRes.json();
        const statusData = statusJson.response || statusJson;
        const filteredStatuses = Array.isArray(statusData)
          ? statusData.filter(
              (status) =>
                String(status.icompany_id) === String(companyId) &&
                status.bactive === true
            )
          : [];

        setStatuses(filteredStatuses);

        // // for fetching leads
        const leadRes = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}?limit=10000&page=1`,{ // convert to lost is constraints name it is fetching the lead details
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const leadJson = await leadRes.json();
        const leadData = leadJson.response || leadJson;
        const filteredLeads = Array.isArray(leadData)
          ? leadData.filter(
              (lead) =>
                String(lead.icompany_id) === String(companyId) &&
                lead.bactive === true
            )
          : [];

        const groupedLeads = filteredLeads.reduce((acc, lead) => {
          const statusId = String(lead.ileadstatus_id);
          if (statusId) {
            if (!acc[statusId]) acc[statusId] = [];
            acc[statusId].push(lead);
          }
          return acc;
        }, {});

        setLeads(groupedLeads);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching statuses or leads:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStatusesAndLeads();
  }, [token, companyId, userId]);

  // Handle drag end
  const onDragEnd = async (result) => {
    // console.log("DRAG RESULT:", result);
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return; 
    }

    const sourceStatusId = source.droppableId;
    const destStatusId = destination.droppableId;

    // Clone current leads state
    const updatedLeads = { ...leads };
    const movedLead = updatedLeads[sourceStatusId][source.index];

    // Remove from old column
    updatedLeads[sourceStatusId].splice(source.index, 1);

    // Add to new column
    if (!updatedLeads[destStatusId]) updatedLeads[destStatusId] = [];
    updatedLeads[destStatusId].splice(destination.index, 0, {
      ...movedLead,
      ileadstatus_id: parseInt(destStatusId),
    });

    setLeads(updatedLeads);

    //  update lead status
    try {
      const response = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}/${movedLead.ilead_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...movedLead,
            ileadstatus_id: parseInt(destStatusId),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update lead status");
      }

      // console.log(`Lead ${movedLead.ilead_id} moved to ${destStatusId}`);
    } catch (err) {
      console.error("Error updating lead status:", err);
    }
  };

  if (loading)
    return <p className="text-gray-600 text-lg p-4">Loading Kanban Board...</p>;
  if (error)
    return <p className="text-red-500 font-bold text-lg p-4">Error: {error}</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="overflow-x-auto w-full h-[80vh] p-4 bg-gray-50 font-inter">
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
                    className="w-72 flex-shrink-0 border border-gray-200 rounded-xl p-3 bg-blue-300 shadow-lg min-h-[200px]"
                  >

                    <div className="border-b border-gray-200 pb-2 mb-3 font-semibold text-lg text-gray-800 flex justify-between items-center">
                        <span className="flex-1 text-center">{status.clead_name || "Untitled Status"}</span>
                      {/* <span>{status.clead_name || "Untitled Status"}</span> */}
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
                              // className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out border border-blue-100"
                              className="p-3 bg-green-300 hover:bg-yellow-200 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out border border-black text-black-800"

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
  );
};

export default StatusKanbanTab;

