import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Autocomplete,
  Snackbar,
  Alert,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';

const DemoSessionDetails = ({ leadId }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');

  const fetchDemoDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${ENDPOINTS.DEMO_SESSION_GET}?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.Message || []);
    } catch (err) {
      console.error('Failed to fetch demo session details:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(ENDPOINTS.USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const toInputDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
  };

  const openEditDialog = (session) => {
    setSelectedSession(session);
    setFormData({
      ...session,
      demoSessionAttendees: [],
    });
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');

    if (formData.dDemoSessionEndTime < formData.dDemoSessionStartTime) {
      setSnackMessage('End time must be after the start time!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    const payload = {
      demoSessionId: selectedSession.idemoSessionId,
      demoSessionType: formData.cDemoSessionType,
      demoSessionStartTime: new Date(formData.dDemoSessionStartTime).toISOString(),
      demoSessionEndTime: new Date(formData.dDemoSessionEndTime).toISOString(),
      notes: formData.notes,
      place: formData.cPlace,
      leadId: formData.ilead_id,
      demoSessionAttendees: (formData.demoSessionAttendees || []).map(u => ({ attendeeId: u.iUser_id })),
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
      setSnackMessage('Failed to update session!');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  useEffect(() => {
    if (leadId) fetchDemoDetails();
    fetchUsers();
  }, [leadId]);

  return (
    <Box mt={4}>
      {sessions.map((session, index) => (
        <Card key={`session-${session.idemoSessionId}`} sx={{ mb: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Session #{index + 1} - {session.cDemoSessionType?.toUpperCase()}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography><strong>Start Time:</strong> {new Date(session.dDemoSessionStartTime).toLocaleString()}</Typography>
            <Typography><strong>End Time:</strong> {new Date(session.dDemoSessionEndTime).toLocaleString()}</Typography>
            <Typography><strong>{session.cDemoSessionType === 'online' ? 'Meeting Link' : 'Place'}:</strong> {session.cPlace}</Typography>
            <Typography><strong>Notes:</strong> {session.notes || '—'}</Typography>
            <Typography mt={2}><strong>Created By:</strong> {session.createdBy?.cFull_name || 'N/A'}</Typography>
            {session.updatedBy && (
              <Typography><strong>Updated By:</strong> {session.updatedBy?.cFull_name}</Typography>
            )}

            <Typography mt={2}><strong>Attendees:</strong></Typography>
            <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
              {(session.attendees || []).map((attendee) => (
                <Chip
                  key={`attendee-${attendee.idemoSessionAttendeesId}`}
                  label={attendee.user?.cFull_name || 'Unnamed'}
                  variant="outlined"
                />
              ))}
            </Box>

            <Button onClick={() => openEditDialog(session)} variant="contained" sx={{ mt: 2 }}>Edit</Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Demo Session</DialogTitle>
        <DialogContent sx={{ width: 400 }}>
          <TextField
            label="Session Type"
            select
            fullWidth
            value={formData.cDemoSessionType || ''}
            onChange={(e) => {
              const newType = e.target.value;
              setFormData((prev) => ({
                ...prev,
                cDemoSessionType: newType,
                cPlace: ''
              }));
            }}
            sx={{ mt: 2 }}
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
          />

          <TextField
            label="Start Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={toInputDateTime(formData.dDemoSessionStartTime)}
            onChange={(e) => setFormData({ ...formData, dDemoSessionStartTime: e.target.value })}
            sx={{ mt: 2 }}
          />

          <TextField
            label="End Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={toInputDateTime(formData.dDemoSessionEndTime)}
            onChange={(e) => setFormData({ ...formData, dDemoSessionEndTime: e.target.value })}
            sx={{ mt: 2 }}
          />

          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={2}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            sx={{ mt: 2 }}
          />

          <Typography sx={{ mt: 2 }}><strong>Existing Attendees:</strong></Typography>
          <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
            {(selectedSession?.attendees || []).map((attendee) => (
              <Chip
                key={`selected-attendee-${attendee.idemoSessionAttendeesId}`}
                label={attendee.user?.cFull_name || 'Unnamed'}
                variant="filled"
                color="primary"
              />
            ))}
          </Box>

          <Autocomplete
            multiple
            options={users.filter(user =>
              !(selectedSession?.attendees || []).some(att => att.attendeeId === user.iUser_id) &&
              !(formData.demoSessionAttendees || []).some(att => att.iUser_id === user.iUser_id)
            )}
            getOptionLabel={(option) => option.cFull_name || ''}
            isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
            onChange={(e, newVal) => {
              setFormData(prev => ({
                ...prev,
                demoSessionAttendees: newVal
              }));
            }}
            renderInput={(params) => <TextField {...params} label="Add New Attendees" sx={{ mt: 2 }} />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Save</Button>
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
  );
};

export default DemoSessionDetails;
