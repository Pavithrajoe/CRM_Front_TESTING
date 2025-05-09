import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import Confetti from 'react-confetti';
import { ENDPOINTS } from '../api/constraints';
import { useEffect  } from 'react';

const StatusBar = ({ leadId }) => {
    


  const [stages, setStages] = useState([]);
  const [error, setError] = useState(null);



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
      console.log("The response is",data);

      // Assume the API response format is like { stages: ['Open', 'Contacted', ...] }
setStages(Array.isArray(data) ? data.map(item => item.clead_name) : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch stage data");
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);



  const [currentStage, setCurrentStage] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogValue, setDialogValue] = useState('');
  const [dialogStage, setDialogStage] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleStageClick = (index) => {
    if (index <= currentStage) return; // irreversible

    if (stages[index] === 'Proposal' || stages[index] === 'Won') {
      setDialogStage(stages[index]);
      setOpenDialog(true);
    } else {
      setCurrentStage(index); 
    }
  };

  const handleDialogSave = () => {
    console.log(`Saved value for ${dialogStage}:`, dialogValue);
    if (dialogStage === 'Won') setShowConfetti(true);

    const nextIndex = stages.indexOf(dialogStage);
    setCurrentStage(nextIndex);
    setOpenDialog(false);
    setDialogValue('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4">
      {stages.map((stage, index) => {
        const isCompleted = index < currentStage;
        const isActive = index === currentStage;

        return (
          <div
            key={stage}
            className={`flex items-center cursor-pointer px-3 py-1 rounded-full transition-all
              ${isCompleted ? 'bg-green-400 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}
              ${index <= currentStage + 1 ? 'hover:scale-105' : 'cursor-not-allowed'}
            `}
            onClick={() => handleStageClick(index)}
          >
            {stage}
            {index < stages.length - 1 && (
              <span className="mx-2 text-gray-500">{'>'}</span>
            )}
          </div>
        );
      })}

      {/* Popup Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{dialogStage} - Enter Value</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
            label="Value"
            type="number"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confetti when "Won" */}
      {showConfetti && <Confetti />}
    </div>
  );
};

export default StatusBar;
