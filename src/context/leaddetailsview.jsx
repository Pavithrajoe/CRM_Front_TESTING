import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';
import ProfileCard from '../Components/common/ProfileCard';
import Comments from '../Components/commandshistory';
import RemainderPage from '../pages/RemainderPage';
import StatusBar from './StatusBar';
import LeadTimeline from '../Components/LeadTimeline';
import ActionCard from '../Components/common/ActrionCard';
import { ENDPOINTS } from '../api/constraints';
import { usePopup } from "../context/PopupContext";

const LeadDetailView = () => {
  const { leadId } = useParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDeal, setIsDeal] = useState(false);
  const [isLost, setIsLost] = useState(true); // true means active, false means lost
  const { showPopup } = usePopup();

  const handleTabChange = (event, newValue) => setTabIndex(newValue);
  const [leadData, setLeadData] = useState(null);

  const convertToDeal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.CONVERT_TO_DEAL}/${leadId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        showPopup("Error", "Failed to update status!", "error");
        return;
      }

      showPopup("Success", "Lead converted to deal!", "success");
      setIsDeal(true);
    } catch (error) {
      console.error("Error occurred while converting the lead to deal", error);
    }
  };

  const lostLead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}/${leadId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        showPopup("Error", "Failed to update lead as lost", "error");
        return;
      }

      showPopup("Info", "Lead updated as lost", "info");
      setIsLost(false);
    } catch (error) {
      console.error("Error occurred while marking the lead as lost", error);
    }
  };

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${ENDPOINTS.LEAD}/${leadId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch lead data");
        }

        const data = await response.json();
        setLeadData(data);
        setIsDeal(data.bisConverted);
        setIsLost(data.bactive); // true = active, false = lost
      } catch (error) {
        console.error("Error fetching lead data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Left Column */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-4">
        <div className="sticky top-4 z-10">
          <ProfileCard leadId={leadId} />
          <ActionCard leadId={leadId} />
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-full lg:w-full p-4">
        {/* Status Bar */}
        <div className="mb-4">
          <StatusBar leadId={leadId} leadData={leadData} />
        </div>

        {/* Tabs and Convert Button */}
        <div className="flex items-center justify-between mb-2">
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Lead Tabs">
            <Tab label="Activity" />
            <Tab label="Comments" />
            <Tab label="Reminders" />
          </Tabs>

          {/* Show Convert button only if not a deal and not lost */}
          {!loading && !isDeal && isLost && (
            <button
              className="bg-black border border-gray-300 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-md shadow ml-4"
              onClick={convertToDeal}
            >
              Convert
            </button>
          )}

          {/* Show Lost button only if lead is active */}
          {!loading && isLost && (
            <button
              className="bg-red-500 border ms-[-330px] border-red-300 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-md shadow ml-4"
              onClick={lostLead}
            >
              Lost
            </button>
          )}
        </div>

        {/* Tab Panels */}
        <Box className="mt-4 relative z-0">
          {tabIndex === 0 && <LeadTimeline leadId={leadId} />}
          {tabIndex === 1 && <Comments leadId={leadId} />}
          {tabIndex === 2 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>
    </div>
  );
};

export default LeadDetailView;