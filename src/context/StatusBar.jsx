import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button,
} from '@mui/material';
import { useToast } from '../context/ToastContext';
import Confetti from 'react-confetti';
import axios from "axios";
import { ENDPOINTS } from '../api/constraints';

const mandatoryInputStages = ['Proposal', 'Demo', 'Won'];

const StatusBar = ({ leadId, leadData }) => {
  const [stages, setStages] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogValue, setDialogValue] = useState('');
  const [dialogStageIndex, setDialogStageIndex] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
   const { showToast } = useToast();

  // Fetch all lead stages
  const fetchStages = async () => {

      

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch stages");
      }


      const data = await response.json();
      const formattedStages = Array.isArray(data)
        ? data.map(item => ({
            id: item.ilead_status_id,
            name: item.clead_name,
          }))
        : [];

      setStages(formattedStages);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch stage data");
    }
  };

  // Fetch current stage for the lead
  const fetchCurrentStage = async () => {


      const currentStatusId = leadData.ileadstatus_id;
      const index = stages.findIndex(stage => stage.id === currentStatusId);
      if (index !== -1) {
        setCurrentStageIndex(index);
      }
     
  };

  useEffect(() => {
    const init = async () => {
      await fetchStages();
    };
    init();
  }, []);

  useEffect(() => {
    if (stages.length > 0) {
      fetchCurrentStage();
    }
  }, [stages]);

  const handleStageClick = async (clickedIndex, statusId) => {
    // Disallow going back
    if (clickedIndex <= currentStageIndex) return;

    const stageName = stages[clickedIndex].name;

    if (mandatoryInputStages.includes(stageName)) {
      setDialogStageIndex(clickedIndex);
      setOpenDialog(true);
      return;
    }

    await updateStage(clickedIndex, statusId);
          showToast('success', 'Status changed!');

    
  };

  const updateStage = async (newIndex, statusId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS_UPDATE}/${leadId}/status/${statusId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        alert("Failed to update status");
        return;
      }

      setCurrentStageIndex(newIndex);
      if (stages[newIndex].name === 'Won') {
        setShowConfetti(true);
      }
    } catch (e) {
      console.error(e);
      alert("Error updating status");
    }
  };

const handleDialogSave = async () => {
  if (!dialogValue) {
    alert("Please enter a value before continuing.");
    return;
  }

  const stageName = stages[dialogStageIndex]?.name;
  const statusId = stages[dialogStageIndex].id;

  await updateStage(dialogStageIndex, statusId);

  try {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user");
    const userData = JSON.parse(userId);

    console.log(userData.iUser_id);


    // Prepare request body based on stage
    let requestBody;

    if (stageName === 'Demo') {
      requestBody = {
        caction: dialogValue,  // text input from user
        iaction_doneby: userData.iUser_id,    // example static user id
        iamount: null,         // explicitly null for Demo
        ilead_id: parseInt(leadId),
      };
    } else if (['Proposal', 'Won'].includes(stageName)) {
      requestBody = {
        caction: stageName,           // "Proposal" or "Won"
        iaction_doneby: userData.iUser_id,
        iamount: Number(dialogValue), // number input from user
        ilead_id: parseInt(leadId),
      };
    } else {
      // fallback or other stages
      requestBody = {
        caction: stageName,
        iaction_doneby: userData.iUser_id,
        iamount: dialogValue,
        ilead_id: parseInt(leadId),
      };
    }

    const response = await axios.post(`${ENDPOINTS.LEAD_STATUS_ACTION}`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    console.log("POST Success:", response.data);
  } catch (error) {
    console.error("POST Error:", error?.response?.data?.message || error.message);
  }

  setOpenDialog(false);
  setDialogValue('');
  setDialogStageIndex(null);
};



  return (
    <div className="flex flex-wrap items-center gap-2 p-4">
      {stages.map((stage, index) => {
        const isCompleted = index < currentStageIndex;
        const isActive = index === currentStageIndex;

        return (
          <div
            key={stage.id}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
    ${isCompleted ? 'bg-green-600 text-white' :
      isActive ? 'bg-blue-600 text-white' :
      'bg-gray-300 text-gray-800'}
    ${index > currentStageIndex ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
  `}
            onClick={() => handleStageClick(index, stage.id)}
          >
            {stage.name}
          </div>
        );
      })}

      {/* Dialog for Proposal/Demo/Won */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {stages[dialogStageIndex]?.name} - Enter Required Value
        </DialogTitle>
        <DialogContent>
       <TextField
  fullWidth
  variant="outlined"
  value={dialogValue}
  onChange={(e) => setDialogValue(e.target.value)}
  label="Required Value"
  type={
    ['Proposal', 'Won'].includes(stages[dialogStageIndex]?.name)
      ? 'number'
      : 'text'
  }
  InputProps={{
    inputProps: {
      inputMode: ['Proposal', 'Won'].includes(stages[dialogStageIndex]?.name)
        ? 'numeric'
        : undefined,
      style: {
        MozAppearance: 'textfield',
      },
    },
    style: {
      // Optional: hide arrows in WebKit browsers
    },
  }}
  sx={{
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
      {
        WebkitAppearance: 'none',
        margin: 0,
      },
  }}
/>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confetti for Won */}
      {showConfetti && <Confetti />}
    </div>
  );
};

export default StatusBar;
