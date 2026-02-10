import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend,} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);


function LeadCallHistory({ phone }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;


// const filteredCalls = calls.filter((call) => {
//   const text = search.toLowerCase();
//   const callDate = new Date(call.call_time);
//   const isSearchMatch = call.caller_name?.toLowerCase().includes(text) || call.agent_name?.toLowerCase().includes(text) || call.call_type?.toLowerCase().includes(text);
//   const isAfterFrom = !fromDate || callDate >= new Date(fromDate);
//   const isBeforeTo = !toDate || callDate <= new Date(toDate + "T23:59:59");

//   return isSearchMatch && isAfterFrom && isBeforeTo;
// });

const filteredCalls = calls.filter((call) => {
  const text = search.toLowerCase();

  const callDate = new Date(call.call_time); // UTC

  const isSearchMatch =
    call.caller_name?.toLowerCase().includes(text) ||
    call.agent_name?.toLowerCase().includes(text) ||
    call.call_type?.toLowerCase().includes(text);

  // Convert filter dates to UTC
  const from = fromDate ? new Date(fromDate + "T00:00:00Z") : null;
  const to = toDate ? new Date(toDate + "T23:59:59Z") : null;

  const isAfterFrom = !from || callDate >= from;
  const isBeforeTo = !to || callDate <= to;

  return isSearchMatch && isAfterFrom && isBeforeTo;
});

const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);

const paginatedCalls = filteredCalls.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
const capitalize = (text = "") => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();


  useEffect(() => {
    console.log(" CallHistory mounted with phone:", phone);

    if (!phone) {
      setLoading(false);
      return;
    }

    const fetchCallHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get( `${ENDPOINTS.CALL_HISTORY_BY_PHONE(phone)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCalls(res.data?.data || res.data || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load call history");
      } finally {
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, [phone]);

  const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

    const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "UTC",   
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};



  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading call history...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!calls.length) {
    return <div className="p-4 text-center text-gray-400">No call history found</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-4">
    
    <div className="flex flex-wrap gap-3 mb-4 items-end">
    {/* Search */}
    <div className="flex flex-col flex-1 min-w-[200px]">
        <label className="text-xs text-gray-500 mb-1">Search</label>
        <input
        type="text"
        placeholder="Caller / Agent / Type"
        value={search}
        onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
        }}
        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
        />
    </div>

    {/* From Date */}
    <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">From</label>
        <input
        type="date"
        value={fromDate}
        onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(1);
        }}
        className="px-3 py-2 border rounded-lg"
        />
    </div>

    {/* To Date */}
    <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">To</label>
        <input
        type="date"
        value={toDate}
        onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(1);
        }}
        className="px-3 py-2 border rounded-lg"
        />
    </div>
    </div>

      <h3 className="text-lg font-semibold mb-3 text-blue-700">📞 Call History</h3>

      <div className="space-y-3">
        {paginatedCalls.map((call) => (
          <div key={call.call_id} className="flex justify-between items-center border rounded-lg p-3 hover:bg-gray-50" >
            <div>
              <p className="font-medium">{call.caller_name || "Unknown"}</p>
              <p className="text-xs text-gray-900"> <span className="font-bold">Talked by: </span><b>{call.agent_name}</b> </p>

              <p className="text-sm text-gray-500 font-bold ">
           
                {formatDateTime(call.call_time)}
              </p>
            </div>

            <div className="text-right">
           
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize
                    ${ call.call_type?.toLowerCase() === "incoming" ? "bg-green-100 text-green-700" : 
                       call.call_type?.toLowerCase() === "outgoing" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    }
                `}
                >
  {capitalize(call.call_type)}
</span>

              <p className="text-xs text-gray-500">{formatDuration(call.duration)}s</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center gap-2 mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">
          Prev
        </button>

        <span className="text-sm font-semibold">
          Page {currentPage} of {totalPages}
        </span>

        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">
          Next
        </button>
      </div>

    </div>
  );
}

export default LeadCallHistory;


// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { ENDPOINTS } from "../api/constraints";
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend,} from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Tooltip,
//   Legend
// );


// function LeadCallHistory({ phone }) {
//   const [calls, setCalls] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [fromDate, setFromDate] = useState("");
// const [toDate, setToDate] = useState("");

// const [currentPage, setCurrentPage] = useState(1);
// const itemsPerPage = 5;


