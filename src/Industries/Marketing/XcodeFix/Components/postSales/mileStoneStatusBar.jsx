import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, Calendar, DollarSign, User } from 'lucide-react';
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
} from '@mui/material';
import { useToast} from '../../../../../context/ToastContext'
import axios from 'axios';
import { ENDPOINTS } from '../../../../../api/constraints';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const MAX_REMARK_LENGTH = 500;

const MilestoneStatusBar = ({ leadId }) => {
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const [formData, setFormData] = useState({
    actualAmount: '',
    actualMilestoneDate: null,
    remarks: '',
    assignedTo: '',
    assignToMe: false,
    notifiedTo: '',
    notifyToMe: false,
    balanceAmount: ''
  });

  const [formErrors, setFormErrors] = useState({
    actualAmount: '',
    actualMilestoneDate: '',
    remarks: '',
  });

  const timeSlotProps = {
    popper: {
      placement: 'top-start', 
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            mainAxis: false,
          },
        },
      ],
      sx: { 
        zIndex: 9999, 
        '& .MuiPickersPopper-paper': {
          marginBottom: '60px', 
        }
      }
    },
    desktopPaper: {
      sx: { 
        zIndex: 9999,
        position: 'relative' 
      }
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userObject = JSON.parse(userString);
        if (userObject && userObject.iUser_id) {
          setLoggedInUserId(userObject.iUser_id);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
  }, []);

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${ENDPOINTS.MILESTONE_BY_LEAD}/${leadId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data) {
        const milestoneData = response.data.data;
        setMilestones(milestoneData);
        
        const currentIndex = milestoneData.findIndex(milestone => 
          !milestone.actualAmount || milestone.actualAmount === 0 || !milestone.actualMilestoneDate
        );
        setCurrentStageIndex(currentIndex === -1 ? milestoneData.length : currentIndex);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setError('Failed to fetch milestones data');
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

  useEffect(() => {
    if (leadId) {
      fetchMilestones();
      fetchUsers();
    }
  }, [leadId]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isMilestoneCompleted = (milestone, index) => {
    return milestone.actualAmount && milestone.actualAmount > 0 && milestone.actualMilestoneDate && index < currentStageIndex;
  };

  const isCurrentMilestone = (index) => {
    return index === currentStageIndex;
  };

  const handleMilestoneClick = (milestone, index) => {
    if (index > currentStageIndex) {
      showToast('info', 'Please complete previous milestones first.');
      return;
    }

    setSelectedMilestone(milestone);
    const balance = milestone.expectedAmount - (milestone.actualAmount || 0);
    
    setFormData({
      actualAmount: milestone.actualAmount || '',
      actualMilestoneDate: milestone.actualMilestoneDate ? dayjs(milestone.actualMilestoneDate) : null,
      remarks: milestone.remarks || '',
      assignedTo: '',
      assignToMe: false,
      notifiedTo: '',
      notifyToMe: false,
      balanceAmount: balance
    });
    setFormErrors({
      actualAmount: '',
      actualMilestoneDate: '',
      remarks: '',
    });
    setOpenDialog(true);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      actualAmount: '',
      actualMilestoneDate: '',
      remarks: '',
    };

    if (!formData.actualAmount) {
      newErrors.actualAmount = 'Actual amount is required';
      isValid = false;
    } else if (parseFloat(formData.actualAmount) > selectedMilestone.expectedAmount) {
      newErrors.actualAmount = 'Actual amount cannot exceed expected amount';
      isValid = false;
    } else if (parseFloat(formData.actualAmount) <= 0) {
      newErrors.actualAmount = 'Actual amount must be greater than 0';
      isValid = false;
    }

    if (!formData.actualMilestoneDate) {
      newErrors.actualMilestoneDate = 'Actual date is required';
      isValid = false;
    }

    if (formData.remarks && formData.remarks.length > MAX_REMARK_LENGTH) {
      newErrors.remarks = `Remarks cannot exceed ${MAX_REMARK_LENGTH} characters`;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleAssignToMeChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      assignToMe: checked,
      assignedTo: checked ? loggedInUserId : ''
    }));
  };

  const handleNotifyToMeChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      notifyToMe: checked,
      notifiedTo: checked ? loggedInUserId : ''
    }));
  };

  const handleAssignedToChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      assignedTo: value,
      assignToMe: value === loggedInUserId
    }));
  };

  const handleNotifiedToChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      notifiedTo: value,
      notifyToMe: value === loggedInUserId
    }));
  };

  const handleActualAmountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      actualAmount: value,
      balanceAmount: selectedMilestone ? selectedMilestone.expectedAmount - (parseFloat(value) || 0) : 0
    }));

    if (formErrors.actualAmount) {
      setFormErrors(prev => ({ ...prev, actualAmount: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const payload = {
        actualAmount: parseFloat(formData.actualAmount),
        actualMilestoneDate: formData.actualMilestoneDate.toISOString(),
        remarks: formData.remarks,
        ...(formData.assignedTo && { assignedTo: parseInt(formData.assignedTo) }),
        ...(formData.notifiedTo && { notifiedTo: parseInt(formData.notifiedTo) })
      };

      await axios.put(`${ENDPOINTS.MILESTONE_UPDATE}/${selectedMilestone.id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      showToast('success', 'Milestone updated successfully!');
      setOpenDialog(false);
      fetchMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      showToast('error', 'Failed to update milestone');
    }
  };

  if (!milestones.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No milestones defined
      </div>
    );
  }

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="w-full mx-auto px-4 py-6">
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}

          <h3 className="text-lg font-semibold mb-4 text-blue-700 text-center">
            Payment Milestones Status
          </h3>

          <div className="flex items-center justify-between w-full">
            {milestones.map((milestone, index) => {
              const isCompleted = isMilestoneCompleted(milestone, index);
              const isActive = isCurrentMilestone(index);
              const isClickable = index <= currentStageIndex;

              return (
                <React.Fragment key={milestone.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      onClick={() => isClickable && handleMilestoneClick(milestone, index)}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full
                        ${
                          isCompleted
                            ? 'bg-green-600 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : isClickable
                            ? 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
                      {formatAmount(milestone.expectedAmount)}
                    </div>
                    <div className="mt-1 text-xs text-center text-gray-500">
                      Due: {formatDate(milestone.expectedMilestoneDate)}
                    </div>
                    {milestone.actualAmount > 0 && (
                      <div className="mt-1 text-xs text-center text-green-600 font-semibold">
                        Paid: {formatAmount(milestone.actualAmount)}
                      </div>
                    )}
                  </div>
                  
                  {index < milestones.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 -mt-12 z-0
                        ${
                          isCompleted
                            ? 'border-t-2 border-dotted border-green-600'
                            : 'border-t-2 border-dotted border-gray-300'
                        }`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700">Total Milestones</div>
              <div className="text-lg font-bold text-blue-600">{milestones.length}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700">Completed</div>
              <div className="text-lg font-bold text-green-600">{currentStageIndex}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700">Remaining</div>
              <div className="text-lg font-bold text-orange-600">
                {milestones.length - currentStageIndex}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-700">Current</div>
              <div className="text-lg font-bold text-purple-600">
                {currentStageIndex < milestones.length ? `Milestone ${currentStageIndex + 1}` : 'Completed'}
              </div>
            </div>
          </div>
        </div>

        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <div className="flex justify-between items-center">
              <span>Update Milestone {selectedMilestone && milestones.findIndex(m => m.id === selectedMilestone.id) + 1}</span>
              <IconButton onClick={() => setOpenDialog(false)}>
                <X size={20} />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent>
            {selectedMilestone && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-semibold text-blue-700">Expected Amount</div>
                    <div className="text-lg font-bold">{formatAmount(selectedMilestone.expectedAmount)}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-semibold text-green-700">Expected Date</div>
                    <div className="text-lg font-bold">{formatDate(selectedMilestone.expectedMilestoneDate)}</div>
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
                  InputProps={{
                    startAdornment: <DollarSign size={20} className="text-gray-400 mr-2" />
                  }}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Actual Date & Time *"
                    value={formData.actualMilestoneDate}
                    onChange={newValue => setFormData(prev => ({ ...prev, actualMilestoneDate: newValue }))}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                      seconds: renderTimeViewClock,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: { mt: 2 },
                        error: !!formErrors.actualMilestoneDate,
                        helperText: formErrors.actualMilestoneDate,
                        InputLabelProps: { shrink: true },
                      },
                      popper: timeSlotProps.popper,
                      desktopPaper: timeSlotProps.desktopPaper,
                    }}
                    desktopModeMediaQuery="@media (min-width: 0px)"
                  />
                </LocalizationProvider>

                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.remarks}
                  onChange={e => {
                    if (e.target.value.length <= MAX_REMARK_LENGTH) {
                      setFormData(prev => ({ ...prev, remarks: e.target.value }));
                    }
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
                  label="Balance Amount"
                  fullWidth
                  type="number"
                  value={formData.balanceAmount}
                  disabled
                  sx={{ mt: 2 }}
                  InputProps={{
                    startAdornment: <DollarSign size={20} className="text-gray-400 mr-2" />
                  }}
                  helperText="Calculated automatically (Expected - Actual)"
                />

                <div className="mt-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Assign To
                    </label>
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
                  
                  <select
                    className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                    value={formData.assignedTo}
                    onChange={handleAssignedToChange}
                    disabled={formData.assignToMe}
                  >
                    <option value="">Select User</option>
                    {users
                      .filter(user => user.bactive === true)
                      .map((user) => (
                        <option key={user.iUser_id} value={user.iUser_id}>
                          {user.cFull_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mt-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Notify To
                    </label>
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
                  
                  <select
                    className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                    value={formData.notifiedTo}
                    onChange={handleNotifiedToChange}
                    disabled={formData.notifyToMe}
                  >
                    <option value="">Select User</option>
                    {users
                      .filter(user => user.bactive === true)
                      .map((user) => (
                        <option key={user.iUser_id} value={user.iUser_id}>
                          {user.cFull_name}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Update Milestone
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </>
  );
};

export default MilestoneStatusBar;