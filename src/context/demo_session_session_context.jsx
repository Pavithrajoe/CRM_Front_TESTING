// src/context/DemoSessionContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../api/constraints';

const DemoSessionContext = createContext();

export const useDemoSession = () => {
  const context = useContext(DemoSessionContext);
  if (!context) {
    throw new Error('useDemoSession must be used within a DemoSessionProvider');
  }
  return context;
};

export const DemoSessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');

  // Fetch demo sessions for a lead
  const fetchDemoSessions = useCallback(async (leadId) => {
    if (!leadId) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${ENDPOINTS.DEMO_SESSION_GET}?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.Message && Array.isArray(res.data.Message) && res.data.Message.length > 0) {
        const rawSessionData = res.data.Message[0];

        if (rawSessionData.ilead_id !== parseInt(leadId, 10)) {
          setSessions([]);
          showSnackbar(`No demo sessions found for the requested lead ID ${leadId}.`, 'warning');
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
        setSessions([]);
        showSnackbar(`No demo sessions found for lead ID ${leadId}.`, 'info');
      }
    } catch (err) {
      console.error('Failed to fetch demo session details:', err);
      setError('Failed to load demo session details.');
      setSessions([]);
      showSnackbar('Failed to load demo session details.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new demo session
  const createDemoSession = useCallback(async (sessionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${ENDPOINTS.DEMO_SESSION_DETAILS}`, sessionData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      showSnackbar('Demo session created successfully!', 'success');
      return response.data;
    } catch (err) {
      console.error('Failed to create demo session:', err);
      setError(err.response?.data?.message || 'Failed to create demo session');
      showSnackbar(err.response?.data?.message || 'Failed to create demo session', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing demo session
  const updateDemoSession = useCallback(async (sessionId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${ENDPOINTS.DEMO_SESSION_EDIT}`, {
        demoSessionId: sessionId,
        ...updateData
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      showSnackbar('Demo session updated successfully!', 'success');
      return response.data;
    } catch (err) {
      console.error('Failed to update demo session:', err);
      setError(err.response?.data?.message || 'Failed to update demo session');
      showSnackbar(err.response?.data?.message || 'Failed to update demo session', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete demo session
  const deleteDemoSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${ENDPOINTS.DEMO_SESSION_DELETE}/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      showSnackbar('Demo session deleted successfully!', 'success');
      return response.data;
    } catch (err) {
      console.error('Failed to delete demo session:', err);
      setError(err.response?.data?.message || 'Failed to delete demo session');
      showSnackbar(err.response?.data?.message || 'Failed to delete demo session', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Snackbar utility
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setSnackOpen(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackOpen(false);
  }, []);

  // Clear sessions
  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  const value = {
    // State
    sessions,
    loading,
    error,
    snackOpen,
    snackMessage,
    snackSeverity,
    
    // Actions
    fetchDemoSessions,
    createDemoSession,
    updateDemoSession,
    deleteDemoSession,
    clearSessions,
    hideSnackbar,
    showSnackbar,
    
    // Utility functions
    hasSessions: sessions.length > 0,
    getFirstSession: sessions.length > 0 ? sessions[0] : null,
  };

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
};

export default DemoSessionContext;