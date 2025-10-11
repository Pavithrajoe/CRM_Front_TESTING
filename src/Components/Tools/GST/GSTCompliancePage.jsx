import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Divider,
  useTheme,
} from "@mui/material";
import GSTValidationTab from "./GSTValidationTab";
import GSTReturnsTab from "./GSTReturnsTab";

const DAILY_LIMIT = 5;

const GSTCompliancePage = () => {
  const [activeTab, setActiveTab] = useState("validation");
  const [checkCount, setCheckCount] = useState(0);
  const theme = useTheme();

  // Load daily limit from localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("gstChecks")) || {};
    const today = new Date().toLocaleDateString();

    if (data.date !== today) {
      localStorage.setItem(
        "gstChecks",
        JSON.stringify({ date: today, count: 0 })
      );
      setCheckCount(0);
    } else {
      setCheckCount(data.count);
    }
  }, []);

  const handleCheckUsed = () => {
    const today = new Date().toLocaleDateString();
    const newCount = checkCount + 1;

    setCheckCount(newCount);
    localStorage.setItem(
      "gstChecks",
      JSON.stringify({ date: today, count: newCount })
    );
  };

  const remaining = DAILY_LIMIT - checkCount;
  const progressValue = (checkCount / DAILY_LIMIT) * 100;
  const limitReached = remaining <= 0;

  return (
    
      <Card
        elevation={0}
        sx={{
          borderRadius: "24px",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9))",
          backdropFilter: "blur(15px)",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.05), inset 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        <CardHeader
          title="GST Verification & Compliance"
          subheader="Your smart center for GST validation and filing compliance"
          sx={{
            textAlign: "center",
            pb: 0,
            "& .MuiCardHeader-title": {
              fontWeight: "700",
              fontSize: "1.3rem",
              letterSpacing: "-0.3px",
              color: "#1c1c1e",
            },
            "& .MuiCardHeader-subheader": {
              color: "#6c757d",
              fontSize: "0.9rem",
            },
          }}
        />

        <CardContent sx={{ px: 4, pt: 2, pb: 4 }}>
          {/* Daily Usage Tracker */}
          <Box
            sx={{
              background:
                "linear-gradient(180deg, #f0f2f6 0%, #e4e8ed 100%)",
              borderRadius: "16px",
              p: 3,
              mb: 4,
              boxShadow:
                "inset 1px 1px 4px rgba(255,255,255,0.7), inset -2px -2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "600",
                color: "#1d1d1f",
                mb: 0.5,
                fontSize: "0.95rem",
              }}
            >
              Daily Checks Used
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: limitReached ? "#d32f2f" : "#007aff",
                mb: 1.5,
                fontSize: "0.9rem",
              }}
            >
              {limitReached
                ? "Limit reached for today"
                : `${checkCount}/${DAILY_LIMIT} used · ${remaining} remaining`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 10,
                borderRadius: 10,
                backgroundColor: "#dfe4ea",
                "& .MuiLinearProgress-bar": {
                  background: limitReached
                    ? "linear-gradient(90deg, #ff3b30, #ff453a)"
                    : "linear-gradient(90deg, #0a84ff, #5ac8fa)",
                },
              }}
            />
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            centered
            textColor="primary"
            indicatorColor="primary"
            sx={{
              mb: 3,
              "& .MuiTab-root": {
                fontWeight: "600",
                fontSize: "0.95rem",
                color: "#6c757d",
                textTransform: "none",
                borderRadius: "10px",
                mx: 1,
                transition: "0.3s",
              },
              "& .Mui-selected": {
                background: "linear-gradient(180deg, #f9fafb, #eceef1)",
                color: "#007aff !important",
                boxShadow:
                  "inset 1px 1px 2px rgba(255,255,255,0.7), inset -1px -1px 3px rgba(0,0,0,0.05)",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab label="GST Validation" value="validation" />
            <Tab label="GST Returns Details" value="returns" />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {activeTab === "validation" ? (
              <GSTValidationTab
                onCheckUsed={handleCheckUsed}
                limitReached={limitReached}
              />
            ) : (
              <GSTReturnsTab
                onCheckUsed={handleCheckUsed}
                limitReached={limitReached}
              />
            )}
          </Box>
        </CardContent>
      </Card>
   
  );
};

export default GSTCompliancePage;
