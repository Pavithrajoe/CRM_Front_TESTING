import { User, Phone, Mail, Building2, } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../api/constraints";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

//  decode JWT token from local storage
const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT decoding failed:", e);
    return null;
  }
};

const StatusKanbanTab = () => {
  // State variables for the Kanban board logic
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

  //  Get Token, Company ID, and User ID
  useEffect(() => {
    try {
      const tokenFromStorage = localStorage.getItem("token") || null;
      if (!tokenFromStorage) throw new Error("Authentication token not found.");

      const decoded = decodeJwt(tokenFromStorage);
      if (!decoded || !decoded.company_id)
        throw new Error("Company ID not found in token or token invalid.");

      setToken(tokenFromStorage);
      setCompanyId(decoded.company_id);
      setUserId(decoded.user_id);
    } catch (err) {
      console.error("Token decoding error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []); 

  //  Get Statuses and Leads
  useEffect(() => {
    // Only proceed if we have the necessary IDs and token
    if (!token || !companyId || !userId) return;

    const fetchStatusesAndLeads = async () => {
      try {
        // --- FETCH STATUSES ---
        const statusRes = await fetch(ENDPOINTS.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusJson = await statusRes.json();
        const statusData = statusJson.response || statusJson;

        // Filter statuses by company ID and active flag, then sort by orderId
        const filteredStatuses = Array.isArray(statusData)
          ? statusData
              .filter(
                (status) =>
                  String(status.icompany_id) === String(companyId) &&
                  status.bactive === true
              )
              .sort((a, b) => a.orderId - b.orderId)
          : [];

        // Manually create a 'No Status' column for leads without an assigned status ID
        const nullStatus = {
          ilead_status_id: "null", 
          clead_name: "No Status",
          orderId: -1,
          icompany_id: companyId,
          bactive: true,
        };

        setStatuses([...filteredStatuses, nullStatus]);

        // --- FETCH LEADS ---
        const leadRes = await fetch(`${ENDPOINTS.LEAD}${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const leadJson = await leadRes.json();
        const leadData = leadJson.details || [];

        const filteredLeads = leadData.filter(
          (lead) =>
            String(lead.icompany_id) === String(companyId) &&
            lead.bactive === true &&
            lead.bisConverted === false
        );

        setAllLeads(filteredLeads); 
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

  // Function to group the leads array into the 'leads' object
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

const getPipelineTotal = (statusId) => {
  const statusLeads = leads[String(statusId)] || [];

  return statusLeads.reduce(
    (total, lead) => total + Number(lead.iproject_value || 0),
    0
  );
};

  // Filter leads based on searchQuery
  useEffect(() => {
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

  // Navigation function for clicking on a lead card
  const goToDetail = (id) => navigate(`/leaddetailview/${id}`);

  // Drag and Drop Handler
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return; 
    const sourceStatusId = source.droppableId;
    const destStatusId = destination.droppableId;
    const updatedLeads = { ...leads };
    const movedLead = updatedLeads[sourceStatusId]?.[source.index];
    if (!movedLead) return;

    // Optimistic UI Update (Change local state immediately)
    updatedLeads[sourceStatusId].splice(source.index, 1); 
    if (!updatedLeads[destStatusId]) updatedLeads[destStatusId] = [];
    const newStatusIdValue = destStatusId === "null" ? null : parseInt(destStatusId);

    const movedLeadWithNewStatus = {
        ...movedLead,
        ileadstatus_id: newStatusIdValue, 
    };
    updatedLeads[destStatusId].splice(destination.index, 0, movedLeadWithNewStatus); 

    setLeads(updatedLeads); 

    // API Call to update the backend 
    try {
      const {
        lead_potential,
        lead_status,
        user,
        user_crm_lead_modified_byTouser,
        sub_src_lead,
        ...restOfLeadData 
      } = movedLead; 

      // Construct the clean API payload
      const updateBody = {
        ...restOfLeadData,          
        ileadstatus_id: newStatusIdValue, 
        dmodified_dt: new Date().toISOString(),
        isUpdated: true, 
      };
      
      const response = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}/${movedLead.ilead_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateBody), 
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update lead status: ${response.statusText}`);
      }
      
    } catch (err) {
      console.error("Error updating lead status:", err);
      alert("Failed to update lead status on server. Please try again or refresh.");
    }
  };

  //  Render Status
  if (loading)
    return <p className="text-gray-600 text-lg p-4">Loading Kanban...</p>;
  if (error)
    return <p className="text-red-500 font-bold text-lg p-4">Error: {error}</p>;

  return (
    <>
      {/* Search Input Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xl p-2 pl-10 text-sm bg-gray-100 rounded-lg"
        />
      </div>

      {/* Kanban Board Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto w-full h-[80vh] p-6 bg-gray-100">
          <div className="flex gap-6 min-w-max pb-4">
            {statuses.map((status) => {
              const leadsForStatus = (leads[String(status.ilead_status_id)] ||
                []).sort(
                (a, b) => new Date(b.dcreated_dt) - new Date(a.dcreated_dt)
              );

              return (
                <Droppable key={status.ilead_status_id} droppableId={String(status.ilead_status_id)} >
                  {(provided) => (
                    <div ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-80 p-4 bg-gray-200 rounded-xl shadow-md"
                    >
                      {/* Column Header */}
                      <div className="pb-3 mb-4 border-b border-gray-300">
                        <div className="flex items-center justify-between">
                          
                          {/* LEFT GROUP: Name and Count */}
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">
                              {status.clead_name}
                            </span>
                            <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-sm font-medium">
                              {leadsForStatus.length}
                            </span>
                          </div>

                          {/* RIGHT GROUP: Amount */}
                          <div className="text-green-600 font-bold text-sm">
                            ₹ {getPipelineTotal(status.ilead_status_id).toLocaleString()}
                          </div>

                        </div>
                      </div>

                      {/* Leads Container (Scrollable) */}
                      <div className="space-y-4 max-h-[calc(70vh-80px)] overflow-y-auto pr-2">
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
                                className="p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-50 cursor-pointer"
                              >
                                
                                {/* LEAD NAME  */}
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                  <User size={16} /> 
                                  {lead.clead_name || "Unnamed Lead"}
                                </h3>

                                {/* ORG */}
                                {lead.corganization && (
                                  <p className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                                    <Building2 size={16} />
                                    {lead.corganization}
                                  </p>
                                )}

                                {/* EMAIL */}
                                {lead.cemail && (
                                  <p className="flex items-center gap-2 text-sm text-gray-700 mt-1 truncate">
                                    <Mail size={16} />
                                    {lead.cemail}
                                  </p>
                                )}

                                {/* PHONE */}
                                {lead.iphone_no && (
                                  <p className="flex items-center gap-2 text-sm text-gray-700 mt-1 truncate">
                                    <Phone size={16} />
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

// import { User, Phone, Mail, Building2, } from "lucide-react"; 
// import { useNavigate } from "react-router-dom";
// import { ENDPOINTS } from "../../../api/constraints";
// import React, { useEffect, useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// //  decode JWT token from local storage
// const decodeJwt = (token) => {
//   try {
//     const base64Url = token.split(".")[1];
//     const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split("")
//         .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//         .join("")
//     );
//     return JSON.parse(jsonPayload);
//   } catch (e) {
//     console.error("JWT decoding failed:", e);
//     return null;
//   }
// };

// const StatusKanbanTab = () => {
//   // State variables for the Kanban board logic
//   const [statuses, setStatuses] = useState([]); 
//   const [leads, setLeads] = useState({});       
//   const [allLeads, setAllLeads] = useState([]); 
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);    
  
//   // State variables for authentication and filtering
//   const [token, setToken] = useState(null);     
//   const [companyId, setCompanyId] = useState(null); 
//   const [userId, setUserId] = useState(null);       
//   const [searchQuery, setSearchQuery] = useState(""); 
  
//   const navigate = useNavigate(); 

//   //  Get Token, Company ID, and User ID
//   useEffect(() => {
//     try {
//       const tokenFromStorage = localStorage.getItem("token") || null;
//       if (!tokenFromStorage) throw new Error("Authentication token not found.");

//       const decoded = decodeJwt(tokenFromStorage);
//       if (!decoded || !decoded.company_id)
//         throw new Error("Company ID not found in token or token invalid.");

//       setToken(tokenFromStorage);
//       setCompanyId(decoded.company_id);
//       setUserId(decoded.user_id);
//     } catch (err) {
//       console.error("Token decoding error:", err);
//       setError(err.message);
//       setLoading(false);
//     }
//   }, []); 

//   //  Get Statuses and Leads
//   useEffect(() => {
//     // Only proceed if we have the necessary IDs and token
//     if (!token || !companyId || !userId) return;

//     const fetchStatusesAndLeads = async () => {
//       try {
//         // --- FETCH STATUSES ---
//         const statusRes = await fetch(ENDPOINTS.STATUS, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const statusJson = await statusRes.json();
//         const statusData = statusJson.response || statusJson;

//         // Filter statuses by company ID and active flag, then sort by orderId
//         const filteredStatuses = Array.isArray(statusData)
//           ? statusData
//               .filter(
//                 (status) =>
//                   String(status.icompany_id) === String(companyId) &&
//                   status.bactive === true
//               )
//               .sort((a, b) => a.orderId - b.orderId)
//           : [];

//         // Manually create a 'No Status' column for leads without an assigned status ID
//         const nullStatus = {
//           ilead_status_id: "null", // Use string "null" to match grouping logic
//           clead_name: "No Status",
//           orderId: -1,
//           icompany_id: companyId,
//           bactive: true,
//         };

//         setStatuses([...filteredStatuses, nullStatus]);

//         // --- FETCH LEADS ---
//         const leadRes = await fetch(`${ENDPOINTS.LEAD}${userId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         const leadJson = await leadRes.json();
//         const leadData = leadJson.details || [];

//         // Filter leads by company ID, active flag, and exclude converted leads
//         const filteredLeads = leadData.filter(
//           (lead) =>
//             String(lead.icompany_id) === String(companyId) &&
//             lead.bactive === true &&
//             lead.bisConverted === false
//         );

//         setAllLeads(filteredLeads); // Save all leads for searching
//         groupLeads(filteredLeads);  // Group them into the Kanban columns
//         setLoading(false);          // Stop loading indicator
//       } catch (err) {
//         console.error("Error fetching statuses or leads:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchStatusesAndLeads();
//   }, [token, companyId, userId]); 

//   // Function to group the leads array into the 'leads' object
//   const groupLeads = (leadsToGroup) => {
//     const groupedLeads = leadsToGroup.reduce((acc, lead) => {
//       const statusId =
//         lead.ileadstatus_id === null || lead.ileadstatus_id === undefined
//           ? "null"
//           : String(lead.ileadstatus_id);

//       if (!acc[statusId]) acc[statusId] = [];
//       acc[statusId].push(lead);
//       return acc;
//     }, {});
//     setLeads(groupedLeads);
//   };

//   // Filter leads based on searchQuery
//   useEffect(() => {
//     const filteredLeads = allLeads.filter((lead) => {
//       const query = searchQuery.toLowerCase();
//       return (
//         (lead.clead_name && lead.clead_name.toLowerCase().includes(query)) ||
//         (lead.corganization &&
//           lead.corganization.toLowerCase().includes(query)) ||
//         (lead.cemail && lead.cemail.toLowerCase().includes(query)) ||
//         (lead.iphone_no && lead.iphone_no.includes(query))
//       );
//     });
//     groupLeads(filteredLeads); 
//   }, [searchQuery, allLeads]); // Reruns when search query changes or allLeads updates

//   // Navigation function for clicking on a lead card
//   const goToDetail = (id) => navigate(`/leaddetailview/${id}`);

//   // Drag and Drop Handler
//   const onDragEnd = async (result) => {
//     const { source, destination } = result;
//     if (!destination) return; 

//     const sourceStatusId = source.droppableId;
//     const destStatusId = destination.droppableId;

//     const updatedLeads = { ...leads };
//     const movedLead = updatedLeads[sourceStatusId]?.[source.index];

//     if (!movedLead) return;

//     // Optimistic UI Update (Change local state immediately)
//     updatedLeads[sourceStatusId].splice(source.index, 1); 
//     if (!updatedLeads[destStatusId]) updatedLeads[destStatusId] = [];
    
//     // Determine the new status ID (null if dropped into 'No Status' column)
//     const newStatusIdValue = destStatusId === "null" ? null : parseInt(destStatusId);

//     const movedLeadWithNewStatus = {
//         ...movedLead,
//         ileadstatus_id: newStatusIdValue, // Update the lead's status ID
//     };
//     updatedLeads[destStatusId].splice(destination.index, 0, movedLeadWithNewStatus); 

//     setLeads(updatedLeads); // Update the state immediately

//     // API Call to update the backend 
//     try {
//       const {
//         lead_potential,
//         lead_status,
//         user,
//         user_crm_lead_modified_byTouser,
//         sub_src_lead,
//         ...restOfLeadData 
//       } = movedLead; 

//       // Construct the clean API payload
//       const updateBody = {
//         ...restOfLeadData,          
//         ileadstatus_id: newStatusIdValue, 
//         dmodified_dt: new Date().toISOString(),
//         isUpdated: true, 
//       };
      
//       const response = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}/${movedLead.ilead_id}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(updateBody), 
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Failed to update lead status: ${response.statusText}`);
//       }
      
//     } catch (err) {
//       console.error("Error updating lead status:", err);
//       alert("Failed to update lead status on server. Please try again or refresh.");
//     }
//   };

//   //  Render Status
//   if (loading)
//     return <p className="text-gray-600 text-lg p-4">Loading Kanban...</p>;
//   if (error)
//     return <p className="text-red-500 font-bold text-lg p-4">Error: {error}</p>;

//   return (
//     <>
//       {/* Search Input Section */}
//       <div className="p-4 bg-white border-b border-gray-200">
//         <input
//           type="text"
//           placeholder="Search leads..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="w-full max-w-xl p-2 pl-10 text-sm bg-gray-100 rounded-lg"
//         />
//       </div>

//       {/* Kanban Board Container */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <div className="overflow-x-auto w-full h-[80vh] p-6 bg-gray-100">
//           <div className="flex gap-6 min-w-max pb-4">
//             {statuses.map((status) => {
//               const leadsForStatus = (leads[String(status.ilead_status_id)] ||
//                 []).sort(
//                 (a, b) => new Date(b.dcreated_dt) - new Date(a.dcreated_dt)
//               );

//               return (
//                 <Droppable
//                   key={status.ilead_status_id}
//                   droppableId={String(status.ilead_status_id)}
//                 >
//                   {(provided) => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.droppableProps}
//                       className="w-80 p-4 bg-gray-200 rounded-xl shadow-md"
//                     >
//                       {/* Column Header */}
//                       <div className="border-b-2 border-indigo-600 pb-3 mb-4 text-lg font-semibold text-center">
//                         {status.clead_name}
//                         <span className="ml-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
//                           {leadsForStatus.length} {/* Lead count */}
//                         </span>
//                       </div>

//                       {/* Leads Container (Scrollable) */}
//                       <div className="space-y-4 max-h-[calc(70vh-80px)] overflow-y-auto pr-2">
//                         {leadsForStatus.map((lead, index) => (
//                           <Draggable
//                             key={lead.ilead_id}
//                             draggableId={String(lead.ilead_id)}
//                             index={index}
//                           >
//                             {(provided) => (
//                               <div
//                                 ref={provided.innerRef}
//                                 {...provided.draggableProps}
//                                 {...provided.dragHandleProps} // Allows the card to be dragged
//                                 onClick={() => goToDetail(lead.ilead_id)}
//                                 className="p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-50 cursor-pointer"
//                               >
                                
//                                 {/* LEAD NAME  */}
//                                 <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
//                                   <User size={16} /> 
//                                   {lead.clead_name || "Unnamed Lead"}
//                                 </h3>

//                                 {/* ORG */}
//                                 {lead.corganization && (
//                                   <p className="flex items-center gap-2 text-sm text-gray-700 mt-1">
//                                     <Building2 size={16} />
//                                     {lead.corganization}
//                                   </p>
//                                 )}

//                                 {/* EMAIL */}
//                                 {lead.cemail && (
//                                   <p className="flex items-center gap-2 text-sm text-gray-700 mt-1 truncate">
//                                     <Mail size={16} />
//                                     {lead.cemail}
//                                   </p>
//                                 )}

//                                 {/* PHONE */}
//                                 {lead.iphone_no && (
//                                   <p className="flex items-center gap-2 text-sm text-gray-700 mt-1 truncate">
//                                     <Phone size={16} />
//                                     {lead.iphone_no}
//                                   </p>
//                                 )}
                                
//                               </div>
//                             )}
//                           </Draggable>
//                         ))}
//                         {provided.placeholder} 
//                       </div>
//                     </div>
//                   )}
//                 </Droppable>
//               );
//             })}
//           </div>
//         </div>
//       </DragDropContext>
//     </>
//   );
// };

// export default StatusKanbanTab;