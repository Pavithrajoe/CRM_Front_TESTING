import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';
import ProfileCard from '../Components/common/ProfileCard';
import Comments from '../Components/commandshistory';
import RemainderPage from '../pages/RemainderPage';
import StatusBar from './StatusBar'; // Make sure the path is correct
import LeadTimeline from '../Components/LeadTimeline';
const LeadDetailView = () => {
  const { leadId } = useParams();
  const [tabIndex, setTabIndex] = useState(0); // 0: Comments, 1: Remainders

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Left Column - Profile Card */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-4">
        <div className="sticky top-4 z-10">
          <ProfileCard leadId={leadId} />
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-2/3 lg:w-3/4 p-4">
        {/* Status Bar Added Here */}
        <div className="mb-4">
          <StatusBar leadId={leadId} />
        </div>

        {/* Tabs for Comments and Reminders */}
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Lead Tabs">
          <Tab label="Activity"/>
          <Tab label="Comments" />
          <Tab label="Reminders" />
        </Tabs>

        <Box className="mt-4 relative z-0">
          {tabIndex == 0 && <LeadTimeline leadId={leadId}/>}
          {tabIndex === 1 && <Comments leadId={leadId} />}
          {tabIndex === 2 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>
    </div>
  );
};

export default LeadDetailView;
