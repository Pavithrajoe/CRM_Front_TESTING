
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import Swal from "sweetalert2";
import Pagination from "../../context/Pagination/pagination";
import usePagination from "../../hooks/usePagination";


const BlockUnblockNumber = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [reason, setReason] = useState("Spam");
  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchNumbers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(ENDPOINTS.DCRM_UNIQUE_NUMBER_CHECK, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(res.data.data);

    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load numbers");
    } finally {
      setLoading(false);
    }
  };

  // ================= BLOCK =================
  const blockNumber = async () => {
    try {

      await axios.post(
        ENDPOINTS.DCRM_BLOCK_NUMBER,
        {
          number: selectedNumber,
          name: selectedName,
          reason: reason, //  selected reason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Blocked!",
        text: "Number has been blocked successfully",
        timer: 2000,
        showConfirmButton: false,
      });
      setShowModal(false);
      fetchNumbers();

    } catch (err) {
      console.error("Block error:", err);
    Swal.fire({
    icon: "error",
    title: "Oops!",
    text: "Action failed. Try again.",
  });

    }
  };


  // ================= UNBLOCK =================
  const unblockNumber = async (number) => {
    try {

      await axios.post(
        ENDPOINTS.DCRM_UNBLOCK_NUMBER,
        { number },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Unblocked!",
        text: "Number has been unblocked",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchNumbers();

    } catch (err) {
      console.error("Unblock error:", err);
      alert("Unblock failed");
    }
  };

  // ================= LOAD =================
  useEffect(() => {
    fetchNumbers();
  }, []);

  // ================= UI =================
  const actionBtnStyle = {
  border: "none",
  padding: "7px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  minWidth: "90px",
  transition: "0.2s",
};
const filteredData = data.filter((item) => {
  const text = search.toLowerCase();

  return (
    item.call_log_number?.toString().includes(text) ||
    item.name?.toLowerCase().includes(text) ||
    (item.is_blocked ? "blocked" : "active").includes(text)
  );
});

  const { currentPage, setCurrentPage, totalPages, paginatedData, } = usePagination(filteredData, 10);

return (
  <div
    style={{
      padding: "30px",
      minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    }}
  >
    {/* ===== Search Bar ===== */}
    <div
      style={{
        marginBottom: "15px",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <input
        type="text"
        placeholder="Search number / name / status..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // search panna page reset
        }}
        style={{
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          width: "260px",
          outline: "none",
          fontSize: "14px",
        }}
      />
    </div>

    
    {/* ===== Table Card ===== */}
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        padding: "20px",
        overflowX: "auto",
      }}
    >
      {loading && (
        <p style={{ textAlign: "center", color: "#8e8e93" }}>  Loading data... </p>
      )}

      <table
        width="100%"
        cellPadding="12"
        style={{
          borderCollapse: "collapse",
          textAlign: "center",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f2f2f7",
              color: "#1c1c1e",
              fontWeight: 600,
            }}
          >
            <th>S.No</th>
            <th>Number</th>
            <th>Name</th>
            <th>Calls</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && !loading && (
            <tr>
              <td colSpan="6" style={{ padding: "25px", color: "#8e8e93" }}> No Records Found </td>
            </tr>
          )}

          {paginatedData.map((item, index) => (
            <tr
              key={index}
              style={{
                borderBottom: "1px solid #e5e5ea",
              }}
            >
              <td style={{ color: "#8e8e93" }}>
                {startIndex + index + 1}
              </td>

              <td>{item.call_log_number}</td>

              <td>{item.name || "-"}</td>

              <td>{item.total_calls}</td>

              {/* ===== Status Badge ===== */}
              <td>
                {item.is_blocked ? (
                  <span
                    style={{
                      background: "#ffebee",
                      color: "#ff3b30",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Blocked
                  </span>
                ) : (
                  <span
                    style={{
                      background: "#e9f7ef",
                      color: "#34c759",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Active
                  </span>
                )}
              </td>

              {/* ===== Action Button ===== */}
              <td>
                <button
                  onClick={() => {
                    if (item.is_blocked) {
                      unblockNumber(item.call_log_number);
                    } else {
                      setSelectedNumber(item.call_log_number);
                      setSelectedName(item.name);
                      setReason("Spam");
                      setShowModal(true);
                    }
                  }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                    background: item.is_blocked ? "#34c759" : "#ff3b30",
                    color: "#fff",
                  }}
                >
                  {item.is_blocked ? "Unblock" : "Block"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

     {/* PAGINATION UI */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

    {/* ===== Block Reason Modal ===== */}
    {showModal && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "20px",
            width: "360px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h3 style={{ marginBottom: "10px", color: "#1c1c1e" }}> 🚫 Block Number  </h3>
          <p style={{ fontSize: "14px", color: "#8e8e93" }}> Choose a reason </p>

          <div style={{ marginTop: "15px" }}>
            {["Spam", "Personal", "Marketing", "Other"].map((item) => (
              <label
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                <input
                  type="radio"
                  value={item}
                  checked={reason === item}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ marginRight: "10px" }}
                />
                {item}
              </label>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                flex: 1,
                background: "#e5e5ea",
                border: "none",
                padding: "10px",
                borderRadius: "14px",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>

            <button
              onClick={blockNumber}
              style={{
                flex: 1,
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "10px",
                borderRadius: "14px",
                fontWeight: 500,
              }}
            >
              Block
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);


};

export default BlockUnblockNumber



// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { ENDPOINTS } from "../../api/constraints";
// import Swal from "sweetalert2";


// const BlockUnblockNumber = () => {

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
// const [selectedNumber, setSelectedNumber] = useState(null);
// const [selectedName, setSelectedName] = useState("");
// const [reason, setReason] = useState("Spam");
// const [currentPage, setCurrentPage] = useState(1);
// const itemsPerPage = 10;



//   const token = localStorage.getItem("token");

  

//   // ================= FETCH =================
//   const fetchNumbers = async () => {
//     try {
//       setLoading(true);

//       const res = await axios.get(ENDPOINTS.DCRM_UNIQUE_NUMBER_CHECK, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       setData(res.data.data);

//     } catch (err) {
//       console.error("Fetch error:", err);
//       alert("Failed to load numbers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= BLOCK =================
//   const blockNumber = async () => {
//   try {

//     await axios.post(
//       ENDPOINTS.DCRM_BLOCK_NUMBER,
//       {
//         number: selectedNumber,
//         name: selectedName,
//         reason: reason, // 👈 selected reason
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     Swal.fire({
//   icon: "success",
//   title: "Blocked!",
//   text: "Number has been blocked successfully",
//   timer: 2000,
//   showConfirmButton: false,
// });


//     setShowModal(false);
//     fetchNumbers();

//   } catch (err) {
//     console.error("Block error:", err);
//    Swal.fire({
//   icon: "error",
//   title: "Oops!",
//   text: "Action failed. Try again.",
// });

//   }
// };


//   // ================= UNBLOCK =================
//   const unblockNumber = async (number) => {
//     try {

//       await axios.post(
//         ENDPOINTS.DCRM_UNBLOCK_NUMBER,
//         { number },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       Swal.fire({
//   icon: "success",
//   title: "Unblocked!",
//   text: "Number has been unblocked",
//   timer: 2000,
//   showConfirmButton: false,
// });
//       fetchNumbers();

//     } catch (err) {
//       console.error("Unblock error:", err);
//       alert("Unblock failed");
//     }
//   };

//   // ================= LOAD =================
//   useEffect(() => {
//     fetchNumbers();
//   }, []);

//   // ================= UI =================
//   // ================= UI =================
//   const actionBtnStyle = {
//   border: "none",
//   padding: "7px 16px",
//   borderRadius: "6px",
//   cursor: "pointer",
//   fontSize: "14px",
//   fontWeight: "600",
//   minWidth: "90px",
//   transition: "0.2s",
// };
// const totalPages = Math.ceil(data.length / itemsPerPage);
// const startIndex = (currentPage - 1) * itemsPerPage;
// const endIndex = startIndex + itemsPerPage;
// const paginatedData = data.slice(startIndex, endIndex);


// return (
//   <div
//     style={{
//       padding: "30px",
//       minHeight: "100vh",
//       fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
//     }}
//   >
    
//     {/* ===== Table Card ===== */}
//     <div
//       style={{
//         background: "#ffffff",
//         borderRadius: "18px",
//         boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
//         padding: "20px",
//         overflowX: "auto",
//       }}
//     >
//       {loading && (
//         <p style={{ textAlign: "center", color: "#8e8e93" }}>
//           Loading data...
//         </p>
//       )}

//       <table
//         width="100%"
//         cellPadding="12"
//         style={{
//           borderCollapse: "collapse",
//           textAlign: "center",
//         }}
//       >
//         <thead>
//           <tr
//             style={{
//               background: "#f2f2f7",
//               color: "#1c1c1e",
//               fontWeight: 600,
//             }}
//           >
//             <th>S.No</th>
//             <th>Number</th>
//             <th>Lead Name</th>
//             <th>Calls</th>
//             <th>Status</th>
//             <th>Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.length === 0 && !loading && (
//             <tr>
//               <td colSpan="6" style={{ padding: "25px", color: "#8e8e93" }}>
//                 No Records Found
//               </td>
//             </tr>
//           )}

//           {paginatedData.map((item, index) => (
//             <tr
//               key={index}
//               style={{
//                 borderBottom: "1px solid #e5e5ea",
//               }}
//             >
//               <td style={{ color: "#8e8e93" }}>
//                 {startIndex + index + 1}
//               </td>

//               <td>{item.call_log_number}</td>

//               <td>{item.name || "-"}</td>

//               <td>{item.total_calls}</td>

//               {/* ===== Status Badge ===== */}
//               <td>
//                 {item.is_blocked ? (
//                   <span
//                     style={{
//                       background: "#ffebee",
//                       color: "#ff3b30",
//                       padding: "4px 12px",
//                       borderRadius: "999px",
//                       fontSize: "13px",
//                       fontWeight: 600,
//                     }}
//                   >
//                     Blocked
//                   </span>
//                 ) : (
//                   <span
//                     style={{
//                       background: "#e9f7ef",
//                       color: "#34c759",
//                       padding: "4px 12px",
//                       borderRadius: "999px",
//                       fontSize: "13px",
//                       fontWeight: 600,
//                     }}
//                   >
//                     Active
//                   </span>
//                 )}
//               </td>

//               {/* ===== Action Button ===== */}
//               <td>
//                 <button
//                   onClick={() => {
//                     if (item.is_blocked) {
//                       unblockNumber(item.call_log_number);
//                     } else {
//                       setSelectedNumber(item.call_log_number);
//                       setSelectedName(item.name);
//                       setReason("Spam");
//                       setShowModal(true);
//                     }
//                   }}
//                   style={{
//                     padding: "6px 16px",
//                     borderRadius: "999px",
//                     border: "none",
//                     cursor: "pointer",
//                     fontWeight: 500,
//                     background: item.is_blocked ? "#34c759" : "#ff3b30",
//                     color: "#fff",
//                   }}
//                 >
//                   {item.is_blocked ? "Unblock" : "Block"}
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>

//     {totalPages > 1 && (
//       <div
//         style={{
//           marginTop: "20px",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           gap: "12px",
//         }}
//       >
//         {/* Prev */}
//         <button
//           disabled={currentPage === 1}
//           onClick={() => setCurrentPage((p) => p - 1)}
//           style={{
//             padding: "6px 14px",
//             borderRadius: "10px",
//             border: "none",
//             background: "#e5e5ea",
//             cursor: currentPage === 1 ? "not-allowed" : "pointer",
//             fontWeight: 500,
//           }}
//         >
//           Prev
//         </button>

//         {/* Current Page */}
//         <span
//           style={{
//             padding: "6px 16px",
//             borderRadius: "10px",
//             background: "#007aff",
//             color: "#fff",
//             fontWeight: 600,
//             minWidth: "40px",
//             textAlign: "center",
//           }}
//         >
//           {currentPage}
//         </span>

//         {/* Next */}
//         <button
//           disabled={currentPage === totalPages}
//           onClick={() => setCurrentPage((p) => p + 1)}
//           style={{
//             padding: "6px 14px",
//             borderRadius: "10px",
//             border: "none",
//             background: "#e5e5ea",
//             cursor:
//               currentPage === totalPages ? "not-allowed" : "pointer",
//             fontWeight: 500,
//           }}
//         >
//           Next
//         </button>
//       </div>
//     )}

//     {/* ===== Block Reason Modal ===== */}
//     {showModal && (
//       <div
//         style={{
//           position: "fixed",
//           inset: 0,
//           background: "rgba(0,0,0,0.35)",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           zIndex: 9999,
//         }}
//       >
//         <div
//           style={{
//             background: "#ffffff",
//             padding: "22px",
//             borderRadius: "20px",
//             width: "360px",
//             boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
//           }}
//         >
//           <h3 style={{ marginBottom: "10px", color: "#1c1c1e" }}>
//             🚫 Block Number
//           </h3>

//           <p style={{ fontSize: "14px", color: "#8e8e93" }}>
//             Choose a reason
//           </p>

//           <div style={{ marginTop: "15px" }}>
//             {["Spam", "Personal", "Marketing", "Other"].map((item) => (
//               <label
//                 key={item}
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   marginBottom: "12px",
//                   cursor: "pointer",
//                   fontSize: "15px",
//                 }}
//               >
//                 <input
//                   type="radio"
//                   value={item}
//                   checked={reason === item}
//                   onChange={(e) => setReason(e.target.value)}
//                   style={{ marginRight: "10px" }}
//                 />
//                 {item}
//               </label>
//             ))}
//           </div>

//           <div
//             style={{
//               marginTop: "20px",
//               display: "flex",
//               gap: "10px",
//             }}
//           >
//             <button
//               onClick={() => setShowModal(false)}
//               style={{
//                 flex: 1,
//                 background: "#e5e5ea",
//                 border: "none",
//                 padding: "10px",
//                 borderRadius: "14px",
//                 fontWeight: 500,
//               }}
//             >
//               Cancel
//             </button>

//             <button
//               onClick={blockNumber}
//               style={{
//                 flex: 1,
//                 background: "#dc2626",
//                 color: "#fff",
//                 border: "none",
//                 padding: "10px",
//                 borderRadius: "14px",
//                 fontWeight: 500,
//               }}
//             >
//               Block
//             </button>
//           </div>
//         </div>
//       </div>
//     )}
//   </div>
// );


// };

// export default BlockUnblockNumber;