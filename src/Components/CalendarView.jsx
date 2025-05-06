import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaRegSquare, FaUserAlt, FaClock, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Drawer, TextField, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Dummy API functions (keep this the same)
const dummyApi = {
  getReminders: (date) => new Promise((resolve) => {
    setTimeout(() => resolve({
      data: [
        {
          id: 1,
          title: "Project Title",
          client: "Shivakumar",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
          completed: false,
          time: "12:30 PM",
          date: date
        },
        {
          id: 2,
          title: "Project Title",
          client: "Shivakumar",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
          completed: false,
          time: "12:30 PM",
          date: date
        }
      ]
    }), 500);
  }),

  createMeet: (meetData) => new Promise((resolve) => {
    setTimeout(() => resolve({
      data: {
        ...meetData,
        id: Math.floor(Math.random() * 1000),
        client: "New Client",
        completed: false,
        description: `Meeting scheduled at ${meetData.time}`
      }
    }), 800);
  }),

  toggleReminder: () => new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 300);
  })
};

// MeetFormDrawer Component (keep this the same)
const MeetFormDrawer = ({ open, onClose, selectedDate, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    participants: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await dummyApi.createMeet({
        ...formData,
        date: selectedDate.toISOString().split('T')[0]
      });
      onCreated(response.data);
      onClose();
      setFormData({ title: '', time: '', participants: '' });
    } catch (error) {
      console.error('Error creating meet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="w-96 p-6">
        <h2 className="text-xl font-semibold mb-6">Schedule Google Meet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Meeting Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Time"
            name="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            InputLabelProps={{ shrink: true }}
            required
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Participants (Emails)"
            name="participants"
            value={formData.participants}
            onChange={(e) => setFormData({...formData, participants: e.target.value})}
            placeholder="email1@example.com, email2@example.com"
            variant="outlined"
          />
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outlined" 
              onClick={onClose}
              style={{ color: 'black', borderColor: 'black' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              style={{ backgroundColor: 'black' }}
              disabled={loading || !formData.title || !formData.time}
            >
              {loading ? <CircularProgress size={24} /> : 'Schedule Meet'}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

const CalendarView = () => {
  // State declarations for all variables being used
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [draftToEdit, setDraftToEdit] = useState(null); // For editing drafts

  // Define all functions being used
  const fetchReminders = async (date = selectedDate) => {
    setLoading(true);
    try {
      const response = await dummyApi.getReminders(date.toISOString().split('T')[0]);
      setReminders(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load reminders',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id) => {
    try {
      await dummyApi.toggleReminder(id);
      setReminders(reminders.map(reminder => 
        reminder.id === id ? {...reminder, completed: !reminder.completed} : reminder
      ));
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update reminder',
        severity: 'error'
      });
    }
  };

  const handleMeetCreated = (newMeet) => {
    setReminders([...reminders, newMeet]);
    setSnackbar({
      open: true,
      message: 'Meet created successfully!',
      severity: 'success'
    });
  };

  useEffect(() => {
    fetchReminders();
  }, [selectedDate]);

  return (
    <div className="flex h-80vh overflow-y-scroll w-full p-4 bg-gray-50">
      
      {/* Left Column - Calendar and Draft Form */}
      <div className="w-1/2 flex flex-col mr-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="border-none w-full"
            navigationLabel={({ date }) => (
              <div className="flex items-center justify-center">
                <FaChevronLeft className="mr-4 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(new Date(date.setMonth(date.getMonth() - 1)));
                  }} 
                />
                <span className="text-lg font-semibold">
                  {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
                </span>
                <FaChevronRight className="ml-4 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(new Date(date.setMonth(date.getMonth() + 1)));
                  }} 
                />
              </div>
            )}
            prevLabel={<FaChevronLeft />}
            nextLabel={<FaChevronRight />}
            tileClassName={({ date }) => 
              date.getDate() === selectedDate.getDate() ? 'bg-black text-white rounded' : ''
            }
          />

          <button 
            onClick={() => setOpenDrawer(true)}
            className="w-[180px] mt-6 bg-black hover:bg-gray-800 ms-[80px] text-white py-2 px-4 rounded-md flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            Create Meet
          </button>
        </div>

        {/* Draft Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex-1">
          <h2 className="text-xl font-semibold mb-4">Draft Form</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800">New Draft Meeting</h3>
              <p className="text-sm text-gray-600 mt-2">
                This is where you can prepare meeting drafts before scheduling them.
              </p>
              <div className="mt-4">
                <Button 
                  variant="outlined" 
                  className="w-full"
                  startIcon={<FaPlus />}
                  onClick={() => setOpenDrawer(true)}
                >
                  Start New Draft
                </Button>
              </div>
            </div>
            
            {/* Example draft items */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">Project Discussion</h3>
                  <p className="text-sm text-gray-600 mt-1">Draft created on {new Date().toLocaleDateString()}</p>
                </div>
                <Button 
                  size="small" 
                  variant="contained" 
                  style={{ backgroundColor: 'black' }}
                  onClick={() => {
                    // Set the draft item to edit and open the form
                    setDraftToEdit({
                      title: "Project Discussion",
                      time: "3:00 PM",
                      participants: "email@example.com"
                    });
                    setOpenDrawer(true);
                  }}
                >
                  Continue Editing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reminders */}
      <div className="w-1/2 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4">Today's Reminder</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <CircularProgress />
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map(reminder => (
              <div key={reminder.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start">
                  <button 
                    onClick={() => toggleReminder(reminder.id)}
                    className="mt-1 mr-3 text-gray-400 hover:text-black"
                  >
                    {reminder.completed ? (
                      <FaCheckSquare className="text-black text-lg" />
                    ) : (
                      <FaRegSquare className="text-lg" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{reminder.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <FaUserAlt className="mr-2 text-xs" />
                      {reminder.client}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{reminder.description}</p>
                  </div>
                  <div className="text-sm text-white bg-black px-3 py-1 rounded-full flex items-center">
                    <FaClock className="mr-1" />
                    {reminder.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meet Form Drawer */}
      <MeetFormDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        selectedDate={selectedDate}
        onCreated={handleMeetCreated}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CalendarView;
