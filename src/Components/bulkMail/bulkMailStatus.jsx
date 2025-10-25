import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

// Get companyId and userId safely from token or localStorage
const getIdsFromStorage = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
      const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
      if (companyId && userId) return { companyId, userId };
    } catch {}
  }
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.iCompany_id && user?.iUser_id) return { companyId: user.iCompany_id, userId: user.iUser_id };
  } catch {}
  return { companyId: undefined, userId: undefined };
};

const BulkMailStatus = () => {
  const [mailData, setMailData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const token = localStorage.getItem("token");
  const { companyId, userId } = getIdsFromStorage();

  const fetchStatus = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${ENDPOINTS.BULK_MAIL_GET_BY_USER}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMailData(res.data.mails || []);
    } catch (err) {
      console.error("Status Fetch Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResendMail = async (mail) => {
    if (!companyId || !userId) return;

    setResendingId(mail.ilead_mail_id);

    const payload = {
      companyId, // always from storage
      userId, // always from storage
      mailSubject: mail.mail_subject || "Resending previous mail",
      mailContent: mail.mail_content || "<p>Resending previous mail content</p>",
      cc: mail.cc || [], // default empty array if none
      ilead_mail_id: mail.ilead_mail_id, // important for backend
    };

    try {
      await axios.post(ENDPOINTS.BULK_MAIL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`✅ Mail resent successfully for ${mail.cemail}`);
      fetchStatus(); // refresh table after resend
    } catch (err) {
      console.error("Resend Failed:", err);
      alert("❌ Resend failed. Check console.");
    } finally {
      setResendingId(null);
    }
  };

  if (loading)
    return (
      <Card sx={{ mt: 3, py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Card>
    );

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Bulk Mail Status
        </Typography>

        {mailData.length === 0 ? (
          <Typography>No Records Found</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mailData.map((mail) => (
                  <TableRow key={mail.ilead_mail_id}>
                    <TableCell>{mail.cemail}</TableCell>
                    <TableCell>{mail.mail_subject || "—"}</TableCell>
                    <TableCell>
                      <div dangerouslySetInnerHTML={{ __html: mail.mail_content || "—" }} />
                    </TableCell>
                    <TableCell>{new Date(mail.dcreated_dt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={mail.status}
                        color={mail.status === "sent" ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<SendIcon />}
                        disabled={resendingId === mail.ilead_mail_id}
                        onClick={() => handleResendMail(mail)}
                      >
                        {resendingId === mail.ilead_mail_id ? "Resending..." : "Resend"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkMailStatus;
