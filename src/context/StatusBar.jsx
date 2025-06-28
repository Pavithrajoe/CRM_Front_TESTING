import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Autocomplete,
} from '@mui/material';
import { useToast } from '../context/ToastContext';
import Confetti from 'react-confetti';
import axios from 'axios';
import { ENDPOINTS } from '../api/constraints';

const mandatoryInputStages = ['Proposal', 'Won'];

const StatusBar = ({ leadId, leadData }) => {
  const [stages, setStages] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogValue, setDialogValue] = useState('');
  const [dialogStageIndex, setDialogStageIndex] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  const fetchStages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch stages');
      }
      const data = await response.json();
      const formattedStages = Array.isArray(data.response)
        ? data.response
            .map(item => ({
              id: item.ilead_status_id,
              name: item.clead_name,
              order: item.orderId || 9999,
            }))
            .sort((a, b) => a.order - b.order)
        : [];

      setStages(formattedStages);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to fetch stage data');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.USERS}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const fetchCurrentStage = () => {
    if (leadData && stages.length > 0) {
      const currentStatusId = leadData.ileadstatus_id;
      const index = stages.findIndex(stage => stage.id === currentStatusId);
      if (index !== -1) {
        setCurrentStageIndex(index);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchStages();
      await fetchUsers();
    };
    init();
  }, []);

  useEffect(() => {
    if (stages.length > 0 && leadData) {
      fetchCurrentStage();
    }
  }, [stages, leadData]);

  const handleStageClick = async (clickedIndex, statusId) => {
    if (clickedIndex <= currentStageIndex) {
      showToast('info', 'Cannot go back or re-select current stage.');
      return;
    }

    const stageName = stages[clickedIndex]?.name;
    setDialogStageIndex(clickedIndex);

    if (stageName?.toLowerCase().includes('demo')) {
      setDialogValue({
        demoSessionType: '',
        demoSessionStartTime: '',
        demoSessionEndTime: '',
        notes: '',
        place: '',
        demoSessionAttendees: [],
      });
      setOpenDialog(true);
      return;
    }

    if (mandatoryInputStages.map(i => i.toLowerCase()).includes(stageName?.toLowerCase())) {
      setDialogValue('');
      setOpenDialog(true);
      return;
    }

    await updateStage(clickedIndex, statusId);
    showToast('success', 'Status changed!');
  };

  const updateStage = async (newIndex, statusId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${ENDPOINTS.LEAD_STATUS_UPDATE}/${leadId}/status/${statusId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      setCurrentStageIndex(newIndex);
      showToast('success', 'Lead status updated successfully!');
      if (stages[newIndex].name?.toLowerCase() === 'won') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (e) {
      console.error('Error updating status:', e);
      showToast('error', e.message || 'Error updating status');
    }
  };

  const handleDialogSave = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user');
    let userData = null;
    try {
      userData = JSON.parse(userId);
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      showToast('error', 'User data not found. Please log in again.');
      setOpenDialog(false);
      return;
    }

    const stageName = stages[dialogStageIndex]?.name;
    const statusId = stages[dialogStageIndex].id;

    try {
      if (stageName?.toLowerCase().includes('demo')) {
        if (
          !dialogValue.demoSessionType ||
          !dialogValue.demoSessionStartTime ||
          !dialogValue.demoSessionEndTime ||
          !dialogValue.place ||
          !dialogValue.notes ||
          (dialogValue.demoSessionAttendees?.length === 0)
        ) {
          showToast('error', 'Please fill all mandatory demo details.');
          return;
        }

        const requestBody = {
          demoSessionType: dialogValue.demoSessionType,
          demoSessionStartTime: new Date(dialogValue.demoSessionStartTime).toISOString(),
          demoSessionEndTime: new Date(dialogValue.demoSessionEndTime).toISOString(),
          notes: dialogValue.notes,
          place: dialogValue.place,
          leadId: parseInt(leadId),
          demoSessionAttendees: dialogValue.demoSessionAttendees.map(u => ({
            attendeeId: u.iUser_id,
          })),
        };

        await axios.post(`${ENDPOINTS.DEMO_SESSION_DETAILS}`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        showToast('success', 'Demo session details saved!');
      } else if (['proposal', 'won'].includes(stageName?.toLowerCase())) {
        const amount = parseFloat(dialogValue);
        if (isNaN(amount) || amount <= 0) {
          showToast('error', 'Please enter a valid positive amount.');
          return;
        }

        const requestBody = {
          caction: stageName,
          iaction_doneby: userData.iUser_id,
          iamount: amount,
          ilead_id: parseInt(leadId),
        };

        await axios.post(`${ENDPOINTS.LEAD_STATUS_ACTION}`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        showToast('success', `${stageName} details saved!`);
      }

      await updateStage(dialogStageIndex, statusId);
    } catch (error) {
      console.error('POST Error:', error?.response?.data?.message || error.message);
      showToast('error', error?.response?.data?.message || 'Failed to save details.');
    } finally {
      setOpenDialog(false);
      setDialogValue('');
      setDialogStageIndex(null);
    }
  };

  return (
    <div className="w-full px-4 py-6">
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="flex items-center justify-between relative">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isActive = index === currentStageIndex;
          const isClickable = index > currentStageIndex;

          return (
            <div key={stage.id} className="flex flex-col items-center flex-1">
              <div
                onClick={() => handleStageClick(index, stage.id)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full 
                  ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : isClickable
                      ? 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                  transition-colors duration-200`}
              >
                {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
              </div>
              <span className="mt-2 text-sm text-center">{stage.name}</span>
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, padding: 2, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
          {stages[dialogStageIndex]?.name?.toLowerCase().includes('demo')
            ? 'Demo - Enter Details'
            : `${stages[dialogStageIndex]?.name} - Enter Value`}
        </DialogTitle>

        <DialogContent sx={{ width: '100%', maxWidth: 500 }}>
          {stages[dialogStageIndex]?.name?.toLowerCase().includes('demo') ? (
            <>
              <Autocomplete
                fullWidth
                options={['Online', 'Offline']}
                value={dialogValue.demoSessionType || null}
                onChange={(event, newValue) =>
                  setDialogValue(prev => ({ ...prev, demoSessionType: newValue }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Session Type"
                    variant="outlined"
                    sx={{ mt: 2 }}
                    required
                  />
                )}
              />

              <TextField
                label="Start Time"
                type="datetime-local"
                fullWidth
                value={dialogValue.demoSessionStartTime || ''}
                onChange={(e) =>
                  setDialogValue(prev => ({ ...prev, demoSessionStartTime: e.target.value }))
                }
                sx={{ mt: 2 }}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                label="End Time"
                type="datetime-local"
                fullWidth
                value={dialogValue.demoSessionEndTime || ''}
                onChange={(e) =>
                  setDialogValue(prev => ({ ...prev, demoSessionEndTime: e.target.value }))
                }
                sx={{ mt: 2 }}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={dialogValue.notes || ''}
                onChange={(e) => setDialogValue(prev => ({ ...prev, notes: e.target.value }))}
                sx={{ mt: 2 }}
                required
              />

              <TextField
                label={dialogValue.demoSessionType === 'Online' ? 'Meeting Link' : 'Place'}
                fullWidth
                value={dialogValue.place || ''}
                onChange={(e) => setDialogValue(prev => ({ ...prev, place: e.target.value }))}
                sx={{ mt: 2 }}
                required
              />

              <Autocomplete
                multiple
                options={users}
                getOptionLabel={(option) => option.cFull_name || ''}
                isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
                value={
                  (dialogValue.demoSessionAttendees || []).map(selected =>
                    users.find(user => user.iUser_id === selected.iUser_id) || selected
                  )
                }
                onChange={(event, newValue) =>
                  setDialogValue(prev => ({ ...prev, demoSessionAttendees: newValue }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Attendees"
                    variant="outlined"
                    required
                    error={dialogValue.demoSessionAttendees?.length === 0}
                    helperText={
                      dialogValue.demoSessionAttendees?.length === 0
                        ? 'Please select at least one attendee'
                        : ''
                    }
                    sx={{ mt: 2 }}
                  />
                )}
              />
            </>
          ) : (
            <TextField
              fullWidth
              variant="outlined"
              value={dialogValue}
              onChange={(e) => setDialogValue(e.target.value)}
              label="Enter Value"
              type="number"
              sx={{ mt: 1 }}
              required
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDialogSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {showConfetti && <Confetti />}
    </div>
  );
};

export default StatusBar;
