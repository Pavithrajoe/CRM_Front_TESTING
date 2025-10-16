
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useToast } from '../../../../../context/ToastContext';
import axios from 'axios';
import { ENDPOINTS } from '../../../../../api/constraints';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PaymentAndDomainDetailsCombined from './mileStoneDetails';
import PostSalesForm from './postSalesForm';

const MAX_REMARK_LENGTH = 500;

const MilestoneStatusBar = ({ leadId }) => {
  const { showToast } = useToast();
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [formData, setFormData] = useState({
    actualAmount: '',
    actualMilestoneDate: null,
    remarks: '',
    assignedTo: '',
    assignToMe: false,
    notifiedTo: '',
    notifyToMe: false,
    balanceAmount: '',
  });
  const [formErrors, setFormErrors] = useState({
    actualAmount: '',
    actualMilestoneDate: '',
    remarks: '',
  });

  const timeSlotProps = {
    popper: {
      placement: 'top-start',
      modifiers: [{ name: 'preventOverflow', options: { mainAxis: false } }],
      sx: { zIndex: 9999, '& .MuiPickersPopper-paper': { marginBottom: '60px' } },
    },
    desktopPaper: { sx: { zIndex: 9999, position: 'relative' } },
  };

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userObject = JSON.parse(userString);
        if (userObject && userObject.iUser_id) {
          setLoggedInUserId(userObject.iUser_id.toString());
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
      }
    }
  }, []);

  // Function to patch post sales status when sums match
  const updatePostSalesStatusIfComplete = async (postSalesId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${ENDPOINTS.MILESTONE_STATUS_PATCH}/${postSalesId}/change-status`;
      await axios.patch(
        url,
        { status: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('success', 'Post sales status updated successfully!');
    } catch (err) {
      console.error('Error updating post sales status:', err);
      showToast('error', 'Failed to update post sales status.');
    }
  };

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${ENDPOINTS.MILESTONE_BY_LEAD}/${leadId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.data) {
        const milestoneData = [...response.data.data].sort((a, b) => a.id - b.id);
        setMilestones(milestoneData);

        const totalExpected = milestoneData.reduce((sum, m) => sum + (parseFloat(m.expectedAmount) || 0), 0);
        const totalActual = milestoneData.reduce((sum, m) => sum + (parseFloat(m.actualAmount) || 0), 0);

        const postSalesId = milestoneData[0]?.postSalesId;

        if (postSalesId && Math.abs(totalExpected - totalActual) < 0.01) {
          await updatePostSalesStatusIfComplete(postSalesId);
        }

        const currentIndex = milestoneData.findIndex(
          m => !(m.actualAmount > 0 && m.actualMilestoneDate)
        );
        setCurrentStageIndex(currentIndex === -1 ? milestoneData.length : currentIndex);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError('Failed to fetch milestones data');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.USERS}`, {
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchMilestones();
      fetchUsers();
    }
  }, [leadId]);

  const formatAmount = amount =>
    `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const formatDate = dateString => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}:${month}:${year}`;
  };

  const isMilestoneCompleted = milestone =>
    milestone.actualAmount > 0 && milestone.actualMilestoneDate;

  const isCurrentMilestone = index =>
    index === currentStageIndex && currentStageIndex < milestones.length;

  // Only the current stage is clickable
  const handleMilestoneClick = (milestone, index) => {
    if (index > currentStageIndex) {
      showToast('info', 'Please complete previous milestones first.');
      return;
    }
    if (index < currentStageIndex && isMilestoneCompleted(milestone)) {
      showToast('info', 'This milestone is already completed.');
      return;
    }
    setSelectedMilestone(milestone);
    const initialActualAmount = milestone.actualAmount || 0;
    const balance = milestone.expectedAmount - initialActualAmount;
    setFormData({
      actualAmount: initialActualAmount > 0 ? initialActualAmount.toString() : '',
      actualMilestoneDate: milestone.actualMilestoneDate ? dayjs(milestone.actualMilestoneDate) : null,
      remarks: milestone.remarks || '',
      assignedTo: '',
      assignToMe: false,
      notifiedTo: '',
      notifyToMe: false,
      balanceAmount: balance
    });
    setFormErrors({ actualAmount: '', actualMilestoneDate: '', remarks: '' });
    setOpenDialog(true);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { actualAmount: '', actualMilestoneDate: '', remarks: '' };
    const actualAmount = parseFloat(formData.actualAmount);
    const expectedAmount = selectedMilestone.expectedAmount;
    if (!formData.actualAmount) {
      newErrors.actualAmount = 'Actual amount is required';
      isValid = false;
  
    } else if (actualAmount <= 0) {
      newErrors.actualAmount = 'Actual amount must be greater than 0';
      isValid = false;
    }
    if (!formData.actualMilestoneDate) {
      newErrors.actualMilestoneDate = 'Actual date & time is required';
      isValid = false;
    }
    if (formData.remarks && formData.remarks.length > MAX_REMARK_LENGTH) {
      newErrors.remarks = `Remarks cannot exceed ${MAX_REMARK_LENGTH} characters`;
      isValid = false;
    }
    setFormErrors(newErrors);
    return isValid;
  };

  const handleAssignToMeChange = e => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      assignToMe: checked,
      assignedTo: checked ? loggedInUserId : ''
    }));
  };

  const handleNotifyToMeChange = e => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      notifyToMe: checked,
      notifiedTo: checked ? loggedInUserId : ''
    }));
  };

  const handleAssignedToChange = e => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      assignedTo: value,
      assignToMe: value === loggedInUserId
    }));
  };

  const handleNotifiedToChange = e => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      notifiedTo: value,
      notifyToMe: value === loggedInUserId
    }));
  };

  const handleActualAmountChange = e => {
    const value = e.target.value;
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      actualAmount: value,
      balanceAmount: selectedMilestone ? selectedMilestone.expectedAmount - numericValue : 0
    }));
    if (formErrors.actualAmount) {
      setFormErrors(prev => ({ ...prev, actualAmount: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const token = localStorage.getItem('token');
      const actualDateISO = formData.actualMilestoneDate ? formData.actualMilestoneDate.toISOString() : null;
      const payload = {
        actualAmount: parseFloat(formData.actualAmount),
        actualMilestoneDate: actualDateISO,
        remarks: formData.remarks,
        ...(formData.assignedTo && { assignedTo: parseInt(formData.assignedTo) }),
        ...(formData.notifiedTo && { notifiedTo: parseInt(formData.notifiedTo) })
      };

      
      await axios.patch(`${ENDPOINTS.MILESTONE_UPDATE}/${selectedMilestone.id}`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      showToast('success', 'Milestone updated successfully!');
      setOpenDialog(false);
      fetchMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      showToast('error', error.response?.data?.message || 'Failed to update milestone');
    }
  };

  if (!milestones.length) {
    return <div className="text-center text-gray-500 py-4">No milestones defined</div>;
  }

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="w-full mx-auto px-4 py-6">
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <h3 className="text-lg font-semibold mb-4 text-blue-700 text-center">
            Payment Milestones Status
          </h3>
          <div className="flex items-center justify-between w-full">
            {milestones.map((milestone, index) => {
              const isCompleted = isMilestoneCompleted(milestone);
              const isActive = isCurrentMilestone(index);
              const isClickable = index === currentStageIndex;

              return (
                <React.Fragment key={milestone.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      onClick={() => isClickable && handleMilestoneClick(milestone, index)}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full
                        ${
                          isCompleted
                            ? "bg-green-600 text-white"
                            : isActive
                              ? "bg-blue-600 text-white animate-pulse cursor-pointer"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        } 
                        transition-colors duration-200 border-2 border-white shadow-lg`}
                      title={`Milestone ${index + 1}: ${formatAmount(milestone.expectedAmount)} - Due: ${formatDate(milestone.expectedMilestoneDate)}`}
                    >
                      {isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
                      <span className="absolute -bottom-6 text-xs font-bold">
                        {index + 1}
                      </span>
                    </div>
                    <span className="mt-6 text-sm text-center font-medium max-w-20 break-words">
                      Milestone {index + 1}
                    </span>
                    <div className="mt-1 text-xs text-center text-gray-600">
                      {(milestone.expectedAmount)}
                    </div>
                    <div className="mt-1 text-xs text-center text-gray-500">
                      <Calendar size={10} className="inline mr-1" />
                      Due: {formatDate(milestone.expectedMilestoneDate)}
                    </div>
                    {milestone.actualAmount > 0 && (
                      <div className="mt-1 text-xs text-center text-green-600 font-semibold">
                        Paid: {formatAmount(milestone.actualAmount)}
                      </div>
                    )}
                    {milestone.actualAmount > 0 && (
                      <div className="mt-1 text-xs text-center text-orange-500 font-semibold">
                        Remaining: {formatAmount(milestone.expectedAmount - milestone.actualAmount)}
                      </div>
                    )}
                  </div>
                  {index < milestones.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 -mt-12 z-0 ${
                        isMilestoneCompleted(milestone)
                          ? "border-t-2 border-dotted border-green-600"
                          : "border-t-2 border-dotted border-gray-300"
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg shadow-sm">
              <div className="font-semibold text-gray-700">Total Milestones</div>
              <div className="text-lg font-bold text-blue-600">{milestones.length}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg shadow-sm">
              <div className="font-semibold text-gray-700">Completed</div>
              <div className="text-lg font-bold text-green-600">
                {milestones.filter(m => isMilestoneCompleted(m)).length}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg shadow-sm">
              <div className="font-semibold text-gray-700">Remaining</div>
              <div className="text-lg font-bold text-orange-600">
                {milestones.length - milestones.filter(m => isMilestoneCompleted(m)).length}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg shadow-sm">
              <div className="font-semibold text-gray-700">Current Stage</div>
              <div className="text-lg font-bold text-purple-600">
                {currentStageIndex < milestones.length
                  ? `Milestone ${currentStageIndex + 1}`
                  : "Completed"}
              </div>
            </div>
          </div>
        </div>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <div className="flex justify-between items-center text-blue-800 font-bold">
              <span>
                Update Milestone{" "}
                {selectedMilestone &&
                  milestones.findIndex(m => m.id === selectedMilestone.id) + 1}
              </span>
              <IconButton onClick={() => setOpenDialog(false)}>
                <X size={20} className="text-red-500" />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent dividers>
            {selectedMilestone && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-semibold text-blue-700">Expected Amount</div>
                    <div className="text-lg font-bold">
                      {formatAmount(selectedMilestone.expectedAmount)}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-700">Expected Date</div>
                    <div className="text-lg font-bold">
                      {formatDate(selectedMilestone.expectedMilestoneDate)}
                    </div>
                  </div>
                </div>
                <TextField
                  label="Actual Amount *"
                  fullWidth
                  type="number"
                  value={formData.actualAmount}
                  onChange={handleActualAmountChange}
                  error={!!formErrors.actualAmount}
                  helperText={formErrors.actualAmount}
                  sx={{ mt: 2 }}
                />
                <DateTimePicker
                  label="Actual Date & Time *"
                  value={formData.actualMilestoneDate}
                  onChange={newValue =>
                    setFormData(prev => ({ ...prev, actualMilestoneDate: newValue }))
                  }
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                    seconds: renderTimeViewClock
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mt: 2 },
                      error: !!formErrors.actualMilestoneDate,
                      helperText: formErrors.actualMilestoneDate,
                      InputLabelProps: { shrink: true }
                    },
                    popper: timeSlotProps.popper,
                    desktopPaper: timeSlotProps.desktopPaper
                  }}
                  desktopModeMediaQuery="@media (min-width: 0px)"
                />
                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.remarks}
                  onChange={e => {
                    if (e.target.value.length <= MAX_REMARK_LENGTH)
                      setFormData(prev => ({ ...prev, remarks: e.target.value }));
                  }}
                  error={!!formErrors.remarks}
                  helperText={
                    formErrors.remarks ||
                    `${formData.remarks.length}/${MAX_REMARK_LENGTH} characters`
                  }
                  sx={{ mt: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Balance Amount (Remaining)"
                  fullWidth
                  type="number"
                  value={formData.balanceAmount}
                  disabled
                  sx={{ mt: 2 }}
                  helperText="Calculated automatically (Expected - Actual)"
                />
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Assign To</label>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.assignToMe}
                          onChange={handleAssignToMeChange}
                          color="primary"
                        />
                      }
                      label="Assign to me"
                    />
                  </div>
                  <FormControl fullWidth size="small">
                    <InputLabel id="assigned-to-label">Select User</InputLabel>
                    <Select
                      labelId="assigned-to-label"
                      value={formData.assignedTo}
                      onChange={handleAssignedToChange}
                      disabled={formData.assignToMe}
                      label="Select User"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {users
                        .filter(user => user.bactive === true)
                        .map(user => (
                          <MenuItem key={user.iUser_id} value={user.iUser_id.toString()}>
                            {user.cFull_name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="mt-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Notify To</label>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.notifyToMe}
                          onChange={handleNotifyToMeChange}
                          color="primary"
                        />
                      }
                      label="Notify to me"
                    />
                  </div>
                  <FormControl fullWidth size="small">
                    <InputLabel id="notified-to-label">Select User</InputLabel>
                    <Select
                      labelId="notified-to-label"
                      value={formData.notifiedTo}
                      onChange={handleNotifiedToChange}
                      disabled={formData.notifyToMe}
                      label="Select User"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {users
                        .filter(user => user.bactive === true)
                        .map(user => (
                          <MenuItem key={user.iUser_id} value={user.iUser_id.toString()}>
                            {user.cFull_name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Update Milestone
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      <div style={{display:"none"}}>
{milestones.length > 0 && (
  <PostSalesForm isRecurring={true} />
)}
      </div>
                    

    </>
  );
};

export default MilestoneStatusBar;
