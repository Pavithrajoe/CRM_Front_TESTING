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
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
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
  const [taxList, setTaxList] = useState([]);
  const [termsList, setTermsList] = useState([]);
  const { showPopup } = usePopup();

  const [formData, setFormData] = useState({
    quote_number: '',
    dValid_until: '',
    cCustom_terms: '', // Changed from `terms`
    iTerm_id: null, // New field for dropdown selection
    icurrency_id: 1, // Default to INR
    fDiscount: 0,
    iDiscount_id: null,
    cGst: '',
    services: [{
      iservice_id: '',
      cService_name: '',
      cDescription: '',
      iQuantity: 1,
      fPrice: 0,
      iTax_id: null,
      fDiscount: 0
    }],
  });

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
          const companyData = {
            iCompany_id: userData.iCompany_id || userData.company_id,
            icurrency_id: userData.icurrency_id || 1,
            iCreated_by: userData.iUser_id || userData.user_id,
            company_name: userData.company_name || "Company Name",
            company_address: userData.company_address || "123 Main Street",
            company_phone: userData.company_phone || "9876543210",
            company_gst_no: userData.company_gst_no || "123456789",
            website: userData.website || "www.example.com"
          };
          setCompanyInfo(companyData);
        }
      } catch (error) {
        console.error("Error extracting user info:", error);
        showPopup("Error", "Failed to load user information", "error");
      }
    };

    if (open) {
      extractUserInfo();
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 1000);
      setFormData(prev => ({
        ...prev,
        quote_number: `QTN-${leadId}-${timestamp}-${randomNum}`,
        dValid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      const companyId = JSON.parse(localStorage.getItem("user"))?.iCompany_id || JSON.parse(localStorage.getItem("user"))?.company_id;

      fetchCurrencies();
      fetchServices();
      if (companyId) {
        fetchTaxes(companyId);
        fetchTerms(companyId);
      }
    }
  }, [open, leadId, showPopup]);

  const fetchData = async (endpoint, setter, errorMessage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Handle different API response structures
        if (Array.isArray(data.data)) {
          setter(data.data);
        } else if (data.data && Array.isArray(data.data.data)) {
          setter(data.data.data);
        } else {
          setter([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error(`Error fetching ${errorMessage}:`, error);
      showPopup('Error', `Failed to load ${errorMessage}`, 'error');
      setter([]); // Set to empty array on error
    }
  };

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
      if (data.success && data.data) {
        setCurrencies(data.data.data || []);
      } else {
        console.error('Failed to fetch currencies:', data.message);
        showPopup('Error', 'Failed to load currencies', 'error');
        setCurrencies([]);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      showPopup('Error', 'Failed to load currencies', 'error');
      setCurrencies([]);
    }
  };
  
  const fetchServices = () => fetchData(ENDPOINTS.MASTER_SERVICE_GET, setServicesList, 'services');
  const fetchTaxes = (companyId) => fetchData(`${ENDPOINTS.TAX_BY_COMPANY}/${companyId}`, setTaxList, 'taxes');
  const fetchTerms = (companyId) => fetchData(`${ENDPOINTS.TERMS_BY_COMPANY}/${companyId}`, setTermsList, 'terms');

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    if (field === 'iservice_id') {
      const selectedService = servicesList.find(service => service.iservice_id === parseInt(value));
      if (selectedService) {
        newServices[index].cService_name = selectedService.cservice_name;
        newServices[index].cDescription = selectedService.cservice_name;
      }
    }
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addServiceField = () => {
    setFormData({
      ...formData,
      services: [...formData.services, {
        iservice_id: '',
        cService_name: '',
        cDescription: '',
        iQuantity: 1,
        fPrice: 0,
        iTax_id: null,
        fDiscount: 0
      }],
    });
  };

  const removeServiceField = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const service of formData.services) {
      if (!service.cService_name || !service.cDescription || !service.iQuantity || !service.fPrice) {
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
        cService_name: service.cService_name,
        cDescription: service.cDescription,
        iQuantity: parseFloat(service.iQuantity),
        fPrice: parseFloat(service.fPrice),
        iTax_id: service.iTax_id ? parseInt(service.iTax_id) : null,
        fDiscount: parseFloat(service.fDiscount)
      })),
      iTerm_id: formData.iTerm_id, // Send single selected term ID
      cTerms: formData.cCustom_terms, // Send custom terms
      icurrency_id: formData.icurrency_id,
      iCreated_by: companyInfo.iCreated_by,
      fDiscount: parseFloat(formData.fDiscount),
      cGst: formData.cGst,
    };

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

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create quotation');
      }

      showPopup('Success', 'Quotation created successfully!', 'success');
      if (onQuotationCreated) onQuotationCreated(responseData.data);
      if (onClose) onClose();

      setFormData({
        quote_number: '',
        dValid_until: '',
        cCustom_terms: '',
        iTerm_id: null,
        icurrency_id: 1,
        fDiscount: 0,
        iDiscount_id: null,
        cGst: '',
        services: [{
          iservice_id: '',
          cService_name: '',
          cDescription: '',
          iQuantity: 1,
          fPrice: 0,
          iTax_id: null,
          fDiscount: 0
        }],
      });
    } catch (error) {
      console.error('Error creating quotation:', error);
      showPopup('Error', error.message || 'Failed to create quotation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="GST"
                  fullWidth
                  value={formData.cGst}
                  onChange={(e) => setFormData({ ...formData, cGst: e.target.value })}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Overall Discount (%)"
                  type="number"
                  fullWidth
                  value={formData.fDiscount}
                  onChange={(e) => setFormData({ ...formData, fDiscount: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                  margin="dense"
                />
              </Grid>
            </Grid>

            <Box mb={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Services
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
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={service.iQuantity}
                          onChange={(e) => handleServiceChange(index, 'iQuantity', e.target.value)}
                          fullWidth
                          inputProps={{ min: 1, step: 1 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="Price"
                          type="number"
                          value={service.fPrice}
                          onChange={(e) => handleServiceChange(index, 'fPrice', e.target.value)}
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                          <InputLabel>Tax</InputLabel>
                          <Select
                            value={service.iTax_id || ''}
                            label="Tax"
                            onChange={(e) => handleServiceChange(index, 'iTax_id', e.target.value)}
                            required={false}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {taxList.map((tax) => (
                              <MenuItem key={tax.iTax_id} value={tax.iTax_id}>
                                {tax.cTax_name} ({tax.fTax_rate}%)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <TextField
                          label="Discount (%)"
                          type="number"
                          value={service.fDiscount}
                          onChange={(e) => handleServiceChange(index, 'fDiscount', e.target.value)}
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} className="flex items-center">
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

            <Box mb={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>
              
              <FormControl fullWidth margin="dense">
                <InputLabel>Standard Terms</InputLabel>
                <Select
                  value={formData.iTerm_id || ''}
                  label="Standard Terms"
                  onChange={(e) => setFormData({ ...formData, iTerm_id: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {termsList.map((term) => (
                    <MenuItem key={term.iTerm_id} value={term.iTerm_id}>
                      {term.cTerm_text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Custom Terms"
                multiline
                rows={3}
                fullWidth
                value={formData.cCustom_terms}
                onChange={(e) => setFormData({ ...formData, cCustom_terms: e.target.value })}
                margin="dense"
                placeholder="Add additional terms or a custom message."
              />
            </Box>

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