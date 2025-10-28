import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, Calendar, Edit, Save } from 'lucide-react';
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
  const [openExpectedDateDialog, setOpenExpectedDateDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [editingExpectedDate, setEditingExpectedDate] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentStageName, setCurrentStageName] = useState('');
  const [error, setError] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [savingNextMilestone, setSavingNextMilestone] = useState(false);
  const [formData, setFormData] = useState({
    actualAmount: '',
    actualMilestoneDate: null,
    remarks: '',
    assignedTo: '',
    assignToMe: false,
    notifiedTo: '',
    notifyToMe: false,
    balanceAmount: '',
    paymentMode: '',
    nextMilestoneExpectedDate: null,
  });

  const [expectedDateForm, setExpectedDateForm] = useState({
    expectedMilestoneDate: null,
    paymentMode: '',
  });

  const [formErrors, setFormErrors] = useState({
    actualAmount: '',
    actualMilestoneDate: '',
    remarks: '',
  });

  const [expectedDateErrors, setExpectedDateErrors] = useState({
    expectedMilestoneDate: '',
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

        // Find current stage index and name
        const currentIndex = milestoneData.findIndex(
          m => !(m.actualAmount > 0 && m.actualMilestoneDate)
        );
        setCurrentStageIndex(currentIndex === -1 ? milestoneData.length : currentIndex);
        
        // Set current stage name
        if (currentIndex === -1) {
          setCurrentStageName('All Milestones Completed');
        } else if (currentIndex < milestoneData.length) {
          setCurrentStageName(milestoneData[currentIndex].mileStoneName || `Milestone ${currentIndex + 1}`);
        } else {
          setCurrentStageName('No Active Milestone');
        }
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
    return `${day}/${month}/${year}`;
  };

  const isMilestoneCompleted = milestone =>
    milestone.actualAmount > 0 && milestone.actualMilestoneDate;

  const isCurrentMilestone = index =>
    index === currentStageIndex && currentStageIndex < milestones.length;

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    if (!milestones.length) return 0;
    
    const totalExpected = milestones.reduce((sum, m) => sum + (parseFloat(m.expectedAmount) || 0), 0);
    const totalActual = milestones.reduce((sum, m) => sum + (parseFloat(m.actualAmount) || 0), 0);
    
    if (totalExpected === 0) return 0;
    
    return Math.min(100, (totalActual / totalExpected) * 100);
  };

  // Calculate amount-based completion
  const getAmountCompletion = () => {
    if (!milestones.length) return { totalExpected: 0, totalActual: 0 };
    
    const totalExpected = milestones.reduce((sum, m) => sum + (parseFloat(m.expectedAmount) || 0), 0);
    const totalActual = milestones.reduce((sum, m) => sum + (parseFloat(m.actualAmount) || 0), 0);
    
    return { totalExpected, totalActual };
  };

  // Check if current milestone has a next milestone
  const hasNextMilestone = (milestoneIndex) => {
    return milestoneIndex < milestones.length - 1;
  };

  // Get next milestone
  const getNextMilestone = (milestoneIndex) => {
    return milestones[milestoneIndex + 1];
  };

  // Get current milestone name dynamically
  const getCurrentMilestoneName = () => {
    if (currentStageIndex < milestones.length) {
      return milestones[currentStageIndex].mileStoneName || `Milestone ${currentStageIndex + 1}`;
    }
    return 'All Milestones Completed';
  };

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
    
    // Check if there's a next milestone and pre-fill its expected date
    const nextMilestone = hasNextMilestone(index) ? getNextMilestone(index) : null;
    
    setFormData({
      actualAmount: initialActualAmount > 0 ? initialActualAmount.toString() : '',
      actualMilestoneDate: milestone.actualMilestoneDate ? dayjs(milestone.actualMilestoneDate) : null,
      remarks: milestone.remarks || '',
      assignedTo: '',
      assignToMe: false,
      notifiedTo: '',
      notifyToMe: false,
      balanceAmount: balance,
      paymentMode: milestone.paymentMode || '',
      nextMilestoneExpectedDate: nextMilestone && nextMilestone.expectedMilestoneDate ? 
        dayjs(nextMilestone.expectedMilestoneDate) : null,
    });

    setFormErrors({ actualAmount: '', actualMilestoneDate: '', remarks: '' });
    setOpenDialog(true);
  };

  // Handle expected date edit - ALL milestones are editable now
  const handleExpectedDateEdit = (milestone, index) => {
    setEditingExpectedDate(milestone);
    setExpectedDateForm({
      expectedMilestoneDate: milestone.expectedMilestoneDate ? dayjs(milestone.expectedMilestoneDate) : null,
      paymentMode: milestone.paymentMode || '',
    });
    setExpectedDateErrors({ expectedMilestoneDate: '' });
    setOpenExpectedDateDialog(true);
  };

  // Handle next milestone expected date change and save immediately
  const handleNextMilestoneDateChange = async (newValue) => {
    if (!selectedMilestone) return;
    
    const selectedIndex = milestones.findIndex(m => m.id === selectedMilestone.id);
    
    // Update local state immediately for better UX
    setFormData(prev => ({ 
      ...prev, 
      nextMilestoneExpectedDate: newValue 
    }));

    // If there's a next milestone, update it via API
    if (hasNextMilestone(selectedIndex)) {
      const nextMilestone = getNextMilestone(selectedIndex);
      
      if (newValue) {
        setSavingNextMilestone(true);
        try {
          const token = localStorage.getItem('token');
          const nextMilestoneDateISO = newValue.toISOString();
          
          const nextMilestonePayload = {
            expectedMilestoneDate: nextMilestoneDateISO,
          };

          await axios.patch(`${ENDPOINTS.MILESTONE_UPDATE}/${nextMilestone.id}`, nextMilestonePayload, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          });
          
          showToast('success', `Milestone ${selectedIndex + 2} expected date updated successfully!`);
          fetchMilestones(); // Refresh to get updated data
        } catch (error) {
          console.error('Error updating next milestone expected date:', error);
          showToast('error', error.response?.data?.message || 'Failed to update next milestone expected date');
        } finally {
          setSavingNextMilestone(false);
        }
      }
    }
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

  const validateExpectedDateForm = () => {
    let isValid = true;
    const newErrors = { expectedMilestoneDate: '' };
    
    if (!expectedDateForm.expectedMilestoneDate) {
      newErrors.expectedMilestoneDate = 'Expected date is required';
      isValid = false;
    }
    
    setExpectedDateErrors(newErrors);
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
      const selectedIndex = milestones.findIndex(m => m.id === selectedMilestone.id);
      
      // Update current milestone
      const payload = {
        actualAmount: parseFloat(formData.actualAmount),
        actualMilestoneDate: actualDateISO,
        remarks: formData.remarks,
        paymentMode: formData.paymentMode,
        ...(formData.assignedTo && { assignedTo: parseInt(formData.assignedTo) }),
        ...(formData.notifiedTo && { notifiedTo: parseInt(formData.notifiedTo) }),
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

  const handleExpectedDateSubmit = async () => {
    if (!validateExpectedDateForm()) return;
    try {
      const token = localStorage.getItem('token');
      const expectedDateISO = expectedDateForm.expectedMilestoneDate ? 
        expectedDateForm.expectedMilestoneDate.toISOString() : null;
      
      const payload = {
        expectedMilestoneDate: expectedDateISO,
        paymentMode: expectedDateForm.paymentMode,
      };

      await axios.patch(`${ENDPOINTS.MILESTONE_UPDATE}/${editingExpectedDate.id}`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      
      showToast('success', 'Expected date updated successfully!');
      setOpenExpectedDateDialog(false);
      fetchMilestones();
    } catch (error) {
      console.error('Error updating expected date:', error);
      showToast('error', error.response?.data?.message || 'Failed to update expected date');
    }
  };

  if (!milestones.length) {
    return <div className="text-center text-gray-500 py-4">No milestones defined</div>;
  }

  const completionPercentage = calculateCompletionPercentage();
  const amountCompletion = getAmountCompletion();

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="w-full mx-auto px-4 py-6">
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <h3 className="text-lg font-semibold mb-4 text-blue-700 text-center">
            Payment Milestones Status
          </h3>
          
          {/* Current Stage Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Current Stage
                </h4>
                {/* <p className="text-2xl font-bold text-blue-700 mt-1">
                  {currentStageName}
                </p> */}
                <p className="text-sm text-gray-600 mt-1">
                  {currentStageIndex < milestones.length 
                    ? `Milestone ${currentStageIndex + 1} of ${milestones.length}`
                    : 'All milestones completed'}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  {currentStageIndex < milestones.length ? 'Active' : 'Completed'}
                </div>
              </div>
            </div>
          </div>

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
                      {milestone.mileStoneName}
                    </span>
                    <div className="mt-1 text-xs text-center text-gray-600">
                      {formatAmount(milestone.expectedAmount)}
                    </div>
                    <div 
                      className="mt-1 text-xs text-center cursor-pointer group relative text-gray-500 hover:text-blue-600 transition-colors"
                      onClick={() => handleExpectedDateEdit(milestone, index)}
                    >
                      <Calendar size={10} className="inline mr-1" />
                      Due: {formatDate(milestone.expectedMilestoneDate)}
                      <Edit size={10} className="inline ml-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Click to edit expected date
                      </div>
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

          {/* Completion Progress Bar */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Payment Completion Progress</h4>
              <span className="text-2xl font-bold text-blue-600">
                {completionPercentage.toFixed(1)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-600 h-6 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            {/* Amount Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-700">Total Expected</div>
                <div className="text-lg font-bold text-blue-800">
                  {formatAmount(amountCompletion.totalExpected)}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-700">Total Received</div>
                <div className="text-lg font-bold text-green-800">
                  {formatAmount(amountCompletion.totalActual)}
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-700">Pending Amount</div>
                <div className="text-lg font-bold text-orange-800">
                  {formatAmount(Math.max(0, (amountCompletion.totalExpected || 0) - (amountCompletion.totalActual || 0)))}
                </div>
              </div>
            </div>
            
            {/* Progress Indicators */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  {getCurrentMilestoneName()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Milestone Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <div className="flex justify-between items-center text-blue-800 font-bold">
              <span>
                Update {getCurrentMilestoneName()}
              </span>
              <IconButton onClick={() => setOpenDialog(false)}>
                <X size={20} className="text-red-500" />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent dividers>
            {selectedMilestone && (
              <>
                {/* Milestone Name */}
                <div className="mb-4 p-3 bg-gray-50 border-l-4 border-blue-500 rounded">
                  <div className="text-sm font-semibold text-gray-700">Milestone Name</div>
                  <div className="text-lg font-bold text-blue-700">
                    {selectedMilestone.mileStoneName || `Milestone ${milestones.findIndex(m => m.id === selectedMilestone.id) + 1}`}
                  </div>
                </div>

                {/* Expected Details */}
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

                {/* Next Milestone Expected Date (for Milestone 2 onwards) */}
                {hasNextMilestone(milestones.findIndex(m => m.id === selectedMilestone.id)) && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-yellow-700">
                        Set Next Milestone Expected Date
                      </div>
                      {savingNextMilestone && (
                        <div className="flex items-center text-yellow-600 text-xs">
                          <Save size={12} className="animate-spin mr-1" />
                          Saving...
                        </div>
                      )}
                    </div>
                    <DateTimePicker
                      label={`${getNextMilestone(milestones.findIndex(m => m.id === selectedMilestone.id)).mileStoneName} Expected Date`}
                      value={formData.nextMilestoneExpectedDate}
                      onChange={handleNextMilestoneDateChange}
                      viewRenderers={{
                        hours: renderTimeViewClock,
                        minutes: renderTimeViewClock,
                        seconds: renderTimeViewClock
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          InputLabelProps: { shrink: true }
                        },
                        popper: timeSlotProps.popper,
                        desktopPaper: timeSlotProps.desktopPaper
                      }}
                      desktopModeMediaQuery="@media (min-width: 0px)"
                    />
                    <div className="text-xs text-yellow-600 mt-1">
                      Changes are saved automatically when you select a date
                    </div>
                  </div>
                )}

                {/* Actual Amount */}
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

                {/* DateTime Picker */}
<DateTimePicker
    label="Actual Date & Time *"
    value={formData.actualMilestoneDate}
    onChange={(newValue) =>
      setFormData((prev) => ({ ...prev, actualMilestoneDate: newValue }))
    }
    // 👇 The format needs to be changed here
    inputFormat="DD/MM/YYYY hh:mm a" 
    slotProps={{
      textField: {
        fullWidth: true,
        sx: { mt: 2 },
        // 👇 The placeholder should also be updated to match the format
        placeholder: 'DD/MM/YYYY hh:mm a', 
        error: !!formErrors.actualMilestoneDate,
        helperText: formErrors.actualMilestoneDate,
        InputLabelProps: { shrink: true },
      },
      popper: timeSlotProps?.popper,
      desktopPaper: timeSlotProps?.desktopPaper,
    }}
    desktopModeMediaQuery="@media (min-width: 0px)"
/>




                {/* Payment Mode Dropdown */}
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <InputLabel id="payment-mode-label">Payment Mode</InputLabel>
                  <Select
                    labelId="payment-mode-label"
                    value={formData.paymentMode}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, paymentMode: e.target.value }))
                    }
                    label="Payment Mode"
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                  </Select>
                </FormControl>

                {/* Remarks */}
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

                {/* Balance */}
                <TextField
                  label="Balance Amount (Remaining)"
                  fullWidth
                  type="number"
                  value={formData.balanceAmount}
                  disabled
                  sx={{ mt: 2 }}
                  helperText="Calculated automatically (Expected - Actual)"
                />
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

        {/* Edit Expected Date Dialog */}
        <Dialog open={openExpectedDateDialog} onClose={() => setOpenExpectedDateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <div className="flex justify-between items-center text-blue-800 font-bold">
              <span>
                Edit Expected Date - {editingExpectedDate?.mileStoneName}
              </span>
              <IconButton onClick={() => setOpenExpectedDateDialog(false)}>
                <X size={20} className="text-red-500" />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent dividers>
            {editingExpectedDate && (
              <>
                {/* Milestone Details */}
                <div className="mb-4 p-3 bg-gray-50 border-l-4 border-blue-500 rounded">
                  <div className="text-sm font-semibold text-gray-700">Milestone Name</div>
                  <div className="text-lg font-bold text-blue-700">
                    {editingExpectedDate.mileStoneName}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 mt-2">Expected Amount</div>
                  <div className="text-lg font-bold text-green-700">
                    {formatAmount(editingExpectedDate.expectedAmount)}
                  </div>
                </div>

                {/* Expected Date Picker */}
                <DateTimePicker
                  label="Expected Date & Time *"
                  value={expectedDateForm.expectedMilestoneDate}
                  onChange={newValue =>
                    setExpectedDateForm(prev => ({ ...prev, expectedMilestoneDate: newValue }))
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
                      error: !!expectedDateErrors.expectedMilestoneDate,
                      helperText: expectedDateErrors.expectedMilestoneDate,
                      InputLabelProps: { shrink: true }
                    },
                    popper: timeSlotProps.popper,
                    desktopPaper: timeSlotProps.desktopPaper
                  }}
                  desktopModeMediaQuery="@media (min-width: 0px)"
                />

                {/* Payment Mode Dropdown */}
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <InputLabel id="edit-payment-mode-label">Payment Mode</InputLabel>
                  <Select
                    labelId="edit-payment-mode-label"
                    value={expectedDateForm.paymentMode}
                    onChange={(e) =>
                      setExpectedDateForm(prev => ({ ...prev, paymentMode: e.target.value }))
                    }
                    label="Payment Mode"
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenExpectedDateDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleExpectedDateSubmit} variant="contained" color="primary">
              Update Expected Date
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