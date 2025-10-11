import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  LinearProgress,
  MenuItem,
} from "@mui/material";

const GSTReturnsTab = ({ onCheckUsed, limitReached }) => {
  const [gstin, setGstin] = useState("");
  const [year, setYear] = useState("2024-25");
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);

  // ✅ Generate dropdown years dynamically
  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      const start = currentYear - i - 1;
      const end = String(currentYear - i).slice(2);
      years.push(`${start}-${end}`);
    }
    return years;
  };

  const financialYears = getFinancialYears();

  // ✅ Load from sessionStorage on mount
  useEffect(() => {
    const savedGstin = sessionStorage.getItem("gst_gstin");
    const savedReturns = sessionStorage.getItem("gst_returns_data");
    const savedScore = sessionStorage.getItem("gst_compliance_score");

    if (savedGstin) setGstin(savedGstin);
    if (savedReturns) setReturnsData(JSON.parse(savedReturns));
    if (savedScore) setScore(parseInt(savedScore, 10));
  }, []);

  const handleFetchReturns = async () => {
    if (limitReached) return;
    if (!gstin.trim()) return setError("Please enter a valid GSTIN.");

    setError("");
    setLoading(true);
    setReturnsData([]);
    setScore(null);

    try {
      const res = await axios.get(
        `https://gst-verification-api-get-profile-returns-data.p.rapidapi.com/v1/gstin/${gstin}/return/${year}`,
        {
          headers: {
            "x-rapidapi-key": "fa68277075mshb0f2698e005e33cp1f12d7jsn30abcb7a117b",
            "x-rapidapi-host":
              "gst-verification-api-get-profile-returns-data.p.rapidapi.com",
          },
        }
      );

      const data = res.data?.data || [];
      setReturnsData(data);

      // ✅ Save data in sessionStorage
      sessionStorage.setItem("gst_gstin", gstin);
      sessionStorage.setItem("gst_returns_data", JSON.stringify(data));

      // Compute score
      if (data.length > 0) {
        const total = data.length;
        const filed = data.filter((r) => r.status === "Filed").length;
        const complianceScore = Math.round((filed / total) * 100);
        setScore(complianceScore);
        sessionStorage.setItem("gst_compliance_score", complianceScore);
      }

      onCheckUsed();
    } catch (err) {
      console.error(err);
      setError("Failed to fetch GST return details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      textAlign="center"
      sx={{
        px: { xs: 1, md: 4 },
        background: "transparent",
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
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Enter GSTIN"
              fullWidth
              variant="outlined"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  boxShadow:
                    "inset 1px 1px 3px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.05)",
                  "& fieldset": { border: "none" },
                },
                "& .MuiInputLabel-root": { color: "#7d7d7e", fontWeight: 500 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Financial Year"
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  boxShadow:
                    "inset 1px 1px 3px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.05)",
                  "& fieldset": { border: "none" },
                },
                "& .MuiInputLabel-root": { color: "#7d7d7e", fontWeight: 500 },
              }}
            >
              {financialYears.map((fy) => (
                <MenuItem key={fy} value={fy}>
                  {fy}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          disableElevation
          onClick={handleFetchReturns}
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
              <CircularProgress size={20} color="inherit" /> Fetching...
            </Box>
          ) : (
            "Get GST Returns"
          )}
        </Button>

        {error && (
          <Typography
            sx={{ mt: 2, color: "#ff3b30", fontWeight: 500, fontSize: "0.9rem" }}
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* Compliance Score */}
      {score !== null && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: "20px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.9))",
            boxShadow:
              "inset 1px 1px 4px rgba(255,255,255,0.8), 0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#007aff",
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
            }}
          >
            GST Compliance Score: {score}/100
          </Typography>

          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 10,
              borderRadius: 10,
              backgroundColor: "#dfe4ea",
              "& .MuiLinearProgress-bar": {
                background:
                  score > 90
                    ? "linear-gradient(90deg, #34c759, #30d158)"
                    : score > 70
                    ? "linear-gradient(90deg, #ffcc00, #ffd60a)"
                    : "linear-gradient(90deg, #ff3b30, #ff453a)",
              },
            }}
          />
        </Paper>
      )}

      {/* Return Data */}
      {returnsData.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: "20px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.9))",
            boxShadow:
              "inset 1px 1px 4px rgba(255,255,255,0.8), 0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#007aff", mb: 3, fontWeight: 700 }}
          >
            GST Return Filing History ({year})
          </Typography>

          {/* Centered Grid */}
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
          >
            {returnsData.map((ret, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    background:
                      "linear-gradient(180deg, #f8f9fa, #eef1f4)",
                    boxShadow:
                      "inset 1px 1px 4px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.06)",
                    height: "100%",
                    textAlign: "left",
                    mx: "auto",
                    maxWidth: "280px",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "#1d1d1f", mb: 0.5 }}
                  >
                    {ret.return_type}
                  </Typography>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    <strong>Period:</strong> {ret.return_period_formatted}
                  </Typography>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          ret.status === "Filed"
                            ? "#34c759"
                            : ret.status === "Not Filed"
                            ? "#ff3b30"
                            : "#ffcc00",
                        fontWeight: 600,
                      }}
                    >
                      {ret.status}
                    </span>
                  </Typography>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    <strong>Date of Filing:</strong> {ret.date_of_filing || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    <strong>Mode:</strong> {ret.mode_of_filing || "—"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default GSTReturnsTab;
