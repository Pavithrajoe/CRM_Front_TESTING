import React, { useState, useEffect, useRef } from 'react';
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
  const [currencies, setCurrencies] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [taxList, setTaxList] = useState([]);
  const [termsList, setTermsList] = useState([]);
  const { showPopup } = usePopup();
  const hasInitialized = useRef(false);

  const [formData, setFormData] = useState({
    dValid_until: '',
    cGst: '',
    icurrency_id: '',
    fDiscount: 0,
    cTerms: '',
    termIds: [],
    services: [{
      iservice_id: '',
      cService_name: '',
      cDescription: '',
      iQuantity: 1,
      fPrice: 0,
      iHours: undefined,
      fHourly_rate: undefined,
      iTax_id: null,
      fDiscount: 0
    }],
  });
  console.log("checking",leadData);

  // Generate a default valid-until date (30 days from today)
  const getDefaultValidUntil = () => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  // Custom fetch for currencies with try-catch
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
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch currencies');
      }

      let currenciesData = [];

      if (Array.isArray(json)) {
        currenciesData = json;
      }
      else if (json.data) {
        // json.data might be an object that contains 'data' which is an array
        if (Array.isArray(json.data)) {
          currenciesData = json.data;
        }
        else if (json.data.data && Array.isArray(json.data.data)) {
          currenciesData = json.data.data;
        }
        else if (typeof json.data === 'object' && json.data !== null) {
          currenciesData = [json.data];
        }
      }
      else {
        console.error("API response format invalid:", json);
        throw new Error('Currency data format invalid');
      }

      // Validate that the retrieved array contains required keys
      const validData = currenciesData.filter(entry =>
        Object.prototype.hasOwnProperty.call(entry, 'icurrency_id') &&
        Object.prototype.hasOwnProperty.call(entry, 'currency_code') &&
        Object.prototype.hasOwnProperty.call(entry, 'symbol')
      );

      if (validData.length > 0) {
        setCurrencies(validData);
        // Set default currency to the first available currency
        setFormData(prev => ({
          ...prev,
          icurrency_id: validData[0].icurrency_id
        }));
      } else {
        console.warn('Currency data list is empty or contains no valid entries.');
        setCurrencies([]);
      }

    } catch (error) {
      showPopup('Error', `Failed to load currencies: ${error.message}`, 'error');
      setCurrencies([]);
    }
  };

  // General fetch helper for other lists
  const fetchAPIData = async (endpoint) => {
    const token = localStorage.getItem('token');
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch data');
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return [];
    }
  };

  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
      return;
    }

    if (!hasInitialized.current) {
      try {
        const token = localStorage.getItem("token");
        let userData = null;
        if (token) {
          const base64Payload = token.split(".")[1];
          const decodedPayload = atob(base64Payload);
          userData = JSON.parse(decodedPayload);
        } else {
          const storedUserData = localStorage.getItem("user");
          if (storedUserData) userData = JSON.parse(storedUserData);
        }
        if (userData) {
          setCompanyInfo({
            iCompany_id: userData.iCompany_id || userData.company_id,
            icurrency_id: userData.icurrency_id,
            iCreated_by: userData.iUser_id || userData.user_id,
            company_name: userData.company_name,
            company_address: userData.company_address,
            company_gst_no: userData.company_gst_no || '',
            website: userData.website,
            company_phone: userData.company_phone,
          });
        }
      } catch (error) {
        showPopup("Error", "Failed to load user information", "error");
      }

      setFormData(prev => ({
        ...prev,
        dValid_until: getDefaultValidUntil(),
      }));

      const user = JSON.parse(localStorage.getItem("user"));
      const companyId = user?.iCompany_id || user?.company_id;

      // Fetch currencies using custom method
      fetchCurrencies();

      // Fetch other lists
      const fetchList = async (endpoint, setter, errorMessage) => {
        try {
          const data = await fetchAPIData(endpoint);
          setter(data);
        } catch (error) {
          showPopup('Error', `Failed to load ${errorMessage}`, 'error');
          setter([]);
        }
      };

      fetchList(ENDPOINTS.MASTER_SERVICE_GET, setServicesList, 'services');

      if (companyId) {
        fetchList(`${ENDPOINTS.TAX}/company/${companyId}`, setTaxList, 'taxes');
        fetchList(`${ENDPOINTS.TERMS}/company/${companyId}`, setTermsList, 'terms');
      }

      hasInitialized.current = true;
    }
  }, [open, leadId, showPopup]);

  // Handlers for dynamic services
  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    if (field === 'iservice_id') {
      const selectedService = servicesList.find(s => s.iservice_id === parseInt(value));
      if (selectedService) {
        newServices[index].cService_name = selectedService.cservice_name || '';
        newServices[index].cDescription = selectedService.cservice_name || '';
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
        iHours: undefined,
        fHourly_rate: undefined,
        iTax_id: null,
        fDiscount: 0
      }]
    });
  };

  const removeServiceField = (idx) => {
    const newServices = formData.services.filter((_, i) => i !== idx);
    setFormData({ ...formData, services: newServices });
  };

  // Calculate service total
  const calculateServiceTotal = (service) => {
    let subtotal = 0;
    
    if (service.iHours && service.fHourly_rate) {
      subtotal = service.iHours * service.fHourly_rate;
    } else {
      subtotal = (service.iQuantity || 1) * (service.fPrice || 0);
    }
    
    // Apply service discount
    const discountAmount = subtotal * ((service.fDiscount || 0) / 100);
    return subtotal - discountAmount;
  };

  // Calculate overall total
  const calculateTotal = () => {
    let subtotal = 0;
    
    formData.services.forEach(service => {
      subtotal += calculateServiceTotal(service);
    });
    
    // Apply overall discount
    const discountAmount = subtotal * ((formData.fDiscount || 0) / 100);
    return subtotal - discountAmount;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyInfo || !companyInfo.iCompany_id || !companyInfo.iCreated_by) {
      showPopup('Error', 'Company info missing.', 'error');
      return;
    }

    // Validate currency is selected
    if (!formData.icurrency_id) {
      showPopup('Error', 'Please select a currency.', 'error');
      return;
    }

    // Validate all service fields filled
    for (const service of formData.services) {
      if (!service.cService_name || !service.cDescription ||
        ((!service.iQuantity || !service.fPrice) &&
          (!service.iHours || !service.fHourly_rate))) {
        showPopup('Error', 'Please fill all service fields.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const servicesPayload = formData.services.map(s => {
      let o = {
        cService_name: s.cService_name,
        cDescription: s.cDescription,
        iTax_id: s.iTax_id ? parseInt(s.iTax_id) : null,
        fDiscount: s.fDiscount ? parseFloat(s.fDiscount) : 0
      };
      if (s.iHours && s.fHourly_rate) {
        o.iHours = parseInt(s.iHours);
        o.fHourly_rate = parseFloat(s.fHourly_rate);
      } else {
        o.iQuantity = parseInt(s.iQuantity || 1);
        o.fPrice = parseFloat(s.fPrice);
      }
      return o;
    });

    const payload = {
      iLead_id: parseInt(leadId),
      icomapany_id: companyInfo.iCompany_id,
      icurrency_id: parseInt(formData.icurrency_id),
      iCreated_by: companyInfo.iCreated_by,
      cGst: formData.cGst,
      fDiscount: parseFloat(formData.fDiscount) || 0,
      iDiscount_id: null,
      cTerms: formData.cTerms,
      termIds: formData.termIds,
      services: servicesPayload
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

      if (response.ok && (responseData.status === 201 || responseData.success)) {
        showPopup('Success', 'Quotation created successfully!', 'success');
        if (onQuotationCreated) onQuotationCreated(responseData.data);
        onClose();
        setFormData({
          dValid_until: getDefaultValidUntil(),
          cGst: '',
          icurrency_id: currencies.length > 0 ? currencies[0].icurrency_id : '',
          fDiscount: 0,
          cTerms: '',
          termIds: [],
          services: [{
            iservice_id: '',
            cService_name: '',
            cDescription: '',
            iQuantity: 1,
            fPrice: 0,
            iHours: undefined,
            fHourly_rate: undefined,
            iTax_id: null,
            fDiscount: 0
          }],
        });
      } else {
        throw new Error(responseData.message || 'Failed to create quotation');
      }
    } catch (err) {
      showPopup("Error", err.message || "Failed to create quotation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;
  if (!companyInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading company information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-t-lg flex justify-between items-center z-10 shadow-md">
          <div>
            <h2 className="text-2xl font-bold">Create New Quotation</h2>
            <p className="text-blue-100 text-sm mt-1">{leadData?.clead_name} <br></br>{leadData?.corganization}</p>
          </div>
          <button
            type="button"
            className="text-white hover:text-gray-200 transition p-1 rounded-full hover:bg-blue-700"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} id="quotation-form">
            {/* Quotation Details */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Quotation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="dValid_until" className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    id="dValid_until"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.dValid_until}
                    onChange={(e) => setFormData({ ...formData, dValid_until: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="icurrency_id" className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <select
                    id="icurrency_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.icurrency_id}
                    onChange={(e) => setFormData({ ...formData, icurrency_id: e.target.value })}
                    required
                  >
                    {currencies.length === 0 ? (
                      <option value="">Loading currencies...</option>
                    ) : (
                      currencies.map(currency => (
                        <option key={currency.icurrency_id} value={currency.icurrency_id}>
                          {currency.currency_code} ({currency.symbol})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="cGst" className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    id="cGst"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.cGst}
                    onChange={(e) => setFormData({ ...formData, cGst: e.target.value })}
                    placeholder="GSTIN12345"
                  />
                </div>
                <div>
                  <label htmlFor="fDiscount" className="block text-sm font-medium text-gray-700 mb-1">Overall Discount (%)</label>
                  <input
                    type="number"
                    id="fDiscount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.fDiscount}
                    onChange={(e) => setFormData({ ...formData, fDiscount: e.target.value })}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Services
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                  onClick={addServiceField}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Service
                </button>
              </div>
              <div className="space-y-4">
                {formData.services.map((service, idx) => (
                  <div key={idx} className="relative bg-gray-50 p-4 rounded-md border border-gray-200">
                    {formData.services.length > 1 && (
                      <button
                        type="button"
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 transition"
                        onClick={() => removeServiceField(idx)}
                        aria-label="Remove Service"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.iservice_id || ''}
                          onChange={e => handleServiceChange(idx, 'iservice_id', e.target.value)}
                          required
                        >
                          <option value="">Select Service</option>
                          {servicesList.map(s => (
                            <option key={s.iservice_id} value={s.iservice_id}>
                              {s.cservice_name.trim()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.iQuantity ?? ''}
                          onChange={e => handleServiceChange(idx, 'iQuantity', e.target.value)}
                          min="1"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.fPrice ?? ''}
                          onChange={e => handleServiceChange(idx, 'fPrice', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        {/* <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.iHours ?? ''}
                          onChange={e => handleServiceChange(idx, 'iHours', e.target.value)}
                          min="1"
                          step="1"
                        /> */}
                      </div>
                      <div>
                        {/* <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.fHourly_rate ?? ''}
                          onChange={e => handleServiceChange(idx, 'fHourly_rate', e.target.value)}
                          min="0"
                          step="0.01"
                        /> */}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.fDiscount ?? ''}
                          onChange={e => handleServiceChange(idx, 'fDiscount', e.target.value)}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.iTax_id || ''}
                          onChange={e => handleServiceChange(idx, 'iTax_id', e.target.value)}
                        >
                          <option value="">None</option>
                          {taxList.map(t => (
                            <option key={t.iTax_id} value={t.iTax_id}>
                              {t.cTax_name} ({t.fTax_rate}%)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={service.cDescription}
                          onChange={e => handleServiceChange(idx, 'cDescription', e.target.value)}
                          placeholder="Detailed description of the service"
                          required
                        ></textarea>
                      </div>
                      <div className="lg:col-span-4 bg-blue-50 p-2 rounded border border-blue-100">
                        <p className="text-sm text-blue-800 font-medium">
                          Service Total: {formData.icurrency_id && currencies.find(c => c.icurrency_id === parseInt(formData.icurrency_id))?.symbol || '$'}{calculateServiceTotal(service).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Terms & Conditions
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="termIds" className="block text-sm font-medium text-gray-700 mb-1">Standard Terms</label>
                  <select
                    id="termIds"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition h-32"
                    value={formData.termIds}
                    multiple
                    onChange={e => {
                      const selected = [...e.target.selectedOptions].map(opt => parseInt(opt.value));
                      setFormData({ ...formData, termIds: selected });
                    }}
                  >
                    <option value="">None</option>
                    {termsList.map(term => (
                      <option key={term.iTerm_id} value={term.iTerm_id}>
                        {term.cTerm_text}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple terms</p>
                </div>
                <div>
                  {/* <label htmlFor="cTerms" className="block text-sm font-medium text-gray-700 mb-1">Custom Terms</label>
                  <textarea
                    id="cTerms"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.cTerms}
                    onChange={e => setFormData({ ...formData, cTerms: e.target.value })}
                    placeholder="Enter any additional terms and conditions"
                  ></textarea> */}
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Quotation Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-gray-700">Subtotal:</p>
                <p className="text-sm font-medium text-right">
                  {formData.icurrency_id && currencies.find(c => c.icurrency_id === parseInt(formData.icurrency_id))?.symbol || '$'}
                  {calculateTotal().toFixed(2)}
                </p>
                <p className="text-sm text-gray-700">Overall Discount ({formData.fDiscount}%):</p>
                <p className="text-sm font-medium text-right text-red-600">
                  -{formData.icurrency_id && currencies.find(c => c.icurrency_id === parseInt(formData.icurrency_id))?.symbol || '$'}
                  {(calculateTotal() * (formData.fDiscount / 100)).toFixed(2)}
                </p>
                <div className="col-span-2 border-t border-blue-200 my-2 pt-2">
                  <p className="text-lg font-bold text-blue-800">Total Amount:</p>
                  <p className="text-2xl font-bold text-blue-800 text-right">
                    {formData.icurrency_id && currencies.find(c => c.icurrency_id === parseInt(formData.icurrency_id))?.symbol || '$'}
                    {(calculateTotal() * (1 - (formData.fDiscount / 100))).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-5 rounded-b-lg flex justify-between items-center z-10 border-t border-gray-200 shadow-md">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> indicates required fields
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="quotation-form"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : "Create Quotation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;