import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle, Circle, X, Calendar, User } from 'lucide-react';
import { GlobUserContext } from './userContex';
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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const mandatoryInputStages = ['Proposal', 'Won'];
const MAX_PROJECT_VALUE = 10000000;  // 1 crore
const MAX_REMARK_LENGTH = 500;
const MAX_NOTES_LENGTH = 200;
const MAX_PLACE_LENGTH = 200;
const MAX_PROPOSAL_NOTES_LENGTH = 500;

const StatusBar = ({ leadId, leadData, isLost, isWon, statusRemarks }) => {
  const { user } = useContext(GlobUserContext);
  const [stages, setStages] = useState([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [statusRemark, setStatusRemark] = useState([]);
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
    assignToMe: false,
    notifiedTo: '',
    notifyToMe: false,
    dueDate: '',
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
  const [dueDate, setDueDate] = useState(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState('');

  const PopperProps = {
    placement: 'top-start',
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['top-start','bottom-start'],
        },
      },
    ],
  };

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
        if (userObject && userObject.iUser_id && userObject.cFull_name) {
          setLoggedInUserId(userObject.iUser_id);
          setLoggedInUserName(userObject.cFull_name);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
  }, []);

  // Enhanced stage active check
  const isStageActive = (stage) => {
    if (!stage) return false;
    
    // Check multiple possible active properties
    const isActive = stage.bactive !== false && 
                    stage.is_active !== false && 
                    stage.active !== false &&
                    stage.status !== 'inactive';
    
    console.log('Stage active check:', { 
      stage: stage.name, 
      bactive: stage.bactive, 
      is_active: stage.is_active,
      active: stage.active,
      result: isActive 
    });
    
    return isActive;
  };

  // Enhanced debug function
  const logStageClickDebug = (clickedIndex, statusId) => {
    const stage = stages[clickedIndex];
    const debugData = {
      clickedIndex,
      statusId,
      stageName: stage?.name,
      stageData: stage,
      currentStageIndex,
      isLost,
      isWon,
      isStageActive: isStageActive(stage),
      conditions: {
        isNextStage: clickedIndex > currentStageIndex,
        isNotLostOrWon: !isLost && !isWon,
        isActive: isStageActive(stage),
        allConditions: clickedIndex > currentStageIndex && !isLost && !isWon && isStageActive(stage)
      }
    };
    
    console.log('=== STAGE CLICK DEBUG ===', debugData);
    setDebugInfo(JSON.stringify(debugData, null, 2));
  };

  // FIXED: Add fetchStages call
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
      
      console.log('Raw stages API response:', data);
      
      const statusMap = {};
      const formattedStages = Array.isArray(data.response)
        ? data.response
            .map(item => {
              console.log('Processing stage item:', item);
              // More flexible active status mapping
              const isActive = item.bactive !== false && 
                              item.is_active !== false && 
                              item.active !== false;
              
              statusMap[item.ilead_status_id] = isActive;
              return {
                id: item.ilead_status_id,
                name: item.clead_name,
                order: item.orderId || 9999,
                bactive: isActive, // Use the calculated active status
                rawData: item, // Keep raw data for debugging
              };
            })
            .sort((a, b) => a.order - b.order)
        : [];

      console.log('Formatted stages:', formattedStages);
      console.log('Stage status map:', statusMap);

      setStages(formattedStages);
      setStageStatuses(statusMap);
    } catch (err) {
      setError(err.message || 'Unable to fetch stage data');
    }
  };

  // FIXED: Uncommented and fixed fetchUsers
  const fetchUsers = async () => {
    try {
      const companyUsersList = user.filter(user => (user.bactive === true || user.bactive === "true"));
      setUsers(companyUsersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDemoSession = async (sessions) => {
    try {
      await setDemoSessions(sessions);
    } catch (error) {
      console.error('Error fetching demo sessions:', error.message);
    }
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

  // FIXED: Added proper useEffect for data fetching
  useEffect(() => {
    fetchStages(); // This was missing!
    fetchUsers();
    fetchProposalSendModes();
  }, []);

  // FIXED: Improved current stage index setting
  useEffect(() => {
    if (stages.length > 0 && leadData && leadData.ileadstatus_id) {
      const index = stages.findIndex(stage => stage.id === leadData.ileadstatus_id);
      console.log('Setting current stage index:', {
        stagesCount: stages.length,
        leadStatusId: leadData.ileadstatus_id,
        foundIndex: index,
        stages: stages.map(s => ({ id: s.id, name: s.name }))
      });
      if (index !== -1) {
        setCurrentStageIndex(index);
      }
    }
  }, [stages, leadData]);

  // Rest of your validation functions remain the same...
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

    if (remarkData.projectValue) {
      const numValue = parseFloat(remarkData.projectValue); 
      
      if (isNaN(numValue)) {
        newErrors.projectValue = 'Project value must be a valid number';
        isValid = false;
      } else if (numValue < 0) {
        newErrors.projectValue = 'Project value cannot be negative';
        isValid = false;
      } else if (numValue > MAX_PROJECT_VALUE) {
        newErrors.projectValue = `Project value cannot exceed ${MAX_PROJECT_VALUE.toLocaleString()}`;
        isValid = false;
      }
    }
    setRemarkErrors(newErrors);
    return isValid;
  };

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

  const formatDateOnly = dateString => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // FIXED: Improved handleStageClick function
  const handleStageClick = (clickedIndex, statusId) => {
    console.log('=== STAGE CLICKED ===', {
      clickedIndex,
      statusId,
      stageName: stages[clickedIndex]?.name,
      currentStageIndex,
      isLost,
      isWon
    });

    logStageClickDebug(clickedIndex, statusId);
    
    const stage = stages[clickedIndex];
    
    if (!isStageActive(stage)) {
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

    const stageName = stages[clickedIndex]?.name?.toLowerCase() || '';
    setDialogStageIndex(clickedIndex);
    setRemarkStageId(statusId);

    console.log('Stage name for form detection:', stageName);

    // FIXED: Better stage name detection
    if (stageName.includes('demo') || stageName.includes('session')) {
      console.log('Opening Demo Session Dialog');
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

    if (stageName.includes('proposal')) {
      console.log('Opening Proposal Dialog');
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

    // FIXED: Better mandatory stages detection
    const isMandatoryStage = mandatoryInputStages.some(mandatoryStage => 
      stageName.includes(mandatoryStage.toLowerCase())
    );

    if (isMandatoryStage) {
      console.log('Opening Amount Dialog for mandatory stage:', stageName);
      setDialogValue('');
      setDialogErrors({ ...dialogErrors, amount: '' });
      setOpenDialog(true);
      return;
    }

    // Default: Open remark dialog for other stages
    console.log('Opening Remark Dialog for stage:', stageName);
    setRemarkData({ 
      remark: '', 
      projectValue: '',
      assignedTo: '',
      assignToMe: false,
      notifiedTo: '', 
      notifyToMe: false,
      dueDate: '',
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
      
      // After proposal, open remark dialog
      setRemarkData({ 
        remark: '', 
        projectValue: '',
        assignedTo: '',
        assignToMe: false,
        notifiedTo: '',
        notifyToMe: false,
        dueDate: '',
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

      showToast('success', `Status updated to ${stages[newIndex]?.name}`);
    } catch (e) {
      showToast('error', e.message || 'Error updating status');
    }
  };

  // FIXED: Improved handleDialogSave for different dialog types
  const handleDialogSave = async () => {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user'));
    const stageName = stages[dialogStageIndex]?.name;
    const statusId = stages[dialogStageIndex]?.id;

    console.log('Saving dialog for stage:', stageName);

    try {
      if (stageName?.toLowerCase().includes('demo') || stageName?.toLowerCase().includes('session')) {
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
        
        // After demo session, open remark dialog
        setRemarkData({ 
          remark: '', 
          projectValue: '',
          assignedTo: '',
          assignToMe: false,
          notifiedTo: '',
          notifyToMe: false,
          dueDate: '',
        });
        setRemarkErrors({ remark: '', projectValue: '' });
        setShowRemarkDialog(true);
        
      } else {
        // This is for amount-based stages (like Won)
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
        
        // For amount stages, also open remark dialog
        setRemarkData({ 
          remark: '', 
          projectValue: '',
          assignedTo: '',
          assignToMe: false,
          notifiedTo: '',
          notifyToMe: false,
          dueDate: '',
        });
        setRemarkErrors({ remark: '', projectValue: '' });
        setShowRemarkDialog(true);
      }

      setOpenDialog(false);
    } catch (e) {
      console.error('Error saving dialog:', e);
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

  const handleNotifyToMeChange = (e) => {
    const checked = e.target.checked;
    setRemarkData(prev => ({
      ...prev,
      notifyToMe: checked,
      notifiedTo: checked ? loggedInUserId : ''
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

  const handleNotifiedToChange = (e) => {
    const value = e.target.value;
    setRemarkData(prev => ({
      ...prev,
      notifiedTo: value,
      NotifyToMe: value === loggedInUserId
    }));
  };

  const sendAssignmentNotification = async (
      assignedUser, 
      notifiedUser, 
      leadDetails,  
      token,
      userId 
  ) => {
      if (!assignedUser && !notifiedUser) return; 

      const emailPayload = {
          "userName": userId.cFull_name, 
          "time": new Date().toLocaleString(), 
          "leadName": leadDetails?.clead_name || 'CRM Lead', 
          "leadURL": `${window.location.origin}/leaddetailview/${leadDetails?.ilead_id}`, 
          "mailId": assignedUser ? assignedUser.cEmail : null, 
          "assignedTo": assignedUser ? assignedUser.cFull_name : null, 
          "notifyTo": notifiedUser ? notifiedUser.cEmail : null,
      };

      if (emailPayload.mailId || emailPayload.notifyTo) {
          try {
              await axios.post(ENDPOINTS.LEAD_STATUS_NOTIFICATION_MAIL, emailPayload, {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                  },
              });
          } catch (mailErr) {
              console.error('Failed to send assignment/notification email:', mailErr);
          }
      }
  };

  // FIXED: Improved handleRemarkSubmit to properly update stage
  const handleRemarkSubmit = async () => {
    if (!validateRemark()) return;

    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user')); 
    const leadDetails = leadData || { clead_name: 'Lead', ilead_id: parseInt(leadId) }; 

    const remarkPayload = {
        remark: remarkData.remark.trim(),
        leadId: parseInt(leadId),
        leadStatusId: remarkStageId,
        createBy: userId.iUser_id,
        ...(remarkData.projectValue && { projectValue: parseFloat(remarkData.projectValue) }),
        ...(remarkData.dueDate && { dueDate: new Date(remarkData.dueDate).toISOString() }),
    };

    const assignedUser = remarkData.assignedTo 
        ? users.find(user => user.iUser_id === Number(remarkData.assignedTo))
        : null;
    
    const notifiedUser = remarkData.notifiedTo 
        ? users.find(user => user.iUser_id === Number(remarkData.notifiedTo))
        : null;

    try {
        // Submit the remark
        await axios.post(ENDPOINTS.STATUS_REMARKS, remarkPayload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        let assignmentSuccess = true;

        // Handle assignment if needed
        if (remarkData.assignedTo) {
            try {
                await axios.post(
                    `${ENDPOINTS.GET_ASSIGN}`,
                    {
                        iassigned_by: userId.iUser_id,
                        iassigned_to: Number(remarkData.assignedTo),
                        ilead_id: Number(leadId),
                        ...(remarkData.notifiedTo && { notify_to: Number(remarkData.notifiedTo) }), 
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (assignErr) {
                console.error('Failed to assign lead:', assignErr);
                assignmentSuccess = false;
                showToast('error', 'Remark submitted, but assignment update failed.');
            }
        }

        // Send notifications
        if (assignedUser || notifiedUser) {
            await sendAssignmentNotification(assignedUser, notifiedUser, leadDetails, token, userId);
        }

        // Update the stage
        const newIndex = stages.findIndex(s => s.id === remarkStageId);
        if (newIndex !== -1) {
            await updateStage(newIndex, remarkStageId);
        }

        // Show success message
        if (assignmentSuccess && (assignedUser || notifiedUser)) {
            showToast('success', 'Remark submitted, and lead assigned/notified!');
        } else if (assignmentSuccess) {
            showToast('success', 'Remark submitted!');
        }

        // Close the dialog
        setShowRemarkDialog(false);
        await getStatusRemarks();

    } catch (err) {
        console.error('Error submitting remark:', err);
        const serverMsg = err.response?.data?.Message;
        const issues = Array.isArray(serverMsg?.issues)
            ? serverMsg.issues.join(', ')
            : serverMsg?.message || 'Failed to submit remark';

        showToast('error', issues);
    }
  };

  const getStatusRemarks = async () => {
    setStatusRemark(statusRemarks);
  };

  useEffect(() => {
    getStatusRemarks();
  }, [statusRemarks]);

  // Add this debug useEffect to check what's happening
  useEffect(() => {
    console.log('=== STATUS BAR DEBUG INFO ===');
    console.log('Stages:', stages);
    console.log('Current Stage Index:', currentStageIndex);
    console.log('Lead Data:', leadData);
    console.log('isLost:', isLost);
    console.log('isWon:', isWon);
    console.log('Users:', users);
  }, [stages, currentStageIndex, leadData, isLost, isWon, users]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="w-11/12 md:w-5/6 lg:w-4/5 xl:w-[90%] mx-auto px-4 py-6">
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        {stages.length === 0 ? (
          <div className="text-center text-gray-500">Loading stages...</div>
        ) : (
          <div className="flex items-center justify-between w-full">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isActive = index === currentStageIndex;
              const isClickable = index > currentStageIndex && !isLost && !isWon && isStageActive(stage);
              const matchedRemark = statusRemarks.find(r => r.lead_status_id === stage.id);

              console.log(`Stage ${stage.name}:`, {
                index,
                isCompleted,
                isActive,
                isClickable,
                isStageActive: isStageActive(stage),
                currentStageIndex
              });

              return (
                <React.Fragment key={stage.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      onClick={() => (isClickable ? handleStageClick(index, stage.id) : null)}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full
                        ${
                          isCompleted
                            ? 'bg-green-600 text-white cursor-default'
                            : isActive
                            ? 'bg-blue-600 text-white cursor-default'
                            : isClickable
                            ? 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                            : !isStageActive(stage)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }
                        transition-colors duration-200`}
                      title={
                        !isStageActive(stage)
                          ? 'This status is inactive'
                          : isClickable 
                          ? `Click to move to ${stage.name}`
                          : isCompleted
                          ? `Completed: ${stage.name}`
                          : isActive
                          ? `Current: ${stage.name}`
                          : 'Cannot select this stage'
                      }
                    >
                      {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </div>
                    <span
                      className={`mt-2 text-sm text-center max-w-[100px] break-words ${
                        !isStageActive(stage) ? 'text-gray-400' : ''
                      }`}
                    >
                      {stage.name}
                      {!isStageActive(stage) && (
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
        )}

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

        {/* Demo Session Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {stages[dialogStageIndex]?.name?.toLowerCase().includes('demo') || stages[dialogStageIndex]?.name?.toLowerCase().includes('session') 
              ? 'Demo Session Details' 
              : `Enter ${stages[dialogStageIndex]?.name} Details`}
          </DialogTitle>
          <DialogContent>
            {stages[dialogStageIndex]?.name?.toLowerCase().includes('demo') || stages[dialogStageIndex]?.name?.toLowerCase().includes('session') ? (
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
                {/* First DateTimePicker - Fix the slotProps structure */}
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
    }, // ADDED MISSING COMMA HERE
    popper: timeSlotProps.popper,
    desktopPaper: timeSlotProps.desktopPaper,
  }}
  desktopModeMediaQuery="@media (min-width: 0px)"
/>

{/* Second DateTimePicker - Fix the slotProps structure */}
<DateTimePicker
  label="End Time *"
  viewRenderers={{
    hours: renderTimeViewClock,
    minutes: renderTimeViewClock,
    seconds: renderTimeViewClock,
  }}
  value={dialogValue.demoSessionEndTime}
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
    }, // ADDED MISSING COMMA HERE
    popper: timeSlotProps.popper,
    desktopPaper: timeSlotProps.desktopPaper,
  }}
  desktopModeMediaQuery="@media (min-width: 0px)"
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
                label={`Enter ${stages[dialogStageIndex]?.name} Value *`}
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

        {/* Remark Dialog */}
        <Dialog 
          open={showRemarkDialog} 
          onClose={() => setShowRemarkDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Enter Remark for {stages.find(s => s.id === remarkStageId)?.name}</DialogTitle>
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
              onChange={e => {
                const value = e.target.value;
                if (value === '' || Number(value) <= 10000000) {
                  setRemarkData(prev => ({ ...prev, projectValue: value }));
                  if (remarkErrors.projectValue) {
                    setRemarkErrors(prev => ({ ...prev, projectValue: '' }));
                  }
                } else {
                  setRemarkErrors(prev => ({ ...prev, projectValue: 'Maximum allowed value is 1 crore' }));
                }
              }}
              error={!!remarkErrors.projectValue}
              helperText={remarkErrors.projectValue || 'Max value: 1 crore'}
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

            {/* Notify To Section */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Notify To
                </label>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remarkData.notifyToMe}
                      onChange={handleNotifyToMeChange}
                      color="primary"
                    />
                  }
                  label="Notify to me"
                />
              </div>
              
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                value={remarkData.notifiedTo}
                onChange={handleNotifiedToChange}
                disabled={remarkData.notifyToMe}
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
                Optionally notify this lead to someone when submitting the remark
              </p>
            </div>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Due Date & Time"
              value={remarkData.dueDate ? dayjs(remarkData.dueDate) : null}
              inputFormat="DD/MM/YYYY hh:mm a"
              onChange={newValue => {
                setRemarkData(prev => ({
                  ...prev,
                  dueDate: newValue ? newValue.format('YYYY-MM-DDTHH:mm:ss') : ''      
                }));
              }}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mt: 2 },
                  InputLabelProps: { shrink: true },
                },
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
              }}
              desktopModeMediaQuery="@media (min-width: 0px)"
              minDateTime={dayjs()} 
            />
        </LocalizationProvider>

          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
            <Button onClick={handleRemarkSubmit} variant="contained">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Proposal Dialog */}
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

        {/* Rest of your components (remarks timeline, etc.) remain the same */}
        {statusRemarks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Remarks Timeline</h3>
            <div className="flex overflow-x-auto space-x-4 px-2 py-4 relative custom-scrollbar">
              {(() => {
                console.log('=== DEBUG: All Remarks ===', statusRemarks);
                
                // STRONG Deduplication - Remove exact duplicates
                const uniqueRemarks = statusRemarks.filter((remark, index, self) => 
                  index === self.findIndex(r => 
                    r.ilead_status_remarks_id === remark.ilead_status_remarks_id &&
                    r.lead_status_remarks === remark.lead_status_remarks &&
                    r.dcreated_dt === remark.dcreated_dt &&
                    r.due_date === remark.due_date
                  )
                );

                console.log('=== DEBUG: After Deduplication ===', uniqueRemarks);

                return uniqueRemarks.map((remark, index) => (
                  <div key={`${remark.ilead_status_remarks_id}_${index}`} className="relative flex-shrink-0">
                    {index !== uniqueRemarks.length - 1 && (
                      <div className="absolute top-1/2 left-full w-6 h-1 bg-gray-400 shadow-md shadow-gray-600 transform -translate-y-1/2 z-0"></div>
                    )}
                    <div
                      className="bg-white shadow-md rounded-3xl p-5 flex flex-col justify-between min-h-[200px] max-h-[200px] w-[230px] overflow-hidden cursor-pointer transition z-10"
                      style={{ minWidth: "250px", maxWidth: "250px" }} 
                      onClick={() => setSelectedRemark(remark)}
                    >
                      <div className="space-y-2 text-sm">
                        <p
                          className="text-sm break-words line-clamp-3"
                          title={remark.lead_status_remarks}
                        >
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
                        <p className="text-sm">
                          <strong>Due Date:</strong>{" "}
                          {remark.due_date ? new Date(remark.due_date)
                            .toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/(am|pm)/, (match) => match.toUpperCase()) : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
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