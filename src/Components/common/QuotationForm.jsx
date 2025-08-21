import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  Box,
  Divider,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ENDPOINTS } from "../../api/constraints";
import { usePopup } from "../../context/PopupContext";

const QuotationForm = ({ 
  leadId, 
  open, 
  onClose, 
  onQuotationCreated,
  leadData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const { showPopup } = usePopup();
  
  const [formData, setFormData] = useState({
    quote_number: '',
    dValid_until: '',
    terms: '',
    icurrency_id: 1, // Default to INR
    services: [{ 
      iservice_id: '',
      cService_name: '', 
      cDescription: '', 
      iHours: 1, 
      fHourly_rate: 0,
      fTotal_price: 0
    }],
  });

  // Extract user and company info from localStorage
  useEffect(() => {
    const extractUserInfo = () => {
      try {
        const token = localStorage.getItem("token");
        let userData = null;

        if (token) {
          const base64Payload = token.split(".")[1];
          const decodedPayload = atob(base64Payload);
          userData = JSON.parse(decodedPayload);
        } else {
          const storedUserData = localStorage.getItem("user");
          if (storedUserData) {
            userData = JSON.parse(storedUserData);
          }
        }

        if (userData) {
          setUserInfo(userData);
          setCompanyInfo({
            iCompany_id: userData.iCompany_id || userData.company_id,
            icurrency_id: userData.icurrency_id || 1,
            iCreated_by: userData.iUser_id || userData.user_id,
            company_name: userData.company_name || "Company Name",
            company_address: userData.company_address || "123 Main Street",
            company_phone: userData.company_phone || "9876543210",
            company_gst_no: userData.company_gst_no || "123456789",
            website: userData.website || "www.example.com"
          });
        }
      } catch (error) {
        console.error("Error extracting user info:", error);
        showPopup("Error", "Failed to load user information", "error");
      }
    };

    if (open) {
      extractUserInfo();
      
      // Generate quote number
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 1000);
      setFormData(prev => ({
        ...prev,
        quote_number: `QTN-${leadId}-${timestamp}-${randomNum}`,
        dValid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));

      // Fetch currencies
      fetchCurrencies();
      
      // Fetch services
      fetchServices();
    }
  }, [open, leadId, showPopup]);

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(ENDPOINTS.CURRENCY, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      showPopup('Error', 'Failed to load currencies', 'error');
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(ENDPOINTS.MASTER_SERVICE_GET, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.Message) {
        setServicesList(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      showPopup('Error', 'Failed to load services', 'error');
    }
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    
    if (field === 'iservice_id') {
      const selectedService = servicesList.find(service => service.iservice_id === parseInt(value));
      if (selectedService) {
        newServices[index].cService_name = selectedService.cservice_name;
        newServices[index].cDescription = selectedService.cservice_name;
      }
      newServices[index][field] = value;
    } else {
      newServices[index][field] = value;
      
      // Calculate total price if hours or rate changes
      if (field === 'iHours' || field === 'fHourly_rate') {
        const hours = parseFloat(newServices[index].iHours) || 0;
        const rate = parseFloat(newServices[index].fHourly_rate) || 0;
        newServices[index].fTotal_price = hours * rate;
      }
    }
    
    setFormData({ ...formData, services: newServices });
  };

  const addServiceField = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { 
        iservice_id: '',
        cService_name: '', 
        cDescription: '', 
        iHours: 1, 
        fHourly_rate: 0,
        fTotal_price: 0
      }],
    });
  };

  const removeServiceField = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const calculateTotal = () => {
    return formData.services.reduce((sum, service) => {
      return sum + (service.fTotal_price || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate services
    for (const service of formData.services) {
      if (!service.cService_name || !service.cDescription || !service.iHours || !service.fHourly_rate) {
        showPopup('Error', 'Please fill in all service fields.', 'error');
        return;
      }
    }
    
    if (!companyInfo || !companyInfo.iCompany_id || !companyInfo.iCreated_by) {
      showPopup('Error', 'Company information is missing. Please try again.', 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const payload = {
      iLead_id: parseInt(leadId),
      icomapany_id: companyInfo.iCompany_id,
      services: formData.services.map(service => ({
        // iservice_id: service.iservice_id ? parseInt(service.iservice_id) : null,
        cService_name: service.cService_name,
        cDescription: service.cDescription,
        iHours: parseFloat(service.iHours),
        fHourly_rate: parseFloat(service.fHourly_rate)
      })),
      cTerms: formData.terms,
      icurrency_id: formData.icurrency_id,
      iCreated_by: companyInfo.iCreated_by,
    };

    console.log('Sending payload:', payload);

    try {
      const response = await fetch(ENDPOINTS.QUOTATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create quotation');
      }

      showPopup('Success', 'Quotation created successfully!', 'success');
      if (onQuotationCreated) onQuotationCreated(responseData.data);
      if (onClose) onClose();
      
      // Reset form
      setFormData({
        quote_number: '',
        dValid_until: '', 
        terms: '',
        icurrency_id: 1,
        services: [{ 
          iservice_id: '',
          cService_name: '', 
          cDescription: '', 
          iHours: 1, 
          fHourly_rate: 0,
          fTotal_price: 0
        }],
      });
    } catch (error) {
      console.error('Error creating quotation:', error);
      showPopup('Error', error.message || 'Failed to create quotation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = calculateTotal();
  const selectedCurrency = currencies.find(c => c.icurrency_id === formData.icurrency_id) || {symbol: '$'};

  if (!companyInfo || !userInfo) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Create New Quotation</span>
          <Typography variant="body2" color="textSecondary">
            For: {leadData?.cFirstName} {leadData?.cLastName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id="quotation-form">
          <div className="space-y-4 py-2">
            {/* Company Details Section */}
            <Box mb={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
              <Typography variant="h6" gutterBottom>
                Company Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Company Name"
                    fullWidth
                    value={companyInfo.company_name}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="GST No"
                    fullWidth
                    value={companyInfo.company_gst_no}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Address"
                    fullWidth
                    value={companyInfo.company_address}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={companyInfo.company_phone}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Website"
                    fullWidth
                    value={companyInfo.website}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.icurrency_id}
                      label="Currency"
                      onChange={(e) => setFormData({ ...formData, icurrency_id: e.target.value })}
                      required
                    >
                      {currencies.map((currency) => (
                        <MenuItem key={currency.icurrency_id} value={currency.icurrency_id}>
                          {currency.currency_code} ({currency.symbol})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Lead Details Section */}
            <Box mb={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
              <Typography variant="h6" gutterBottom>
                Client Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Client Name"
                    fullWidth
                    value={`${leadData?.cFirstName || ''} ${leadData?.cLastName || ''}`}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Company"
                    fullWidth
                    value={leadData?.lead_organization || ''}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={leadData?.cEmail || ''}
                    margin="dense"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={leadData?.cPhone || ''}
                    margin="dense"
                    disabled
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Quotation Details */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quote Number"
                  fullWidth
                  value={formData.quote_number}
                  onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                  margin="dense"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valid Until"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.dValid_until}
                  onChange={(e) => setFormData({ ...formData, dValid_until: e.target.value })}
                  margin="dense"
                  required
                />
              </Grid>
            </Grid>
            
            {/* Services Section */}
            <Box mb={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Services
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Amount: {selectedCurrency.symbol}{totalAmount.toFixed(2)}
                </Typography>
              </Box>
              
              <List>
                {formData.services.map((service, index) => (
                  <ListItem key={index} className="px-0 pt-0 pb-2">
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Service</InputLabel>
                          <Select
                            value={service.iservice_id}
                            label="Service"
                            onChange={(e) => handleServiceChange(index, 'iservice_id', e.target.value)}
                            required
                          >
                            {servicesList.map((serviceItem) => (
                              <MenuItem key={serviceItem.iservice_id} value={serviceItem.iservice_id}>
                                {serviceItem.cservice_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Hours"
                          type="number"
                          value={service.iHours}
                          onChange={(e) => handleServiceChange(index, 'iHours', e.target.value)}
                          fullWidth
                          inputProps={{ min: 0.5, step: 0.5 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label={`Hourly Rate (${selectedCurrency.symbol})`}
                          type="number"
                          value={service.fHourly_rate}
                          onChange={(e) => handleServiceChange(index, 'fHourly_rate', e.target.value)}
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={2} className="flex items-center">
                        <Typography variant="body2" fontWeight="bold">
                          {selectedCurrency.symbol}{service.fTotal_price.toFixed(2)}
                        </Typography>
                        {formData.services.length > 1 && (
                          <Tooltip title="Remove Service">
                            <IconButton 
                              onClick={() => removeServiceField(index)} 
                              className="ml-2"
                              type="button"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Description"
                          multiline
                          rows={2}
                          value={service.cDescription}
                          onChange={(e) => handleServiceChange(index, 'cDescription', e.target.value)}
                          fullWidth
                          required
                          placeholder="Detailed description of the service"
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={addServiceField}
                  variant="outlined"
                  className="mt-2"
                  type="button"
                >
                  Add Service
                </Button>
              </List>
            </Box>
            
            <TextField
              label="Terms & Conditions"
              multiline
              rows={3}
              fullWidth
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              margin="dense"
              required
              placeholder="Payment terms, delivery conditions, etc."
            />
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="quotation-form"
          variant="contained" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Create Quotation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationForm;