import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
} from "@mui/material";
import { companyContext } from "../../../../context/companyContext.jsx";
import { useNavigate } from "react-router-dom";
import { FiEye, FiFileText } from "react-icons/fi";
import LeadSummaryModal from "../../../../pages/dashboard/LeadViewComponents/LeadSummaryModal.jsx";
import { ENDPOINTS } from "../../../../api/constraints.js";



const LinkedLeads = ({ open, onClose, lead,onCountUpdate }) => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [linkedLeads, setLinkedLeads] = useState([]);
  const [linkedCount, setLinkedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLeadId, setSummaryLeadId] = useState(null);


  useEffect(() => {
    if (open && lead?.iphone_no) {
      fetchLinkedLeads();
    }
  }, [open, lead]);


const fetchLinkedLeads = async () => {
  try {
    setLoading(true);
    const url = `${ENDPOINTS.LINKED_LEADS}/${companyId}/${lead.ilead_id}/${lead.iphone_no}`;
    const res = await axios.get(url);
    const leads = res.data?.data || [];
    const count = res.data?.count || 0;

    setLinkedLeads(leads);
    setLinkedCount(count);

    // send count to ProfileCard
    onCountUpdate?.(count);

  } catch (err) {
    console.error("Linked lead fetch error:", err);
  } finally {
    setLoading(false);
  }
};

return (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{
      style: {
        borderRadius: "16px",
      },
    }}
  >
    {/* Header */}
    <DialogTitle className="flex items-center justify-between bg-blue-50">
      <div className="flex items-center gap-2">
        🔗 <span className="font-semibold">Linked Leads</span>

        {linkedCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {linkedCount}
          </span>
        )}
      </div>

      <button onClick={onClose}  className="text-red-500 hover:text-gray-900 text-xl font-semibold" >
        ✕
      </button>
    </DialogTitle>

    {/* Content */}
    <DialogContent dividers className="bg-gray-50">

      {/* Loader */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <CircularProgress size={30} />
          <p className="text-sm text-gray-500">Loading linked leads...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && linkedLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
          <span className="text-3xl">📭</span>
          <Typography>No linked leads found</Typography>
        </div>
      )}

      {/* Table */}
      {!loading && linkedLeads.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="bg-white rounded-xl shadow-sm">

            <TableHead className="bg-blue-100">
              <TableRow>

                {[
                  "Lead Name",
                  "Phone",
                  "Email",
                  "Status",
                  "Owner",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    className="font-semibold text-gray-700"
                    align={head === "Actions" ? "center" : "left"}
                  >
                    {head}
                  </TableCell>
                ))}

              </TableRow>
            </TableHead>

            <TableBody>
              {linkedLeads.map((item) => (
                <TableRow
                  key={item.ilead_id}
                  hover
                  className="cursor-pointer hover:bg-blue-50 transition"
                  onClick={() => {
                    onClose();
                    navigate(`/leaddetailview/${item.ilead_id}`);
                  }}
                >
                  {/* Name */}
                  <TableCell className="font-medium text-gray-800">
                    {item.clead_name}
                  </TableCell>

                  {/* Phone */}
                  <TableCell>{item.iphone_no}</TableCell>

                  {/* Email */}
                  <TableCell>{item.cemail || "-"}</TableCell>

                  {/* Status */}
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {item.lead_status?.clead_name || "-"}
                    </span>
                  </TableCell>

                  {/* Owner */}
                  <TableCell>
                    {item.user?.cFull_name || "-"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <div className="flex justify-center gap-3">

                      {/* View */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          navigate(`/leaddetailview/${item.ilead_id}`);
                        }}
                        title="View Lead"
                        className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      >
                        <FiEye size={16} />
                      </button>

                      {/* Summary */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSummaryLeadId(item.ilead_id);
                          setShowSummary(true);
                        }}
                        title="View Summary"
                        className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition"
                      >
                        <FiFileText size={16} />
                      </button>

                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>

          </Table>
        </div>
      )}

    </DialogContent>


    {/* Summary Modal */}
    {showSummary && (
      <LeadSummaryModal
        leadId={summaryLeadId}
        onClose={() => setShowSummary(false)}
      />
    )}

  </Dialog>
);

};

export default LinkedLeads;