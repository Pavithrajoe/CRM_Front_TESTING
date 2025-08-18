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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
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
  const [originalAttendees, setOriginalAttendees] = useState([]);
  const [originalPresenters, setOriginalPresenters] = useState([]);

  const fetchDemoDetails = async () => {
    if (!leadId) {
      setSessions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${ENDPOINTS.DEMO_SESSION_GET}?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.Message && Array.isArray(res.data.Message) && res.data.Message.length > 0) {
        const rawSessionData = res.data.Message[0];

        if (rawSessionData.ilead_id !== parseInt(leadId, 10)) {
          setSessions([]);
          setSnackMessage(`No demo sessions found for the requested lead ID ${leadId}.`);
          setSnackSeverity('warning');
          setSnackOpen(true);
          return;
        }

        const formattedSession = {
          ...rawSessionData,
          attendees: (rawSessionData.attendees || []).map(att => ({
            idemoSessionAttendeesId: att.idemoSessionAttendeesId,
            user: {
              iUser_id: att.attendeeId,
              cFull_name: att.user?.cFull_name || 'Unnamed User'
            }
          })),
          presenters: (rawSessionData.presedtedBy || []).map(pres => ({
            idemo_session_presented_by: pres.idemo_session_presented_by,
            user: {
              iUser_id: pres.presented_by,
              cFull_name: pres.user?.cFull_name || 'Unnamed User'
            }
          })),
        };
        
        setSessions([formattedSession]);
      } else {
        setSnackMessage(`No demo sessions found for lead ID ${leadId}.`);
        setSnackSeverity('info');
        setSnackOpen(true);
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to fetch demo session details:', err);
      setSnackMessage('Failed to load demo session details.');
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

  const openEditDialog = (session) => {
    setSelectedSession(session);
    
    const initialAttendeesForForm = (session.attendees || [])
      .map(att => ({
        iUser_id: att.user.iUser_id,
        cFull_name: att.user.cFull_name,
        idemoSessionAttendeesId: att.idemoSessionAttendeesId
      }))
      .filter(Boolean);
    
    const initialPresentersForForm = (session.presenters || [])
      .map(pres => ({
        iUser_id: pres.user.iUser_id,
        cFull_name: pres.user.cFull_name,
        idemo_session_presented_by: pres.idemo_session_presented_by
      }))
      .filter(Boolean);

    setOriginalAttendees(initialAttendeesForForm);
    setOriginalPresenters(initialPresentersForForm);

    setFormData({
      ...session,
      demoSessionAttendees: initialAttendeesForForm,
      presentedByUsers: initialPresentersForForm,
      dDemoSessionStartTime: toInputDateTime(session.dDemoSessionStartTime),
      dDemoSessionEndTime: toInputDateTime(session.dDemoSessionEndTime),
    });
    
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const { 
      cDemoSessionType, 
      cPlace, 
      dDemoSessionStartTime, 
      dDemoSessionEndTime, 
      notes, 
      demoSessionAttendees = [],
      presentedByUsers = [] 
    } = formData;

    // Validation checks
    if (!cDemoSessionType || !cPlace || !dDemoSessionStartTime || !dDemoSessionEndTime || !notes || 
        demoSessionAttendees.length === 0 || presentedByUsers.length === 0) {
      setSnackMessage('All fields are required with at least one attendee and presenter!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    if (new Date(dDemoSessionEndTime) < new Date(dDemoSessionStartTime)) {
      setSnackMessage('End time must be after start time!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    // Prepare attendees payload
    const payloadAttendees = demoSessionAttendees.map(attendee => ({
      attendeeId: attendee.iUser_id,
      ...(attendee.idemoSessionAttendeesId && { idemoSessionAttendeesId: attendee.idemoSessionAttendeesId }),
      status: true
    }));

    // Add removed attendees with status false
    originalAttendees.forEach(original => {
      if (!demoSessionAttendees.some(a => a.iUser_id === original.iUser_id)) {
        payloadAttendees.push({
          attendeeId: original.iUser_id,
          idemoSessionAttendeesId: original.idemoSessionAttendeesId,
          status: false
        });
      }
    });

    // Prepare presenters payload
    const payloadPresenters = presentedByUsers.map(presenter => ({
      presenetedUserId: presenter.iUser_id,
      ...(presenter.idemo_session_presented_by && { 
        demoSessionPresentedById: presenter.idemo_session_presented_by 
      }),
      status: true
    }));

    // Add removed presenters with status false
    originalPresenters.forEach(original => {
      if (!presentedByUsers.some(p => p.iUser_id === original.iUser_id)) {
        payloadPresenters.push({
          presenetedUserId: original.iUser_id,
          demoSessionPresentedById: original.idemo_session_presented_by,
          status: false
        });
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
      presentedByUsers: payloadPresenters,
    };

    try {
      await axios.put(ENDPOINTS.DEMO_SESSION_EDIT, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setSnackMessage('Session updated successfully!');
      setSnackSeverity('success');
      setSnackOpen(true);
      setOpenDialog(false);
      fetchDemoDetails();
    } catch (err) {
      console.error('Failed to update session:', err);
      setSnackMessage(err.response?.data?.Message || 'Failed to update session!');
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
                
                <Typography mt={2}><strong>Attendees:</strong></Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                  {(session.attendees || []).map((attendee) => (
                    <Chip
                      key={`attendee-${attendee.idemoSessionAttendeesId || attendee.user.iUser_id}`}
                      label={attendee.user?.cFull_name || 'Unnamed'}
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Typography mt={2}><strong>Presented By:</strong></Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                  {(session.presenters || []).map((presenter) => (
                    <Chip
                      key={`presenter-${presenter.idemo_session_presented_by || presenter.user.iUser_id}`}
                      label={presenter.user?.cFull_name || 'Unnamed'}
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Button 
                  onClick={() => openEditDialog(session)} 
                  variant="contained" 
                  sx={{ mt: 2 }} 
                  color="primary"
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Demo Session</DialogTitle>
          <DialogContent>
            <TextField
              label="Session Type"
              select
              fullWidth
              value={formData.cDemoSessionType || ''}
              onChange={(e) => setFormData({ ...formData, cDemoSessionType: e.target.value })}
              sx={{ mt: 2 }}
              required
            >
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </TextField>

            <TextField
              label={formData.cDemoSessionType === 'online' ? 'Meeting Link' : 'Place'}
              fullWidth
              value={formData.cPlace || ''}
              onChange={(e) => setFormData({ ...formData, cPlace: e.target.value })}
              sx={{ mt: 2 }}
              required
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
            />

            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => option.cFull_name}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={formData.demoSessionAttendees || []}
              onChange={(e, newValue) => setFormData({ ...formData, demoSessionAttendees: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Attendees" sx={{ mt: 2 }} required />
              )}
            />

            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => option.cFull_name}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              value={formData.presentedByUsers || []}
              onChange={(e, newValue) => setFormData({ ...formData, presentedByUsers: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Presented By" sx={{ mt: 2 }} required />
              )}
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