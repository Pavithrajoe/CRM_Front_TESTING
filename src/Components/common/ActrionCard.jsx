import React, { useState, useEffect } from "react";
import { ENDPOINTS } from '../../api/constraints';

import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Button,
  Box,
  Paper,
  Divider
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ActionCard = ({ leadId, onActionClick = () => {} }) => {
  const [actions, setActions] = useState([]);
  const [error, setError] = useState(null);

  const fetchLeadAction = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS_ACTION}/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch stages");
      }

      const data = await response.json();

      setActions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch stage data");
      setActions([]);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadAction();
    }
  }, [leadId]);

  return (
    <Box sx={{ px: { xs: 1, sm: 3 }, py: 2 }}>
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {actions.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: '#f9fafb',
            color: '#9ca3af'
          }}
        >
          <Typography variant="body1">
            No actions available for this lead.
          </Typography>
        </Paper>
      ) : (
     <List>
  {actions.map((action, index) => (
    <React.Fragment key={index}>
      <ListItem
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          mb: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        
      >
<ListItemText
  primary={
    <>
      {action.caction}
      {!['Won', 'Proposal'].includes(action.caction) && (
        <Typography
          component="span"
          variant="caption"
          sx={{ ml: 1, px: 1, bgcolor: 'warning.light', borderRadius: 1 }}
        >
          Demo
        </Typography>
      )}
    </>
  }
  secondary={
    <Typography variant="caption" color="text.secondary" noWrap>
      {['Won', 'Proposal'].includes(action.caction)
        ? action.iamount && !isNaN(action.iamount)
          ? `Amount: ₹ ${new Intl.NumberFormat('en-IN').format(action.iamount)}`
          : 'Amount not available'
        : 'Demo action – no billing applicable'}
    </Typography>
  }
/>

      </ListItem>
      {index < actions.length - 1 && <Divider/>}
    </React.Fragment>
  ))}
</List>
      )}
    </Box>
  );
};

export default ActionCard;
