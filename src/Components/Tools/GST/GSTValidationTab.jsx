import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
} from "@mui/material";

const GSTValidationTab = ({ onCheckUsed, limitReached }) => {
  const [gstin, setGstin] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Load from sessionStorage on mount
  useEffect(() => {
    const savedGstin = sessionStorage.getItem("gst_gstin");
    const savedData = sessionStorage.getItem("gst_validation_data");

    if (savedGstin && savedData) {
      setGstin(savedGstin);
      setData(JSON.parse(savedData));
    }
  }, []);

  const handleVerify = async () => {
    if (limitReached) return;
    if (!gstin.trim()) return setError("Please enter a valid GSTIN.");

    setError("");
    setLoading(true);
    setData(null);

    try {
      const res = await axios.get(
        `https://gst-verification-api-get-profile-returns-data.p.rapidapi.com/v1/gstin/${gstin}/details`,
        {
          headers: {
            "x-rapidapi-key": "fa68277075mshb0f2698e005e33cp1f12d7jsn30abcb7a117b",
            "x-rapidapi-host":
              "gst-verification-api-get-profile-returns-data.p.rapidapi.com",
          },
        }
      );

      const fetchedData = res.data?.data || null;
      setData(fetchedData);

      // ✅ Save to sessionStorage
      sessionStorage.setItem("gst_gstin", gstin);
      sessionStorage.setItem("gst_validation_data", JSON.stringify(fetchedData));

      onCheckUsed();
    } catch {
      setError("Failed to fetch GST details. Please check the GSTIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        background: "transparent",
        px: { xs: 1, md: 4 },
      }}
    >
      {/* Input Section */}
      <Box
        sx={{
          background: "linear-gradient(180deg, #f5f6f7 0%, #eaeef3 100%)",
          borderRadius: "16px",
          p: 3,
          boxShadow:
            "inset 1px 1px 3px rgba(255,255,255,0.8), inset -2px -2px 5px rgba(0,0,0,0.08)",
          mb: 3,
        }}
      >
        <TextField
          label="Enter GSTIN"
          fullWidth
          variant="outlined"
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow:
                "inset 1px 1px 3px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.05)",
              "& fieldset": { border: "none" },
            },
            "& .MuiInputLabel-root": {
              color: "#7d7d7e",
              fontWeight: 500,
            },
          }}
        />

        <Button
          variant="contained"
          disableElevation
          onClick={handleVerify}
          disabled={loading || limitReached}
          fullWidth
          sx={{
            borderRadius: "12px",
            py: 1.4,
            fontWeight: 600,
            fontSize: "0.95rem",
            background: limitReached
              ? "linear-gradient(90deg, #ff3b30, #ff453a)"
              : "linear-gradient(90deg, #0a84ff, #5ac8fa)",
            color: "#fff",
            textTransform: "none",
            boxShadow:
              "0 4px 10px rgba(0,0,0,0.1), inset 1px 1px 2px rgba(255,255,255,0.4)",
            "&:hover": {
              background: limitReached
                ? "linear-gradient(90deg, #ff453a, #ff3b30)"
                : "linear-gradient(90deg, #007aff, #34c759)",
            },
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" /> Verifying...
            </Box>
          ) : (
            "Validate GSTIN"
          )}
        </Button>

        {error && (
          <Typography
            sx={{
              mt: 2,
              color: "#ff3b30",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* Result Section */}
      {data && (
        <Fade in timeout={400}>
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 4,
              borderRadius: "24px",
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,247,250,0.9))",
              backdropFilter: "blur(12px)",
              boxShadow:
                "0 6px 16px rgba(0,0,0,0.06), inset 1px 1px 4px rgba(255,255,255,0.8)",
              transition: "0.3s",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#007aff",
                fontWeight: 700,
                mb: 2,
                fontSize: "1.25rem",
              }}
            >
              GSTIN Verification Result
            </Typography>

            {/* Summary Header */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontSize: "1.1rem" }}
              >
                {data.legal_name || "N/A"}
              </Typography>
              <Typography
                sx={{
                  color: "#6c757d",
                  fontSize: "0.95rem",
                  mb: 1,
                }}
              >
                {data.trade_name || "N/A"}
              </Typography>

              <Chip
                label={data.status === "Active" ? "Active" : "Inactive"}
                sx={{
                  backgroundColor:
                    data.status === "Active" ? "#34c75920" : "#ff3b3020",
                  color: data.status === "Active" ? "#34c759" : "#ff3b30",
                  fontWeight: 600,
                  px: 1,
                  borderRadius: "10px",
                }}
              />
            </Box>

            {/* Table-Like Structure */}
            <TableContainer
              sx={{
               
                mx: "auto",
                borderRadius: "16px",
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, #fafafa, #f1f3f6)",
                boxShadow:
                  "inset 1px 1px 4px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <Table>
                <TableBody>
                  {[
                    ["GSTIN", data.gstin],
                    ["Taxpayer Type", data.type],
                    ["Registration Date", data.registration_date],
                    ["Business Nature", data.nature?.join(", ")],
                    ["State Jurisdiction", data.state_jurisdiction],
                    ["Centre Jurisdiction", data.centre_jurisdiction],
                  ].map(([label, value], index) => (
                    <TableRow
                      key={label}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(255,255,255,0.7)",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#1d1d1f",
                          width: "40%",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        {label}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#4a4a4a",
                          fontWeight: 500,
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        {value || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default GSTValidationTab;
