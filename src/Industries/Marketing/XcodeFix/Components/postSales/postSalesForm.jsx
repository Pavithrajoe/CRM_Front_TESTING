import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaPlus, FaTrashAlt, FaChevronDown, FaCheck } from 'react-icons/fa';
import PaymentAndDomainDetailsCombined from './mileStoneDetails';
import { ENDPOINTS } from "../../../../../api/constraints";
import axios from 'axios';


const MultiSelectDropdown = ({ options, selectedValues, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOption = (value) => {
    let newSelection;
    if (selectedValues.includes(value)) {
      newSelection = selectedValues.filter(v => v !== value);
    } else {
      newSelection = [...selectedValues, value];
    }
    onChange(newSelection);
  };

  const displayLabel = selectedValues.length > 0
    ? selectedValues.map(v => options.find(o => o.id === v)?.name).join(', ')
    : 'Select Subservices...';

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border p-1 rounded text-left text-sm flex justify-between items-center transition ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-blue-400 focus:border-blue-400'
          }`}
        disabled={disabled}
      >
        <span className="truncate">{displayLabel}</span>
        <FaChevronDown className={`ml-2 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-1 w-max min-w-full rounded-md bg-white shadow-2xl border border-gray-200 max-h-48 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
              >
                <span>{option.name}</span>
                {selectedValues.includes(option.id) && <FaCheck className="text-blue-600" size={12} />}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No subservices available.</div>
          )}
        </div>
      )}
    </div>
  );
};

// **UNIT OPTIONS ARRAY (New Constant)**
const UNIT_OPTIONS = [
  { id: 'numbers', name: 'Numbers' },
  { id: 'months', name: 'Months' },
  { id: 'pages', name: 'Pages' },
];

const initialServiceRow = {
  serviceId: null,
  serviceName: '',
  subserviceIds: [],
  unitPrice: 0,
  quantity: 0,
  unit: 'numbers',
  amount: 0,
};

