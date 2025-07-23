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
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create a custom theme with a primary blue color
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3', // A standard blue color
    },
  },
});

// Utility function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
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
    // Initialize formData with existing session data
    setFormData({
      ...session,
      // Initialize attendees in formData based on current session attendees
      demoSessionAttendees: (session.attendees || []).map(att => att.user).filter(user => user),
    });
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');

    // Ensure the required fields are available in formData before using them
    const startTime = formData.dDemoSessionStartTime || selectedSession.dDemoSessionStartTime;
    const endTime = formData.dDemoSessionEndTime || selectedSession.dDemoSessionEndTime;

    // Client-side validation for mandatory fields
    if (!formData.cDemoSessionType || !formData.cPlace || !startTime || !endTime || !formData.notes || (formData.demoSessionAttendees || []).length === 0) {
      setSnackMessage('All fields are mandatory!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    if (new Date(endTime) < new Date(startTime)) {
      setSnackMessage('End time must be after the start time!');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    // Construct the payload for update
    const payload = {
      demoSessionId: selectedSession.idemoSessionId,
      demoSessionType: formData.cDemoSessionType,
      demoSessionStartTime: new Date(startTime).toISOString(),
      demoSessionEndTime: new Date(endTime).toISOString(),
      notes: formData.notes,
      place: formData.cPlace,
      leadId: formData.ilead_id,
      // Map attendees from formData to the required format for the backend
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
    <ThemeProvider theme={theme}>
      <Box mt={4}>
        {sessions.map((session, index) => (
          <Card key={`session-${session.idemoSessionId}`} sx={{ mb: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session {index + 1} - {session.cDemoSessionType?.toUpperCase()}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Displaying Dates in DD/MM/YYYY */}
              <Typography>
                <strong>Start Time:</strong> {formatDate(session.dDemoSessionStartTime)}
              </Typography>
              <Typography>
                <strong>
                  End Time:
                  <span className="text-red-600">*</span>
                </strong>{' '}
                {formatDate(session.dDemoSessionEndTime)}
              </Typography>
              <Typography>
                <strong>{session.cDemoSessionType === 'online' ? 'Meeting Link' : 'Place'}:</strong> {session.cPlace}
              </Typography>
              <Typography>
                <strong>
                  Notes:
                  <span className="text-red-600">*</span>
                </strong>{' '}
                {session.notes || '—'}
              </Typography>
              <Typography mt={2}>
                <strong>
                  Created By: <span className="text-red-600">*</span>
                </strong>{' '}
                {session.createdBy?.cFull_name || 'N/A'}
              </Typography>
              {session.updatedBy && (
                <Typography>
                  <strong>
                    Updated By: <span className="text-red-600">*</span>
                  </strong>{' '}
                  {session.updatedBy?.cFull_name}
                </Typography>
              )}

              <Typography mt={2}>
                <strong>Attendees:</strong>
              </Typography>
              <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                {(session.attendees || []).map((attendee) => (
                  <Chip
                    key={`attendee-${attendee.idemoSessionAttendeesId}`}
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
        ))}

        {/* Edit Demo Session Dialog */}
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
                  cPlace: '', // Clear place when session type changes
                }));
              }}
              sx={{ mt: 2 }}
              required // Mark as required
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
              required // Mark as required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Start Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={toInputDateTime(formData.dDemoSessionStartTime)}
              onChange={(e) => setFormData({ ...formData, dDemoSessionStartTime: e.target.value })}
              sx={{ mt: 2 }}
              required // Mark as required
            />

            <TextField
              label="End Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={toInputDateTime(formData.dDemoSessionEndTime)}
              onChange={(e) => setFormData({ ...formData, dDemoSessionEndTime: e.target.value })}
              sx={{ mt: 2 }}
              required // Mark as required
            />

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={{ mt: 2 }}
              required // Mark as required
              InputLabelProps={{ shrink: true }}
            />

            <Typography sx={{ mt: 2 }}>
              <strong>Attendees:</strong>
              <span className="text-red-600">*</span>
            </Typography>
            <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
              {/* Display existing attendees and newly added attendees */}
              {(formData.demoSessionAttendees || []).map((attendee) => (
                <Chip
                  key={`selected-attendee-${attendee.iUser_id}`}
                  label={attendee.cFull_name || 'Unnamed'}
                  variant="filled"
                  color="primary"
                />
              ))}
            </Box>

            <Autocomplete
              multiple
              options={users.filter(user =>
                // Filter users to exclude those already selected in the formData
                !(formData.demoSessionAttendees || []).some(att => att.iUser_id === user.iUser_id)
              )}
              getOptionLabel={(option) => option.bactive === true ? option.cFull_name : ''}
              isOptionEqualToValue={(option, value) => option.iUser_id === value.iUser_id}
              onChange={(e, newVal) => {
                // When new attendees are selected, add them to the formData array
                setFormData(prev => ({
                  ...prev,
                  demoSessionAttendees: newVal
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add/Remove Attendees"
                  sx={{ mt: 2 }}
                  required // Mark as required
                />
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

        {/* Snackbar for notifications */}
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