import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Divider, Chip, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  Autocomplete, Snackbar, Alert, MenuItem
} from '@mui/material';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
  },
});

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string provided to formatDate: ${dateString}`);
    return '-';
  }
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleString('en-GB', options);
};

const DemoSessionDetails = ({ leadId }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  // New state to store original attendees when dialog opens
  const [originalAttendees, setOriginalAttendees] = useState([]);

  const fetchDemoDetails = async () => {
    // console.log(`[Frontend Request] Attempting to fetch for leadId: ${leadId}`);
    if (!leadId) {
      console.warn("fetchDemoDetails: leadId is undefined or null. Aborting fetch.");
      setSessions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${ENDPOINTS.DEMO_SESSION_GET}?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // console.log('Raw GET Demo Session API Response:', res.data);

      if (res.data.Message && Array.isArray(res.data.Message) && res.data.Message.length > 0) {
        const rawSessionData = res.data.Message[0];

        if (rawSessionData.ilead_id !== parseInt(leadId, 10)) {
          console.warn(`[Data Mismatch] API returned session for ilead_id: ${rawSessionData.ilead_id}, but requested leadId was: ${leadId}.`);
          setSessions([]);
          setSnackMessage(`No demo sessions found for the requested lead ID ${leadId}. Data received belongs to lead ID ${rawSessionData.ilead_id}.`);
          setSnackSeverity('warning');
          setSnackOpen(true);
          return;
        }

        const uniqueAttendeesMap = new Map();
        (rawSessionData.attendees || []).forEach(att => {
            if (uniqueAttendeesMap.has(att.attendeeId)) {
                if (att.idemoSessionAttendeesId && !uniqueAttendeesMap.get(att.attendeeId).idemoSessionAttendeesId) {
                    uniqueAttendeesMap.set(att.attendeeId, att);
                }
            } else {
                uniqueAttendeesMap.set(att.attendeeId, att);
            }
        });

        const formattedSession = {
          ...rawSessionData,
          attendees: Array.from(uniqueAttendeesMap.values()).map(att => ({
            idemoSessionAttendeesId: att.idemoSessionAttendeesId,
            user: {
                iUser_id: att.attendeeId,
                cFull_name: att.user?.cFull_name || 'Unnamed User'
            }
          })),
        };
        // console.log('Successfully formatted session for state:', formattedSession);
        setSessions([formattedSession]);
      } else {
        console.warn("API response 'Message' is empty or not an array. Response:", res.data);
        setSnackMessage(`No demo sessions found for lead ID ${leadId}.`);
        setSnackSeverity('info');
        setSnackOpen(true);
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to fetch demo session details:', err);
      const errorMessage = err.response?.data?.Message || 'Failed to load demo session details due to network or server error.';
      setSnackMessage(errorMessage);
      setSnackSeverity('error');
      setSnackOpen(true);
      setSessions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(ENDPOINTS.USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.map(user => ({
          ...user,
          cFull_name: user.cFull_name || `User ID ${user.iUser_id}`
      })) || []);
      // console.log('Fetched Users:', res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setSnackMessage('Failed to load user list.');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const toInputDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  };

  // Opens the edit dialog and initializes formData with the selected session's data
  const openEditDialog = (session) => {
    setSelectedSession(session);
    const initialAttendeesForForm = (session.attendees || [])
      .map(att => ({
          iUser_id: att.user.iUser_id,
          cFull_name: att.user.cFull_name,
          idemoSessionAttendeesId: att.idemoSessionAttendeesId
      }))
      .filter(Boolean);
    
    // Store the original attendees
    setOriginalAttendees(initialAttendeesForForm);

    setFormData({
      ...session,
      demoSessionAttendees: initialAttendeesForForm,
      dDemoSessionStartTime: toInputDateTime(session.dDemoSessionStartTime),
      dDemoSessionEndTime: toInputDateTime(session.dDemoSessionEndTime),
    });
    // console.log('Opening Edit Dialog. Initial formData.demoSessionAttendees:', initialAttendeesForForm);
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const { cDemoSessionType, cPlace, dDemoSessionStartTime, dDemoSessionEndTime, notes, demoSessionAttendees } = formData;

    // console.log('FormData before validation and payload creation:', formData);
    // console.log('Attendees in formData (from Autocomplete selection):', demoSessionAttendees);
    // console.log('Original Attendees:', originalAttendees);

    if (!cDemoSessionType || !cPlace || !dDemoSessionStartTime || !dDemoSessionEndTime || !notes || (demoSessionAttendees || []).length === 0) {
      setSnackMessage('All fields are mandatory, and at least one attendee is required!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    if (new Date(dDemoSessionEndTime) < new Date(dDemoSessionStartTime)) {
      setSnackMessage('End time must be after the start time!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    // Determine attendees to add/update/deactivate
    const payloadAttendees = [];

    // 1. Attendees currently selected in the form
    (demoSessionAttendees || []).forEach(selectedUser => {
      const userId = selectedUser.iUser_id;
      if (typeof userId !== 'number' || isNaN(userId)) {
        console.error("Payload creation error: Invalid or missing iUser_id for selected attendee:", selectedUser);
        return;
      }

      const existingAttendee = originalAttendees.find(
        (att) => att.iUser_id === userId
      );

      payloadAttendees.push({
        attendeeId: userId,
        idemoSessionAttendeesId: existingAttendee ? existingAttendee.idemoSessionAttendeesId : null, // Include ID if existing
        status: true, // Always true for actively selected attendees
      });
    });

    // 2. Attendees who were originally part of the session but are no longer selected
    originalAttendees.forEach(originalAtt => {
      const isStillSelected = (demoSessionAttendees || []).some(
        (selectedUser) => selectedUser.iUser_id === originalAtt.iUser_id
      );

      if (!isStillSelected) {
        // This attendee was removed, send with status: false
        if (originalAtt.idemoSessionAttendeesId) { // Only send if it's an existing attendee link
            payloadAttendees.push({
                attendeeId: originalAtt.iUser_id,
                idemoSessionAttendeesId: originalAtt.idemoSessionAttendeesId,
                status: false, // Set status to false for removed attendees
            });
        }
      }
    });

    const payload = {
      demoSessionId: selectedSession.idemoSessionId,
      demoSessionType: cDemoSessionType,
      demoSessionStartTime: new Date(dDemoSessionStartTime).toISOString(),
      demoSessionEndTime: new Date(dDemoSessionEndTime).toISOString(),
      notes: notes,
      place: cPlace,
      leadId: selectedSession.ilead_id,
      demoSessionAttendees: payloadAttendees,
    };

    // console.log('Sending PUT Payload:', payload);

    try {
      await axios.put(ENDPOINTS.DEMO_SESSION_EDIT, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setSnackMessage('Session updated successfully! 🎉');
      setSnackSeverity('success');
      setSnackOpen(true);
      setOpenDialog(false);

      await fetchDemoDetails();

    } catch (err) {
      console.error('Failed to update session:', err);
      const errorMessage = err.response?.data?.Message || 'Failed to update session!';
      setSnackMessage(errorMessage);
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (leadId) {
      fetchDemoDetails();
    } else {
      setSessions([]);
    }
  }, [leadId]);

  return (
    <ThemeProvider theme={theme}>
      <Box mt={4}>
        {sessions.length === 0 ? (
          <Typography variant="h6" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
            No demo sessions found for this lead.
          </Typography>
        ) : (
          sessions.map((session) => (
            <Card key={`session-${session.idemoSessionId}`} sx={{ mb: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session - {session.cDemoSessionType?.toUpperCase()}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography><strong>Start Time:</strong> {formatDate(session.dDemoSessionStartTime)}</Typography>
                <Typography><strong>End Time:</strong> {formatDate(session.dDemoSessionEndTime)}</Typography>
                <Typography><strong>{session.cDemoSessionType === 'online' ? 'Meeting Link' : 'Place'}:</strong> {session.cPlace}</Typography>
                <Typography><strong>Notes:</strong> {session.notes || '—'}</Typography>
                <Typography mt={2}><strong>Created By:</strong> {session.createdBy?.cFull_name || 'N/A'}</Typography>
                {session.updatedBy && (
                  <Typography><strong>Updated By:</strong> {session.updatedBy?.cFull_name}</Typography>
                )}
                <Typography mt={2}><strong>Attendees:</strong></Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                  {/* Display only active attendees here */}
                  {(session.attendees || []).filter(att => att.status !== false).map((attendee) => (
                    <Chip
                      key={`attendee-${attendee.idemoSessionAttendeesId || attendee.user.iUser_id}`}
                      label={attendee.user?.cFull_name || 'Unnamed'}
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Button onClick={() => openEditDialog(session)} variant="contained" sx={{ mt: 2 }} color="primary">
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Edit Demo Session</DialogTitle>
          <DialogContent sx={{ width: 400 }}>
            <TextField
              label="Session Type"
              select
              fullWidth
              value={formData.cDemoSessionType || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, cDemoSessionType: e.target.value, cPlace: '' }))}
              sx={{ mt: 2 }}
              required
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </TextField>

            <TextField
              label={formData.cDemoSessionType === 'online' ? 'Meeting Link' : 'Place'}
              fullWidth
              value={formData.cPlace || ''}
              placeholder={formData.cDemoSessionType === 'online' ? 'G-Meet Link' : 'Enter location'}
              onChange={(e) => setFormData({ ...formData, cPlace: e.target.value })}
              sx={{ mt: 2 }}
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Start Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dDemoSessionStartTime || ''}
              onChange={(e) => setFormData({ ...formData, dDemoSessionStartTime: e.target.value })}
              sx={{ mt: 2 }}
              required
            />

            <TextField
              label="End Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dDemoSessionEndTime || ''}
              onChange={(e) => setFormData({ ...formData, dDemoSessionEndTime: e.target.value })}
              sx={{ mt: 2 }}
              required
            />

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={{ mt: 2 }}
              required
              InputLabelProps={{ shrink: true }}
            />

            <Autocomplete
              multiple
              options={users.filter(
                (user) => user.bactive === true
              )}
              getOptionLabel={(option) => option.cFull_name}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={formData.demoSessionAttendees || []}
              onChange={(e, newVal) => {
                setFormData((prev) => ({
                  ...prev,
                  demoSessionAttendees: newVal,
                }));
                // console.log('Autocomplete onChange: newVal (selected attendees):', newVal);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Add/Remove Attendees" sx={{ mt: 2 }} required />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.idemoSessionAttendeesId || `user-${option.iUser_id}-${index}`}
                    label={option.cFull_name}
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackOpen}
          autoHideDuration={3000}
          onClose={() => setSnackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
            {snackMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default DemoSessionDetails;