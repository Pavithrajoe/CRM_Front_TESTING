import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Autocomplete,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useToast } from '../context/ToastContext';
import Confetti from 'react-confetti';
import axios from 'axios';
import { ENDPOINTS } from '../api/constraints';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';

const mandatoryInputStages = ['Proposal', 'Won'];
const MAX_REMARK_LENGTH = 500;
const MAX_NOTES_LENGTH = 200;
const MAX_PLACE_LENGTH = 200;
const MAX_PROPOSAL_NOTES_LENGTH = 500;

const StatusBar = ({ leadId, leadData, isLost, isWon }) => {
  const [stages, setStages] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [statusRemarks, setStatusRemarks] = useState([]);
  const [error, setError] = useState(null);
  const [stageStatuses, setStageStatuses] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogValue, setDialogValue] = useState({
    demoSessionType: '',
    demoSessionStartTime: null,
    demoSessionEndTime: null,
    notes: '',
    place: '',
    demoSessionAttendees: [],
    presentedByUsers: [],
  });
  const [dialogErrors, setDialogErrors] = useState({
    demoSessionType: '',
    demoSessionStartTime: '',
    demoSessionEndTime: '',
    notes: '',
    place: '',
    demoSessionAttendees: '',
    presentedByUsers: '',
    amount: '',
  });
  const [dialogStageIndex, setDialogStageIndex] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);

  const [proposalSendModes, setProposalSendModes] = useState([]);
  const [openProposalDialog, setOpenProposalDialog] = useState(false);
  const [proposalDialogValue, setProposalDialogValue] = useState({
    proposalSendModeId: null,
    preparedBy: null,
    verifiedBy: null,
    sendBy: null,
    notes: '',
  });
  const [proposalDialogErrors, setProposalDialogErrors] = useState({
    proposalSendModeId: '',
    preparedBy: '',
    verifiedBy: '',
    sendBy: '',
    notes: '',
  });
  
  const [remarkData, setRemarkData] = useState({ 
    remark: '', 
    projectValue: '',
    assignedTo: '',
    assignToMe: false
  });
  const [remarkErrors, setRemarkErrors] = useState({
    remark: '',
    projectValue: '',
  });
  const [remarkStageId, setRemarkStageId] = useState(null);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [demoSessions, setDemoSessions] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loggedInUserName, setLoggedInUserName] = useState("");

  // Set logged in user info
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userObject = JSON.parse(userString);
        if (userObject && userObject.iUser_id && userObject.cFull_name) {
          setLoggedInUserId(userObject.iUser_id);
          setLoggedInUserName(userObject.cFull_name);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
  }, []);

  const validateDemoSession = () => {
    let isValid = true;
    const newErrors = {
      demoSessionType: '',
      demoSessionStartTime: '',
      demoSessionEndTime: '',
      notes: '',
      place: '',
      demoSessionAttendees: '',
      presentedByUsers: '',
    };

    if (!dialogValue.demoSessionType) {
      newErrors.demoSessionType = 'Session type is required';
      isValid = false;
    } else if (!['online', 'offline'].includes(dialogValue.demoSessionType.toLowerCase())) {
      newErrors.demoSessionType = 'Invalid session type (must be online or offline)';
      isValid = false;
    }

    if (!dialogValue.demoSessionStartTime) {
      newErrors.demoSessionStartTime = 'Start time is required';
      isValid = false;
    } else if (new Date(dialogValue.demoSessionStartTime) < new Date()) {
      newErrors.demoSessionStartTime = 'Start time cannot be in the past';
      isValid = false;
    }

    if (!dialogValue.demoSessionEndTime) {
      newErrors.demoSessionEndTime = 'End time is required';
      isValid = false;
    } else if (dialogValue.demoSessionStartTime && 
               new Date(dialogValue.demoSessionEndTime) <= new Date(dialogValue.demoSessionStartTime)) {
      newErrors.demoSessionEndTime = 'End time must be after start time';
      isValid = false;
    }

    if (!dialogValue.notes.trim()) {
      newErrors.notes = 'Notes are required';
      isValid = false;
    } else if (dialogValue.notes.length > MAX_NOTES_LENGTH) {
      newErrors.notes = `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`;
      isValid = false;
    }

    if (!dialogValue.place.trim()) {
      newErrors.place = 'Place/link is required';
      isValid = false;
    } else if (dialogValue.place.length > MAX_PLACE_LENGTH) {
      newErrors.place = `Place/link cannot exceed ${MAX_PLACE_LENGTH} characters`;
      isValid = false;
    }

    if (dialogValue.demoSessionAttendees.length === 0) {
      newErrors.demoSessionAttendees = 'At least one attendee is required';
      isValid = false;
    }

    if (dialogValue.presentedByUsers.length === 0) {
      newErrors.presentedByUsers = 'At least one presenter is required';
      isValid = false;
    }

    setDialogErrors(newErrors);
    return isValid;
  };

  const validateAmount = (amount) => {
    if (!amount) {
      setDialogErrors({ ...dialogErrors, amount: 'Amount is required' });
      return false;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setDialogErrors({ ...dialogErrors, amount: 'Amount must be a valid number' });
      return false;
    }
    
    if (numAmount <= 0) {
      setDialogErrors({ ...dialogErrors, amount: 'Amount must be greater than 0' });
      return false;
    }
    
    setDialogErrors({ ...dialogErrors, amount: '' });
    return true;
  };

  const validateRemark = () => {
    let isValid = true;
    const newErrors = {
      remark: '',
      projectValue: '',
    };

    if (!remarkData.remark.trim()) {
      newErrors.remark = 'Remark is required';
      isValid = false;
    } else if (remarkData.remark.length > MAX_REMARK_LENGTH) {
      newErrors.remark = `Remark cannot exceed ${MAX_REMARK_LENGTH} characters`;
      isValid = false;
    }

    if (remarkData.projectValue && isNaN(parseFloat(remarkData.projectValue))) {
      newErrors.projectValue = 'Project value must be a valid number';
      isValid = false;
    } else if (remarkData.projectValue && parseFloat(remarkData.projectValue) < 0) {
      newErrors.projectValue = 'Project value cannot be negative';
      isValid = false;
    }

    setRemarkErrors(newErrors);
    return isValid;
  };

  const fetchProposalSendModes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.MASTER_PROPOSAL_SEND_MODE}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch proposal send modes');
      const data = await response.json();
      
      const modes = data?.data?.data || [];
      setProposalSendModes(modes);
    } catch (err) {
      console.error('Error fetching proposal send modes:', err.message);
      setProposalSendModes([]);
    }
  };

  useEffect(() => {
    fetchStages();
    fetchUsers();
    fetchDemoSessions();
    fetchProposalSendModes(); 
  }, []);

  const validateProposal = () => {
    let isValid = true;
    const newErrors = {
      proposalSendModeId: '',
      preparedBy: '',
      verifiedBy: '',
      sendBy: '',
      notes: '',
    };

    if (!proposalDialogValue.proposalSendModeId) {
      newErrors.proposalSendModeId = 'Send mode is required';
      isValid = false;
    }

    if (!proposalDialogValue.preparedBy) {
      newErrors.preparedBy = 'Prepared by is required';
      isValid = false;
    }

    if (!proposalDialogValue.verifiedBy) {
      newErrors.verifiedBy = 'Verified by is required';
      isValid = false;
    }

    if (!proposalDialogValue.sendBy) {
      newErrors.sendBy = 'Send by is required';
      isValid = false;
    }

    if (proposalDialogValue.notes.length > MAX_PROPOSAL_NOTES_LENGTH) {
      newErrors.notes = `Notes cannot exceed ${MAX_PROPOSAL_NOTES_LENGTH} characters`;
      isValid = false;
    }

    setProposalDialogErrors(newErrors);
    return isValid;
  };

  const fetchStages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stages');
      const data = await response.json();

      const statusMap = {};
      const formattedStages = Array.isArray(data.response)
        ? data.response
            .map(item => {
              statusMap[item.ilead_status_id] = item.bactive;
              return {
                id: item.ilead_status_id,
                name: item.clead_name,
                order: item.orderId || 9999,
                bactive: item.bactive,
              };
            })
            .sort((a, b) => a.order - b.order)
        : [];

      setStages(formattedStages);
      setStageStatuses(statusMap);
    } catch (err) {
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

  const fetchDemoSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${ENDPOINTS.DEMO_SESSION}?leadId=${leadId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setDemoSessions(response.data.Message || []);
    } catch (error) {
      console.error('Error fetching demo sessions:', error.message);
    }
  };

  useEffect(() => {
    fetchStages();
    fetchUsers();
    fetchDemoSessions();
  }, []);

  useEffect(() => {
    if (stages.length && leadData) {
      const index = stages.findIndex(stage => stage.id === leadData.ileadstatus_id);
      if (index !== -1) setCurrentStageIndex(index);
    }
  }, [stages, leadData]);

  const formatDateOnly = dateString => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleStageClick = (clickedIndex, statusId) => {
    if (stageStatuses[statusId] === false) {
      showToast('error', 'This status is currently inactive and cannot be selected');
      return;
    }

    if (isLost || isWon) {
      showToast('info', 'Cannot change status for a lost or won lead.');
      return;
    }

    if (clickedIndex <= currentStageIndex) {
      showToast('info', 'Cannot go back or re-select current stage.');
      return;
    }

    const stageName = stages[clickedIndex]?.name;
    setDialogStageIndex(clickedIndex);

    if (stageName?.toLowerCase().includes('demo')) {
      setDialogValue({
        demoSessionType: '',
        demoSessionStartTime: new Date(),
        demoSessionEndTime: null,
        notes: '',
        place: '',
        demoSessionAttendees: [],
        presentedByUsers: [],
      });
      setDialogErrors({
        demoSessionType: '',
        demoSessionStartTime: '',
        demoSessionEndTime: '',
        notes: '',
        place: '',
        demoSessionAttendees: '',
        presentedByUsers: '',
      });
      setOpenDialog(true);
      return;
    }

    if (stageName?.toLowerCase() === 'proposal') {
      setProposalDialogValue({
        proposalSendModeId: null,
        preparedBy: null,
        verifiedBy: null,
        sendBy: null,
        notes: '',
      });
      setProposalDialogErrors({
        proposalSendModeId: '',
        preparedBy: '',
        verifiedBy: '',
        sendBy: '',
        notes: '',
      });
      setOpenProposalDialog(true);
      return;
    }

    if (mandatoryInputStages.map(i => i.toLowerCase()).includes(stageName?.toLowerCase())) {
      setDialogValue('');
      setDialogErrors({ ...dialogErrors, amount: '' });
      setOpenDialog(true);
      return;
    }

    setRemarkStageId(statusId);
    setRemarkData({ 
      remark: '', 
      projectValue: '',
      assignedTo: '',
      assignToMe: false
    });
    setRemarkErrors({ remark: '', projectValue: '' });
    setShowRemarkDialog(true);
  };

  const handleProposalSubmit = async () => {
    if (!validateProposal()) return;

    const token = localStorage.getItem('token');
    const statusId = stages[dialogStageIndex]?.id;

    try {
      const payload = {
        leadId: parseInt(leadId),
        proposalSendModeId: proposalDialogValue.proposalSendModeId?.proposal_send_mode_id,
        preparedBy: proposalDialogValue.preparedBy?.iUser_id,
        verifiedBy: proposalDialogValue.verifiedBy?.iUser_id,
        sendBy: proposalDialogValue.sendBy?.iUser_id,
        notes: proposalDialogValue.notes,
      };

      const response = await axios.post(ENDPOINTS.PROPOSAL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      showToast('success', 'Proposal details saved!');
      setRemarkStageId(statusId);
      setRemarkData({ 
        remark: '', 
        projectValue: '',
        assignedTo: '',
        assignToMe: false
      });
      setRemarkErrors({ remark: '', projectValue: '' });
      setShowRemarkDialog(true);
      setOpenProposalDialog(false);
    } catch (e) {
      console.error('Error submitting proposal:', e);
      console.error('Error response:', e.response?.data);
      showToast('error', e?.response?.data?.message || e.message || 'Failed to save proposal details');
    }
  };

  const updateStage = async (newIndex, statusId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS_UPDATE}/${leadId}/status/${statusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to update status');

      setCurrentStageIndex(newIndex);

      if (stages[newIndex].name?.toLowerCase() === 'won') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (e) {
      showToast('error', e.message || 'Error updating status');
    }
  };

  const handleDialogSave = async () => {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user'));
    const stageName = stages[dialogStageIndex]?.name;
    const statusId = stages[dialogStageIndex]?.id;

    try {
      if (stageName?.toLowerCase().includes('demo')) {
        if (!validateDemoSession()) return;

        const {
          demoSessionType,
          demoSessionStartTime,
          demoSessionEndTime,
          notes,
          place,
          demoSessionAttendees,
          presentedByUsers,
        } = dialogValue;

        const body = {
          demoSessionType,
          demoSessionStartTime: demoSessionStartTime.toISOString(),
          demoSessionEndTime: demoSessionEndTime.toISOString(),
          notes,
          place,
          leadId: parseInt(leadId),
          demoSessionAttendees: demoSessionAttendees.map(u => ({ attendeeId: u.iUser_id })),
          presentedByUsers: presentedByUsers.map(u => ({ presenetedUserId: u.iUser_id })),
        };

        await axios.post(`${ENDPOINTS.DEMO_SESSION_DETAILS}`, body, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        showToast('success', 'Demo session details saved!');
      } else {
        if (!validateAmount(dialogValue)) return;

        const amount = parseFloat(dialogValue);
        const body = {
          caction: stageName,
          iaction_doneby: userId.iUser_id,
          iamount: amount,
          ilead_id: parseInt(leadId),
        };

        await axios.post(`${ENDPOINTS.LEAD_STATUS_ACTION}`, body, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        showToast('success', `${stageName} details saved!`);
      }

      setRemarkStageId(statusId);
      setRemarkData({ 
        remark: '', 
        projectValue: '',
        assignedTo: '',
        assignToMe: false
      });
      setRemarkErrors({ remark: '', projectValue: '' });
      setShowRemarkDialog(true);
      setOpenDialog(false);
    } catch (e) {
      showToast('error', e?.response?.data?.message || e.message || 'Something went wrong');
    }
  };

  const handleAssignToMeChange = (e) => {
    const checked = e.target.checked;
    setRemarkData(prev => ({
      ...prev,
      assignToMe: checked,
      assignedTo: checked ? loggedInUserId : ''
    }));
  };

  const handleAssignedToChange = (e) => {
    const value = e.target.value;
    setRemarkData(prev => ({
      ...prev,
      assignedTo: value,
      assignToMe: value === loggedInUserId
    }));
  };

  // Function to send assignment notification email
  const sendAssignmentNotification = async (assignedUserId, assignedUserName) => {
    try {
      const token = localStorage.getItem('token');
      const assignedUser = users.find(user => user.iUser_id === parseInt(assignedUserId));
      
      if (!assignedUser || !assignedUser.cEmail) {
        console.error('Assigned user not found or no email available');
        return;
      }

      const mailPayload = {
        userName: assignedUser.cUser_name,
        time: new Date().toISOString(),
        leadName: leadData.clead_name,
        leadURL: window.location.href,
        mailId: assignedUser.cEmail,
        assignedTo: assignedUser.cUser_name,
        notifyTo: assignedUser.cEmail,
      };

      await axios.post(`${ENDPOINTS.ASSIGNED_TO_MAIL}`, mailPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      showToast('success', `Assignment notification sent to ${assignedUser.cUser_name}`);
    } catch (mailErr) {
      console.error('Failed to send notification email:', mailErr);
      showToast('error', 'Assignment saved but notification failed to send');
    }
  };

  const handleRemarkSubmit = async () => {
    if (!validateRemark()) return;

    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user'));
    const payload = {
      remark: remarkData.remark.trim(),
      leadId: parseInt(leadId),
      leadStatusId: remarkStageId,
      createBy: userId.iUser_id,
      ...(remarkData.projectValue && { projectValue: parseFloat(remarkData.projectValue) }),
    };

    try {
      // Submit the remark first
      await axios.post(ENDPOINTS.STATUS_REMARKS, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle assignment separately if assigned to someone
      if (remarkData.assignedTo) {
        try {
          await axios.post(
            `${ENDPOINTS.ASSIGNED_TO}`,
            {
              iassigned_by: userId.iUser_id,
              iassigned_to: Number(remarkData.assignedTo),
              ilead_id: Number(leadId),
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Send notification email to the assigned user
          const assignedUser = users.find(user => user.iUser_id === parseInt(remarkData.assignedTo));
          if (assignedUser) {
            await sendAssignmentNotification(remarkData.assignedTo, assignedUser.cUser_name);
          }

          showToast('success', 'Remark submitted and lead assigned!');
        } catch (assignErr) {
          console.error('Failed to assign lead:', assignErr);
          showToast('success', 'Remark submitted but assignment failed.');
        }
      } else {
        showToast('success', 'Remark submitted!');
      }

      const newIndex = stages.findIndex(s => s.id === remarkStageId);
      await updateStage(newIndex, remarkStageId);
      setShowRemarkDialog(false);
      await getStatusRemarks();
    } catch (err) {
      const serverMsg = err.response?.data?.Message;
      const issues = Array.isArray(serverMsg?.issues)
        ? serverMsg.issues.join(', ')
        : serverMsg?.message || 'Failed to submit remark';

      showToast('error', issues);
    }
  };

  const getStatusRemarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${ENDPOINTS.STATUS_REMARKS}/${leadId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (Array.isArray(response.data?.Response)) {
        setStatusRemarks(response.data.Response);
      }
    } catch (e) {
      console.error('Error fetching remarks:', e.message);
    }
  };

  useEffect(() => {
    getStatusRemarks();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="w-11/12 md:w-5/6 lg:w-4/5 xl:w-[90%] mx-auto px-4 py-6">
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <div className="flex items-center justify-between w-full">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isClickable = index > currentStageIndex && !isLost && !isWon && stage.bactive;
            const matchedRemark = statusRemarks.find(r => r.lead_status_id === stage.id);

            return (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    onClick={() => (isClickable ? handleStageClick(index, stage.id) : null)}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full
                      ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : isClickable
                          ? 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                          : stage.bactive === false
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                      transition-colors duration-200`}
                    title={
                      stage.bactive === false
                        ? 'This status is inactive'
                        : matchedRemark
                        ? matchedRemark.lead_status_remarks
                        : ''
                    }
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </div>
                  <span
                    className={`mt-2 text-sm text-center ${
                      stage.bactive === false ? 'text-gray-400' : ''
                    }`}
                  >
                    {stage.name}
                    {stage.bactive === false && (
                      <span className="block text-xs text-red-500">(Inactive)</span>
                    )}
                  </span>
                </div>
                {index < stages.length - 1 && (
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

        {isWon && (
  <div className="flex justify-center mt-4">
    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className="font-bold tracking-wide uppercase text-sm">Lead Won</span>
    </div>
  </div>
)}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Enter Details</DialogTitle>
          <DialogContent>
            {stages[dialogStageIndex]?.name?.toLowerCase().includes('demo') ? (
              <>
                <Autocomplete
                  fullWidth
                  options={['online', 'offline']}
                  value={dialogValue.demoSessionType || ''}
                  onChange={(e, newValue) =>
                    setDialogValue(prev => ({ ...prev, demoSessionType: newValue }))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Session Type *"
                      sx={{ mt: 2 }}
                      error={!!dialogErrors.demoSessionType}
                      helperText={dialogErrors.demoSessionType}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
                <DateTimePicker
                  label="Start Time *"
                   viewRenderers={{
            hours: renderTimeViewClock,
            minutes: renderTimeViewClock,
            seconds: renderTimeViewClock,
          }}
                  value={dialogValue.demoSessionStartTime}
                  onChange={newValue =>
                    setDialogValue(prev => ({ ...prev, demoSessionStartTime: newValue }))
                  }
                  format="dd/MM/yyyy hh:mm a"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mt: 2 },
                      error: !!dialogErrors.demoSessionStartTime,
                      helperText: dialogErrors.demoSessionStartTime,
                      InputLabelProps: { shrink: true },
                    },
                  }}
                />
                <DateTimePicker
                  label="End Time *"
                  value={dialogValue.demoSessionEndTime}
                   viewRenderers={{
            hours: renderTimeViewClock,
            minutes: renderTimeViewClock,
            seconds: renderTimeViewClock,
          }}
                  onChange={newValue =>
                    setDialogValue(prev => ({ ...prev, demoSessionEndTime: newValue }))
                  }
                  format="dd/MM/yyyy hh:mm a"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mt: 2 },
                      error: !!dialogErrors.demoSessionEndTime,
                      helperText: dialogErrors.demoSessionEndTime,
                      InputLabelProps: { shrink: true },
                    },
                  }}
                />
                <TextField
                  label="Notes *"
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mt: 2 }}
                  value={dialogValue.notes || ''}
                  onChange={e => {
                    if (e.target.value.length <= MAX_NOTES_LENGTH) {
                      setDialogValue(prev => ({ ...prev, notes: e.target.value }));
                    }
                  }}
                  error={!!dialogErrors.notes}
                  helperText={
                    dialogErrors.notes || 
                    `${dialogValue.notes.length}/${MAX_NOTES_LENGTH} characters`
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Place / Link *"
                  fullWidth
                  sx={{ mt: 2 }}
                  value={dialogValue.place || ''}
                  onChange={e => {
                    if (e.target.value.length <= MAX_PLACE_LENGTH) {
                      setDialogValue(prev => ({ ...prev, place: e.target.value }));
                    }
                  }}
                  error={!!dialogErrors.place}
                  helperText={
                    dialogErrors.place || 
                    `${dialogValue.place.length}/${MAX_PLACE_LENGTH} characters`
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <Autocomplete
                  multiple
                  options={users}
                  getOptionLabel={option => option?.cFull_name || ''}
                  isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
                  value={dialogValue.demoSessionAttendees || []}
                  onChange={(e, newValue) =>
                    setDialogValue(prev => ({ ...prev, demoSessionAttendees: newValue }))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Attendees *"
                      sx={{ mt: 2 }}
                      error={!!dialogErrors.demoSessionAttendees}
                      helperText={dialogErrors.demoSessionAttendees}
                    />
                  )}
                />
                <Autocomplete
                  multiple
                  options={users}
                  getOptionLabel={option => option?.cFull_name || ''}
                  isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
                  value={dialogValue.presentedByUsers || []}
                  onChange={(e, newValue) =>
                    setDialogValue(prev => ({ ...prev, presentedByUsers: newValue }))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Presented By *"
                      sx={{ mt: 2 }}
                      error={!!dialogErrors.presentedByUsers}
                      helperText={dialogErrors.presentedByUsers}
                    />
                  )}
                />
              </>
            ) : (
              <TextField
                label="Enter Value *"
                fullWidth
                type="number"
                value={dialogValue}
                onChange={e => {
                  setDialogValue(e.target.value);
                  if (dialogErrors.amount) {
                    validateAmount(e.target.value);
                  }
                }}
                sx={{ mt: 2 }}
                error={!!dialogErrors.amount}
                helperText={dialogErrors.amount}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleDialogSave} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showRemarkDialog} 
          onClose={() => setShowRemarkDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Enter Remark</DialogTitle>
          <DialogContent>
            <TextField
              label="Remark *"
              fullWidth
              multiline
              rows={3}
              value={remarkData.remark}
              onChange={e => {
                if (e.target.value.length <= MAX_REMARK_LENGTH) {
                  setRemarkData(prev => ({ ...prev, remark: e.target.value }));
                }
              }}
              error={!!remarkErrors.remark}
              helperText={
                remarkErrors.remark || 
                `${remarkData.remark.length}/${MAX_REMARK_LENGTH} characters`
              }
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Project Value (optional)"
              type="number"
              fullWidth
              value={remarkData.projectValue}
              onChange={e => setRemarkData(prev => ({ ...prev, projectValue: e.target.value }))}
              error={!!remarkErrors.projectValue}
              helperText={remarkErrors.projectValue}
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            
            {/* Assigned To Section */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Assign To
                </label>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remarkData.assignToMe}
                      onChange={handleAssignToMeChange}
                      color="primary"
                    />
                  }
                  label="Assign to me"
                />
              </div>
              
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                value={remarkData.assignedTo}
                onChange={handleAssignedToChange}
                disabled={remarkData.assignToMe}
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
              <p className="text-xs text-gray-500 mt-1">
                Optionally assign this lead to someone when submitting the remark
              </p>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
            <Button onClick={handleRemarkSubmit} variant="contained">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openProposalDialog} 
          onClose={() => setOpenProposalDialog(false)}
          maxWidth="sm"
          fullWidth
        >  
          <DialogTitle>Enter Proposal Details</DialogTitle>
          <DialogContent>
            <Autocomplete
              fullWidth
              options={proposalSendModes}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => 
                option?.proposal_send_mode_id === value?.proposal_send_mode_id
              }
              value={proposalDialogValue.proposalSendModeId || null}
              onChange={(e, newValue) =>
                setProposalDialogValue(prev => ({ 
                  ...prev, 
                  proposalSendModeId: newValue 
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Send Mode *"
                  sx={{ mt: 2 }}
                  error={!!proposalDialogErrors.proposalSendModeId}
                  helperText={proposalDialogErrors.proposalSendModeId}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={option => option?.cFull_name || ''}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={proposalDialogValue.preparedBy || null}
              onChange={(e, newValue) =>
                setProposalDialogValue(prev => ({ ...prev, preparedBy: newValue }))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Prepared By *"
                  sx={{ mt: 2 }}
                  error={!!proposalDialogErrors.preparedBy}
                  helperText={proposalDialogErrors.preparedBy}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={option => option?.cFull_name || ''}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={proposalDialogValue.verifiedBy || null}
              onChange={(e, newValue) =>
                setProposalDialogValue(prev => ({ ...prev, verifiedBy: newValue }))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Verified By *"
                  sx={{ mt: 2 }}
                  error={!!proposalDialogErrors.verifiedBy}
                  helperText={proposalDialogErrors.verifiedBy}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={option => option?.cFull_name || ''}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={proposalDialogValue.sendBy || null}
              onChange={(e, newValue) =>
                setProposalDialogValue(prev => ({ ...prev, sendBy: newValue }))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Send By *"
                  sx={{ mt: 2 }}
                  error={!!proposalDialogErrors.sendBy}
                  helperText={proposalDialogErrors.sendBy}
                />
              )}
            />
            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              rows={3}
              value={proposalDialogValue.notes}
              onChange={e => {
                if (e.target.value.length <= MAX_PROPOSAL_NOTES_LENGTH) {
                  setProposalDialogValue(prev => ({ ...prev, notes: e.target.value }));
                }
              }}
              error={!!proposalDialogErrors.notes}
              helperText={
                proposalDialogErrors.notes || 
                `${proposalDialogValue.notes.length}/${MAX_PROPOSAL_NOTES_LENGTH} characters`
              }
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProposalDialog(false)}>Cancel</Button>
            <Button onClick={handleProposalSubmit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {statusRemarks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Remarks Timeline</h3>
            <div className="flex overflow-x-auto space-x-4 px-2 py-4 relative custom-scrollbar">
              {statusRemarks.map((remark, index) => (
                <div key={remark.ilead_status_remarks_id} className="relative flex-shrink-0">
                  {index !== statusRemarks.length - 1 && (
                    <div className="absolute top-1/2 left-full w-6 h-1 bg-gray-400 shadow-md shadow-gray-600 transform -translate-y-1/2 z-0"></div>
                  )}
                  <div
                    className="font-sans bg-white w-[calc((90vw*0.9)/5)] shadow-md shadow-gray-200  min-w-[200px] max-w-[250px] shadow-xxl rounded-3xl p-4 space-y-2 flex flex-col justify-between min-h-40 max-h-55 overflow-hidden z-10 cursor-pointer transition p-5"
                    onClick={() => setSelectedRemark(remark)}
                  >
                    <div className="space-y-2 text-sm">
                      <p className="text-sm break-words line-clamp-3">
                        <strong>Remark:</strong> {remark.lead_status_remarks}
                      </p>
                      <p className="text-sm">
                        <strong>Created By:</strong> {remark.createdBy || '-'}
                      </p>
                      <p className="text-sm">
                        <strong>Date:</strong> {formatDateOnly(remark.dcreated_dt)}
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong> {remark.status_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog
          open={!!selectedRemark}
          onClose={() => setSelectedRemark(null)}
          PaperProps={{
            sx: {
              borderRadius: '18px',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 24px 16px',
              position: 'relative',
              color: '#1a1a1a',
              fontSize: '1.5rem',
              fontWeight: 600,
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
            }}
          >
            Timeline Detail
            <IconButton
              aria-label="close"
              onClick={() => setSelectedRemark(null)}
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: (theme) => theme.palette.grey[600],
                backgroundColor: 'transparent',
                borderRadius: '50%',
                padding: '6px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  transform: 'translateY(-50%) rotate(90deg)',
                },
              }}
            >
              <X size={18} />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minWidth: { xs: '90%', sm: '350px', md: '400px' },
              maxWidth: '450px',
            }}
          >
            {selectedRemark && (
              <>
                <div
                  className="w-24 h-10 flex mt-2 items-center rounded-full justify-center mb-4"
                  style={{
                    backgroundColor: '#4CAF50',
                    boxShadow: '0px 5px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <span className="text-white text-base font-semibold">
                    {selectedRemark.status_name || '-'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 break-words w-3/4 p-6 leading-relaxed mb-6 font-bold ">
                  {selectedRemark.lead_status_remarks}
                </p>

                <div className="w-full flex justify-between items-center text-gray-600 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-gray-900" />
                    <span className="text-blue-600 font-bold text-sm">
                      {formatDateOnly(selectedRemark.dcreated_dt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={16} className="text-gray-900" />
                    <span className="text-blue-600 font-bold text-sm">{selectedRemark.createdBy || '-'}</span>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {showConfetti && <Confetti />}
      </div>
    </LocalizationProvider>
  );
};

export default StatusBar;