const PostSalesForm = (passedData, isRecurring) => {
  const [step, setStep] = useState(1);
  const [submissionData, setSubmissionData] = useState({});
  const [services, setServices] = useState([initialServiceRow]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [finalClosedAmount, setFinalClosedAmount] = useState(0);
  const [masterServices, setMasterServices] = useState([]);
  const [masterSubservices, setMasterSubservices] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(null); // data from history row
  const [isEditing, setIsEditing] = useState(false); // controls read-only vs editable
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'history' | 'view'
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // New state for dynamic currencies
  const [masterCurrencies, setMasterCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // New fields
  const [proposalId, setProposalId] = useState('');
  const [currency, setCurrency] = useState('');
  //payment method 
  const [paymentMethod, setPaymentMethod] = useState('');
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authorization token is missing. Please log in.");
      setLoading(false);
      console.error("Token missing, aborting API fetch.");
      return;
    }
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const fetchMasterData = async () => {
      try {
        const [servicesRes, subservicesRes, currencyRes] = await Promise.all([
          fetch(ENDPOINTS.MASTER_SERVICE_GET, authHeaders),
          fetch(ENDPOINTS.SUB_SERVICE, authHeaders),
          fetch(ENDPOINTS.CURRENCY, authHeaders)
        ]);

        // --- Error Handling ---
        if (!servicesRes.ok || !subservicesRes.ok || !currencyRes.ok) {
          const status = `Services: ${servicesRes.status}, Subservices: ${subservicesRes.status}, Currency: ${currencyRes.status}`;
          if (servicesRes.status === 401 || subservicesRes.status === 401 || currencyRes.status === 401) {
            throw new Error("Token expired or invalid. Please log in again.");
          }
          throw new Error(`Failed to fetch master data. Status: ${status}`);
        }

        // --- Data Processing ---
        const servicesData = await servicesRes.json();
        const subservicesData = await subservicesRes.json();
        const currencyData = await currencyRes.json();

        //  Services
        const sortedServices = servicesData.data.sort((a, b) =>
          a.cservice_name.localeCompare(b.cservice_name)
        );
        setMasterServices(sortedServices);

        //  Subservices
        setMasterSubservices(subservicesData.data);

        //  Currencies
        const activeCurrencies = currencyData.data?.data?.filter(c => c.bactive) || [];
        setMasterCurrencies(activeCurrencies);

        // Set default currency to the first active one, or fall back to a code
        if (activeCurrencies.length > 0) {
          setCurrency(activeCurrencies[0].currency_code);
        } else {
          setCurrency('USD');
        }

      } catch (err) {
        console.error("API Fetch Error:", err.message);
        setError(err.message || "Could not load master data (services/subservices/currencies).");
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleServiceChange = useCallback((index, name, value) => {
    setServices(prevServices => {
      const newServices = [...prevServices];
      let updatedRow = { ...newServices[index], [name]: value };

      if (name === 'serviceId') {
        // Reset subservices when service changes
        updatedRow.subserviceIds = [];
        const selectedService = masterServices.find(s => s.iservice_id === value);
        updatedRow.serviceName = selectedService ? selectedService.cservice_name : '';
      }

      // Calculate amount if unitPrice or quantity changes
      if (name === 'quantity' || name === 'unitPrice') {
        const quantity = parseFloat(updatedRow.quantity) || 0;
        const unitPrice = parseFloat(updatedRow.unitPrice) || 0;
        updatedRow.amount = quantity * unitPrice;
      }

      newServices[index] = updatedRow;
      return newServices;
    });
  }, [masterServices]);

  const addServiceRow = () => {
    setServices(prevServices => [...prevServices, { ...initialServiceRow }]);
  };

  const removeServiceRow = (index) => {
    setServices(prevServices => prevServices.filter((_, i) => i !== index));
  };

  const getSubserviceOptions = (serviceId) => {
    if (!serviceId) return [];
    return masterSubservices
      .filter(sub => sub.iservice_parent === serviceId)
      .map(sub => ({
        id: sub.isubservice_id,
        name: sub.subservice_name,
      }));
  };

  const {
    subTotal,
    discountAmount,
    taxableAmount,
    gstAmount,
    totalBalance,
    calculatedDiscountPercentage
  } = useMemo(() => {
    const subTotal = services.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const subTotalNum = parseFloat(subTotal) || 0;

    let finalTaxableAmount = subTotalNum;
    let calculatedDiscountAmount = 0;
    let calculatedPercentage = 0;

    // NOTE: The current API response implies the discount is a percentage
    // We will honor the form's dual logic (percentage/amount) for new proposals,
    // but for editing, we'll try to infer the type or assume percentage if it's the `discount` field.

    if (discountType === 'percentage') {
      const percentageValue = parseFloat(discountPercentage) || 0;
      calculatedDiscountAmount = subTotalNum * (percentageValue / 100);
      calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subTotalNum);
      finalTaxableAmount = subTotalNum - calculatedDiscountAmount;
      calculatedPercentage = subTotalNum > 0 ? (calculatedDiscountAmount / subTotalNum) * 100 : 0;

    } else {
      const closedAmountValue = parseFloat(finalClosedAmount) || 0;

      // FinalTaxableAmount is the Closed Amount in this mode
      finalTaxableAmount = Math.min(closedAmountValue, subTotalNum);
      calculatedDiscountAmount = Math.max(0, subTotalNum - finalTaxableAmount);

      calculatedPercentage = subTotalNum > 0
        ? (calculatedDiscountAmount / subTotalNum) * 100
        : 0;
    }

    const GST_RATE = 0.18;
    const gstAmount = finalTaxableAmount * GST_RATE;
    const totalBalance = finalTaxableAmount + gstAmount;

    return {
      subTotal: subTotalNum.toFixed(2),
      discountAmount: calculatedDiscountAmount.toFixed(2),
      taxableAmount: finalTaxableAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalBalance: totalBalance.toFixed(2),
      calculatedDiscountPercentage: calculatedPercentage.toFixed(2)
    };
  }, [services, discountType, discountPercentage, finalClosedAmount]);

  const handleDiscountInputChange = (e) => {
    const value = e.target.value;
    if (discountType === 'percentage') {
      // Clamp percentage between 0 and 100
      const numValue = Math.min(100, Math.max(0, parseFloat(value) || 0));
      setDiscountPercentage(numValue.toString());
    } else {
      // Clamp closed amount between 0 and subTotal
      const subTotalNum = parseFloat(subTotal) || 0;
      const numValue = Math.min(subTotalNum, Math.max(0, parseFloat(value) || 0));
      setFinalClosedAmount(numValue.toString());
    }
  };

  const currentDiscountValue = discountType === 'percentage'
    ? discountPercentage
    : finalClosedAmount;

  const handleNext = (e) => {
    e.preventDefault();

    // Find the symbol for the selected currency
    const selectedCurrency = masterCurrencies.find(c => c.currency_code === currency);
    const currencySymbol = selectedCurrency ? selectedCurrency.symbol : '$';

    // Simple validation for currency
    if (!currency) {
      alert("Please select a valid currency.");
      return;
    }
    if (!proposalId) {
      alert("Please enter a Proposal ID.");
      return;
    }
    const hasUnselectedService = services.some(item => !item.serviceId);
    if (hasUnselectedService) {
      alert("Please select a Service for all rows.");
      return;
    }


    const totals = {
      subTotal: parseFloat(subTotal),
      discountType,
      discountValue: parseFloat(currentDiscountValue) || 0,
      discountAmount: parseFloat(discountAmount),
      discountPercentage: parseFloat(calculatedDiscountPercentage),
      taxableAmount: parseFloat(taxableAmount),
      gstAmount: parseFloat(gstAmount),
      totalBalance: parseFloat(totalBalance),
      finalClosedAmount: discountType === 'amount' ? parseFloat(currentDiscountValue) : parseFloat(taxableAmount),
    };

    const serviceItems = services.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      // Subservices are stored as an array of IDs
      subserviceIds: row.subserviceIds,
      unitPrice: parseFloat(row.unitPrice) || 0,
      quantity: parseFloat(row.quantity) || 0,
      unit: row.unit,
      amount: parseFloat(row.amount.toFixed(2)) || 0,
    }));


    setSubmissionData({
      proposalId,
      paymentMethod,
      currency,
      currencySymbol, // Pass symbol to the next component if needed
      items: serviceItems,
      totals: totals
    });

    setStep(2);
  };

  const getPlaceholder = () => {
    const symbol = masterCurrencies.find(c => c.currency_code === currency)?.symbol || '$';
    if (discountType === 'percentage') {
      return `Enter % (Equivalent to ${symbol}${discountAmount} off)`;
    } else {
      return `Enter Final Closed Amount (Max: ${symbol}${subTotal})`;
    }
  };

  // Get the symbol for display in the table/summary
  const displaySymbol = masterCurrencies.find(c => c.currency_code === currency)?.symbol || '$';

  // Function to fecth the service history agaist an lead id  
  const fetchServiceHistory = async () => {
    if (!passedData.leadId) return;

    setLoadingHistory(true);

    try {
      const response = await axios.get(`${ENDPOINTS.GET_SERVICE_HISTORY}/${passedData.leadId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setServiceHistory(response.data.data);
    } catch (err) {
      console.error("Error fetching service history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };


  // Map history data to form state **
  const mapHistoryToForm = useCallback((historyItem) => {
    const newServices = historyItem.services.map(s => {
      const serviceObj = masterServices.find(ms => ms.iservice_id === s.serviceId);

      return {
        serviceId: s.serviceId,
        serviceName: serviceObj ? serviceObj.cservice_name : `Service ${s.serviceId}`,
        subserviceIds: s.subServiceId ? [s.subServiceId] : [],
        unitPrice: s.unitPrice,
        quantity: s.quantity,
        unit: UNIT_OPTIONS.find(u => u.name.toLowerCase() === s.unit?.toLowerCase())?.id || UNIT_OPTIONS.find(u => u.id === s.unit?.toLowerCase())?.id || 'numbers',
        amount: s.amount,
      };
    });

    // Calculate subTotal from the mapped services
    const subTotalFromHistory = newServices.reduce((sum, row) => sum + row.amount, 0);

    // We will stick to the percentage discount field from the API for simplicity
    const discountPercent = historyItem.discount || 0;
    const closedAmount = subTotalFromHistory * (1 - (discountPercent / 100));

    // Set all states
    setServices(newServices.length > 0 ? newServices : [initialServiceRow]);
    setProposalId(historyItem.proposalId);
    setCurrency(historyItem.currency?.code || '');
    setDiscountType('percentage');
    setDiscountPercentage(discountPercent.toString());
    setFinalClosedAmount(closedAmount.toFixed(2).toString());

    // Also set currentFormData to enable 'New Proposal' button
    setCurrentFormData(historyItem);
    setIsEditing(true);
    setViewMode('form');

  }, [masterServices]);


  // Wait for all master data to load
  if (loading) return <div className="text-center p-10 text-lg">Loading master data...</div>;
  if (error) return <div className="text-center p-10 text-lg text-red-600">{error}</div>;

  if (step === 2) {
    return (
      <PaymentAndDomainDetailsCombined
        serviceData={submissionData}
        onBack={() => setStep(1)}
        totalBalance={totalBalance}
        currencySymbol={displaySymbol}
        leadId={passedData.leadId}
        isRecurring={isRecurring.isRecurring}
      />
    );
  }


  return (
    <div className="p-4 sm:p-6 bg-transparent min-h-full">
      {viewMode === 'history' ? (
        //  HISTORY VIEW
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl w-full mx-auto max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-blue-700 uppercase mb-4">
              Service History
            </h3>
            <button
              onClick={() => setViewMode('form')}
              className="text-red-600 font-bold hover:text-red-800"
            >
              Back
            </button>
          </div>

          {loadingHistory ? (
            <p>Loading...</p>
          ) : serviceHistory.length === 0 ? (
            <p>No history available for this lead.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proposal ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment phases</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Offer percentage</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {serviceHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.proposalId}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.projectValue}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.paymentPhases}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.discount} %</td>
                    <td className="px-3 py-2 text-sm text-gray-900 space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={async () => {
                          setSelectedHistoryItem(item);
                          setViewMode('view');
                        }}
                      >
                        View
                        {/* /Edit */}

                      </button>
                    </td>
                    <td style={{ color: item.bactive ? 'red' : 'green', fontWeight: 'bold' }}> {item.bactive ? 'Not Completed' : 'Completed'} </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )

        : viewMode === 'view' ? (

          <ServiceHistoryView
            historyData={selectedHistoryItem}
            onBack={() => setViewMode('history')}
            onEdit={() => {
              mapHistoryToForm(selectedHistoryItem);
            }}
          />
        )
          : (
            <form
              onSubmit={handleNext}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-full mx-auto max-h-[80vh] overflow-y-auto"
            >
              {/* Header & Service History Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
                  {isEditing ? 'Edit Service Details' : 'Step 1: Service Details'}
                </h2>
                <div className="flex gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentFormData(null);
                        setIsEditing(false);
                        setServices([initialServiceRow]);
                        setProposalId('');
                        setDiscountPercentage(0);
                        setFinalClosedAmount(0);
                        setDiscountType('percentage');
                        setCurrency(masterCurrencies[0]?.currency_code || 'USD');
                        setViewMode('form');
                      }}
                      className="bg-gray-500 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg shadow-md"
                    >
                      New Proposal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('history');
                      fetchServiceHistory();
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow-md"
                  >
                    View Service History
                  </button>
                </div>
              </div>

              {/* Proposal ID & Currency */}
              <div className="flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Proposal ID <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={proposalId}
                    onChange={(e) => setProposalId(e.target.value)}
                    className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Enter Proposal ID"
                    required
                  />
                </div>
                {/* Currency selection  */}
                <div className="flex flex-col flex-1 min-w-[180px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Currency <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                    required
                  >
                    {masterCurrencies.length === 0 ? (
                      <option value="" disabled>No Currencies Available</option>
                    ) : (
                      <>
                        <option value="" disabled>Select Currency</option>
                        {masterCurrencies.map((c) => (
                          <option key={c.icurrency_id} value={c.currency_code}>
                            {c.currency_code} - {c.symbol} ({c.currency_name})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                {/* Payment method field */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                    <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                    required
                  >
                    <option value="" disabled>Select Payment Method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="case">Case</option>
                  </select>
                </div>
              </div>

              {/* SERVICE TABLE */}
              <div className="mb-8">
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="sticky left-0 bg-blue-50 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">S.No.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Service</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Subservice</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Quantity</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Unit</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {services.map((row, index) => {
                        const subserviceOptions = getSubserviceOptions(row.serviceId);


                        return (
                          <tr key={index}>
                            <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{index + 1}</td>
                            <td className="px-3 py-2">
                              <select
                                name="serviceId"
                                value={row.serviceId || ''}
                                onChange={(e) => handleServiceChange(index, e.target.name, parseInt(e.target.value))}
                                className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                              >
                                <option value="" disabled>Select Service</option>
                                {masterServices.map((service) => (
                                  <option key={service.iservice_id} value={service.iservice_id}>
                                    {service.cservice_name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <MultiSelectDropdown
                                options={subserviceOptions || []}
                                selectedValues={row.subserviceIds || []}
                                onChange={(newIds) => handleServiceChange(index, 'subserviceIds', newIds)}
                                disabled={!row.serviceId || subserviceOptions.length === 0}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                name="unitPrice"
                                min="0"
                                value={row.unitPrice}
                                onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                                className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                name="quantity"
                                min="0"
                                value={row.quantity}
                                onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                                className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                name="unit"
                                value={row.unit}
                                onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                                className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                              >
                                {UNIT_OPTIONS.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-800">
                              {displaySymbol}{row.amount?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeServiceRow(index)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                disabled={services.length === 1}
                                title="Remove Row"
                              >
                                <FaTrashAlt size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Button */}
                <button
                  type="button"
                  onClick={addServiceRow}
                  className="mt-3 flex items-center bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm shadow-md"
                >
                  <FaPlus className="mr-2" /> Add Service Row
                </button>
              </div>

              {/* SUMMARY & CALCULATION SECTION */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs sm:max-w-sm space-y-3">
                  {/* Sub Total */}
                  <div className="flex justify-between items-center text-md font-medium border-t pt-3">
                    <span className="text-gray-700">Sub Total:</span>
                    <span className="text-gray-900 font-bold">{displaySymbol}{subTotal}</span>

                  </div>

                  {/* Discount Section */}
                  <div className="p-3 bg-yellow-50 rounded-lg shadow-inner">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {discountType === 'percentage' ? 'Offer Percentage' : 'Final Closed Amount'}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`flex-1 px-3 py-1 text-xs rounded-full transition ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        Offer (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('amount')}
                        className={`flex-1 px-3 py-1 text-xs rounded-full transition ${discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        Closed Amount ({displaySymbol})
                      </button>
                    </div>
                    {/* Discount Input */}
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'amount' ? subTotal : 100}
                      step={discountType === 'percentage' ? "0.01" : "any"}
                      placeholder={getPlaceholder()}
                      value={currentDiscountValue}
                      onChange={handleDiscountInputChange}
                      className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>Total Offer Applied:</span>
                      <span className="font-semibold text-red-600">
                        -{displaySymbol}{discountAmount} ({calculatedDiscountPercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Tax & Total */}
                  <div className="flex justify-between items-center text-md font-medium">
                    <span className="text-gray-700">Taxable Amount:</span>
                    <span className="text-gray-900 font-bold">{displaySymbol}{taxableAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-md font-medium">
                    <span className="text-gray-700">GST (18%):</span>
                    <span className="text-green-600 font-bold">+ {displaySymbol}{gstAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-extrabold border-t-2 border-blue-700 pt-3 mt-3">
                    <span className="text-blue-700">TOTAL BALANCE:</span>
                    <span className="text-blue-700">{displaySymbol}{totalBalance}</span>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="mt-8 text-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-xl hover:bg-blue-800 transition text-lg font-semibold shadow-lg"
                >
                  {isEditing ? 'Update & Continue' : 'Next: Payment Details'}
                </button>
              </div>
            </form>
          )}
    </div>
  );
};



const ServiceHistoryView = ({ historyData, onBack, onEdit }) => {
  if (!historyData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency) => {
    const currencyCode = currency?.code || 'USD';
    if (amount === null || amount === undefined) return '-';

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (e) {
      console.error("Currency formatting error:", e);
      return `${currencyCode} ${amount}`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">Service Proposal Details</h2>
          <p className="text-gray-600 text-sm mt-1">Proposal ID: {historyData.proposalId}</p>
        </div>
        <div className="flex gap-3">
          {/*           <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            Edit Proposal
          </button> */}
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            Back to History
          </button>
        </div>

      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Project Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Project Value:</span>
              <span className="font-semibold">
                {formatCurrency(historyData.projectValue, historyData.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offer:</span>
              <span className="font-semibold text-red-600">{historyData.discount}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Duration:</span>
              <span className="font-semibold">{historyData.projectDuration} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Phases:</span>
              <span className="font-semibold">{historyData.paymentPhases}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currency:</span>
              <span className="font-semibold">
                {historyData.currency?.code || 'N/A'} - {historyData.currency?.currency_name || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Client Domain Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Domain Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Domain Name:</span>
              <span className="font-semibold">{historyData.clientDomain?.domainName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Own Domain:</span>
              <span className="font-semibold">
                {historyData.clientDomain?.ownDomain === true ? 'Yes' : historyData.clientDomain?.ownDomain === false ? 'No' : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Date:</span>
              <span className="font-semibold">
                {formatDate(historyData.clientDomain?.registerDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Date:</span>
              <span className="font-semibold">
                {formatDate(historyData.clientDomain?.renewalDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Services</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subservice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyData.services?.map((service, index) => (
                <tr key={service.id || index}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Service #{service.serviceId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Subservice #{service.subServiceId || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(service.unitPrice, historyData.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{service.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{service.unit || '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(service.amount, historyData.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Milestones */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Payment Milestones</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyData.milestones?.map((milestone, index) => (
                <tr key={milestone.id} className={milestone.actualAmount ? 'bg-green-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Milestone {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(milestone.expectedMilestoneDate)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(milestone.expectedAmount, historyData.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {milestone.actualMilestoneDate ? formatDate(milestone.actualMilestoneDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {milestone.actualAmount ? formatCurrency(milestone.actualAmount, historyData.currency) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${milestone.actualAmount
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {milestone.actualAmount ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {milestone.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms and Conditions */}
      {historyData.paymentTermsAndConditions && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-lg">Terms & Conditions</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 text-sm leading-relaxed">
              {historyData.paymentTermsAndConditions}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-3 text-lg">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(historyData.projectValue, historyData.currency)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {historyData.discount}%
            </div>
            <div className="text-sm text-gray-600">Discount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {historyData.paymentPhases}
            </div>
            <div className="text-sm text-gray-600">Payment Phases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {historyData.projectDuration}
            </div>
            <div className="text-sm text-gray-600">Months Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSalesForm;