// const filteredCalls = calls.filter((call) => {
//   const text = search.toLowerCase();
//   const callDate = new Date(call.call_time);
//   const isSearchMatch = call.caller_name?.toLowerCase().includes(text) || call.agent_name?.toLowerCase().includes(text) || call.call_type?.toLowerCase().includes(text);
//   const isAfterFrom = !fromDate || callDate >= new Date(fromDate);
//   const isBeforeTo = !toDate || callDate <= new Date(toDate + "T23:59:59");

//   return isSearchMatch && isAfterFrom && isBeforeTo;
// });

// const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);

// const paginatedCalls = filteredCalls.slice(
//   (currentPage - 1) * itemsPerPage,
//   currentPage * itemsPerPage
// );
// const capitalize = (text = "") => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();


//   useEffect(() => {
//     console.log(" CallHistory mounted with phone:", phone);

//     if (!phone) {
//       setLoading(false);
//       return;
//     }

//     const fetchCallHistory = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem("token");
//         const res = await axios.get( `${ENDPOINTS.CALL_HISTORY_BY_PHONE(phone)}`, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         setCalls(res.data?.data || res.data || []);
//         setError("");
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load call history");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCallHistory();
//   }, [phone]);

//   const formatDuration = (seconds) => {
//   if (!seconds || isNaN(seconds)) return "0:00";

//   const mins = Math.floor(seconds / 60);
//   const secs = seconds % 60;

//   return `${mins}:${secs.toString().padStart(2, "0")}`;
// };

//     const formatDateTime = (date) => {
//     return new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//     });
//     };


//   if (loading) {
//     return <div className="p-4 text-center text-gray-500">Loading call history...</div>;
//   }

//   if (error) {
//     return <div className="p-4 text-center text-red-500">{error}</div>;
//   }

//   if (!calls.length) {
//     return <div className="p-4 text-center text-gray-400">No call history found</div>;
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-md p-4 mt-4">
    
//     <div className="flex flex-wrap gap-3 mb-4 items-end">
//     {/* Search */}
//     <div className="flex flex-col flex-1 min-w-[200px]">
//         <label className="text-xs text-gray-500 mb-1">Search</label>
//         <input
//         type="text"
//         placeholder="Caller / Agent / Type"
//         value={search}
//         onChange={(e) => {
//             setSearch(e.target.value);
//             setCurrentPage(1);
//         }}
//         className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
//         />
//     </div>

//     {/* From Date */}
//     <div className="flex flex-col">
//         <label className="text-xs text-gray-500 mb-1">From</label>
//         <input
//         type="date"
//         value={fromDate}
//         onChange={(e) => {
//             setFromDate(e.target.value);
//             setCurrentPage(1);
//         }}
//         className="px-3 py-2 border rounded-lg"
//         />
//     </div>

//     {/* To Date */}
//     <div className="flex flex-col">
//         <label className="text-xs text-gray-500 mb-1">To</label>
//         <input
//         type="date"
//         value={toDate}
//         onChange={(e) => {
//             setToDate(e.target.value);
//             setCurrentPage(1);
//         }}
//         className="px-3 py-2 border rounded-lg"
//         />
//     </div>
//     </div>

//       <h3 className="text-lg font-semibold mb-3 text-blue-700">📞 Call History</h3>

//       <div className="space-y-3">
//         {paginatedCalls.map((call) => (
//           <div key={call.call_id} className="flex justify-between items-center border rounded-lg p-3 hover:bg-gray-50" >
//             <div>
//               <p className="font-medium">{call.caller_name || "Unknown"}</p>
//               <p className="text-xs text-gray-900"> <span className="font-bold">Talked by: </span><b>{call.agent_name}</b> </p>

//               <p className="text-sm text-gray-500 font-bold ">
           
//                 {formatDateTime(call.call_time)}
//               </p>
//             </div>

//             <div className="text-right">
           
//               <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize
//                     ${ call.call_type?.toLowerCase() === "incoming" ? "bg-green-100 text-green-700" : 
//                        call.call_type?.toLowerCase() === "outgoing" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
//                     }
//                 `}
//                 >
//   {capitalize(call.call_type)}
// </span>

//               <p className="text-xs text-gray-500">{formatDuration(call.duration)}s</p>
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="flex justify-center items-center gap-2 mt-4">
//         <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">
//           Prev
//         </button>

//         <span className="text-sm font-semibold">
//           Page {currentPage} of {totalPages}
//         </span>

//         <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">
//           Next
//         </button>
//       </div>

//     </div>
//   );
// }

// export default LeadCallHistory;