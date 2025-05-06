import React, { useState, useEffect } from 'react';
import { Drawer, TextField, Button, CircularProgress } from '@mui/material';

const MeetFormDrawer = ({ open, onClose, selectedDate, onCreated, editingDraft }) => {
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    participants: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDraft) {
      setFormData({
        title: editingDraft.title,
        time: editingDraft.time,
        participants: editingDraft.participants || ''
      });
    } else {
      setFormData({ title: '', time: '', participants: '' });
    }
  }, [editingDraft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await dummyApi.createMeet({
        ...formData,
        id: editingDraft?.id, // send ID if editing
        date: selectedDate.toISOString().split('T')[0]
      });
      onCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating/editing meet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="p-4 w-80">
        <h3 className="font-medium text-lg mb-4">Create/Edit Meet</h3>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Meeting Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="mb-4"
          />
          <TextField
            label="Time"
            fullWidth
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            className="mb-4"
          />
          <TextField
            label="Participants"
            fullWidth
            value={formData.participants}
            onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
            required
            className="mb-4"
          />

          <div className="flex justify-end">
            <Button variant="contained" color="primary" type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Meet'}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

export default MeetFormDrawer;
