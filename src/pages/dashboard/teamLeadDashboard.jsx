import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
} from "@mui/material";

import { ENDPOINTS } from "../../api/constraints";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import KPIStats from "@/Components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/Components/dashboard/teamlead/tlremindercard";
import TaskSameDay from "@/Components/common/taskSameDay";

const LeadsDashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for Reminders, 1 for Tasks

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    // Show popup only if not already shown
    const hasSeenIntro = localStorage.getItem("hasSeenDashboardIntro");
    if (!hasSeenIntro) {
      setShowPopup(true);
      localStorage.setItem("hasSeenDashboardIntro", "true");
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          `${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userObj.jwtToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        // console.error(" Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="flex mt-[-80px]">
      {/* Main Content */}
      <main className="w-full flex-1 p-6 bg-gray-50 mt-[80px] min-h-screen">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader />
          <ProfileHeader />
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-2 gap-6">
          {/* KPI Stats Card with fixed height and overflow */}
          <Box
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
              p: 2,
              minHeight: "400px", // Set consistent minimum height
              overflowY: "auto", // Enable vertical scrolling
            }}
          >
            <KPIStats data={dashboardData?.details} />
          </Box>
          
          {/* Tab View for Reminders and Tasks with the same fixed height and overflow */}
          <Box 
            sx={{ 
              width: '100%', 
              minHeight: '400px', // Match the height of the KPIStats Box
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, width: '100%' }}>
  <Tabs
    value={activeTab}
    onChange={handleTabChange}
    variant="fullWidth" // This makes each tab span half the header width
    sx={{
      '& .MuiTab-root': {
        textTransform: 'none',
        fontWeight: 500,
        minWidth: 0, // Important: don’t restrict tab width
        fontSize: '0.875rem',
        px: 0, // Remove horizontal padding if you want maximum width usage
      },
    }}
  >
    <Tab label="Reminders" />
    <Tab label="Tasks" />
  </Tabs>
</Box>

            
            {/* Tab Content with scrollable overflow */}
            <Box 
              sx={{ 
                overflowY: 'auto', // Enable vertical scrolling for the content area
                maxHeight: 'calc(600px - 70px)', // Adjust height to account for the tab bar
                px: 2,
                py: 1,
              }}
            >
              {activeTab === 0 && (
                <RemindersCard reminder_data={dashboardData?.details?.reminders} />
              )}
              {activeTab === 1 && (
                <TaskSameDay />
              )}
            </Box>
          </Box>
        </div>
      </main>

      {/* First Login Feature Popup */}
      <Dialog
        open={showPopup}
        onClose={() => setShowPopup(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            padding: 2,
            minWidth: { xs: '280px', sm: '320px', md: '400px' },
            bgcolor: '#F9F9F9',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: '1.25rem',
            color: '#1C1C1E',
            textAlign: 'center',
            pb: 0,
            pt: 2,
            userSelect: 'none',
          }}
        >
          🎉 OCRM V 3.1 is here ! 🎉
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            fontSize: '0.95rem',
            color: '#3C3C4399',
            lineHeight: 1.6,
            pt: 2,
            pb: 3,
            '& ul': {
              paddingLeft: 3,
              marginTop: 1.5,
              listStyleType: 'none',
              '& li': {
                position: 'relative',
                paddingLeft: '1.8em',
                marginBottom: 1.2,
                userSelect: 'none',
                '&::before': {
                  content: '"•"',
                  position: 'absolute',
                  left: 0,
                  color: '#1976d2',
                  fontWeight: 'bold',
                },
              },
            },
          }}
        >
          <ul>
            <li>👮 Enhanced Security</li>
            <li>🔒Your data is super encrypted </li>
            <li>📋 Seamlessly Create Tasks</li>
            <li>📱 DCRM is Here ! Boost your productivity</li>
            <li>🚀 Major UI/UX Upgrades for a Smoother, Modern Experience</li>
          </ul>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            pb: 2,
            pt: 0,
          }}
        >
          <Button
            onClick={() => setShowPopup(false)}
            variant="contained"
            sx={{
              bgcolor: '#007AFF',
              color: 'white',
              fontWeight: 600,
              borderRadius: '9999px',
              textTransform: 'none',
              px: 4,
              py: 1.5,
              boxShadow: '0 4px 8px rgba(0, 122, 255, 0.3)',
              '&:hover': {
                bgcolor: '#005BBB',
                boxShadow: '0 6px 12px rgba(0, 91, 187, 0.4)',
              },
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LeadsDashboard;