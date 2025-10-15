import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaPlus, FaTrashAlt, FaChevronDown, FaCheck } from 'react-icons/fa';
import PaymentAndDomainDetailsCombined from './mileStoneDetails';
import { ENDPOINTS } from "../../../../../api/constraints";

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
        className={`w-full border p-1 rounded text-left text-sm flex justify-between items-center transition ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-blue-400 focus:border-blue-400'
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
  // **New Field: unit**
  unit: 'numbers', // Default unit
  amount: 0,
};

const PostSalesForm = (passedData) => {
  const [step, setStep] = useState(1);
  const [submissionData, setSubmissionData] = useState({});
  const [services, setServices] = useState([initialServiceRow]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [finalClosedAmount, setFinalClosedAmount] = useState(0);
  const [masterServices, setMasterServices] = useState([]);
  const [masterSubservices, setMasterSubservices] = useState([]);
  
  // New state for dynamic currencies
  const [masterCurrencies, setMasterCurrencies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New fields
  const [proposalId, setProposalId] = useState('');
  // Set an initial empty string, will be updated to a default currency in useEffect
  const [currency, setCurrency] = useState(''); 

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
          // Fetch currency data
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

        // 1. Services
        const sortedServices = servicesData.data.sort((a, b) =>
          a.cservice_name.localeCompare(b.cservice_name)
        );
        setMasterServices(sortedServices);
        
        // 2. Subservices
        setMasterSubservices(subservicesData.data);

        // 3. Currencies (Dynamic)
        // Check for the correct nested structure
        const activeCurrencies = currencyData.data?.data?.filter(c => c.bactive) || [];
        setMasterCurrencies(activeCurrencies);

        // Set default currency to the first active one, or fall back to a code
        if (activeCurrencies.length > 0) {
          setCurrency(activeCurrencies[0].currency_code);
        } else {
            // Fallback if no active currencies are fetched
            setCurrency('USD'); 
        }

      } catch (err) {
        console.error("API Fetch Error:", err.message);
        setError(err.message || "Could not load master data (services/subservices/currencies).");
      } finally {
        setLoading(false);
        console.log("--- API Fetch complete. ---");
      }
    };

    fetchMasterData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleServiceChange = useCallback((index, name, value) => {
    setServices(prevServices => {
      const newServices = [...prevServices];
      let updatedRow = { ...newServices[index], [name]: value };

      if (name === 'serviceId') {
        updatedRow.subserviceIds = [];
        const selectedService = masterServices.find(s => s.iservice_id === value);
        updatedRow.serviceName = selectedService ? selectedService.cservice_name : '';
      }
      
      // 'unit' change doesn't affect amount, so no extra logic is needed for it.
      // It just updates the value in the row.

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
    const subTotal = services.reduce((sum, row) => sum + row.amount, 0);
    const subTotalNum = parseFloat(subTotal) || 0;

    let finalTaxableAmount = subTotalNum;
    let calculatedDiscountAmount = 0;
    let calculatedPercentage = 0;

    if (discountType === 'percentage') {
      const percentageValue = parseFloat(discountPercentage) || 0;
      calculatedDiscountAmount = subTotalNum * (percentageValue / 100);
      calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subTotalNum);
      finalTaxableAmount = subTotalNum - calculatedDiscountAmount;
      calculatedPercentage = subTotalNum > 0 ? (calculatedDiscountAmount / subTotalNum) * 100 : 0;

    } else {
      const closedAmountValue = parseFloat(finalClosedAmount) || 0;
      calculatedDiscountAmount = Math.max(0, subTotalNum - closedAmountValue);
      finalTaxableAmount = subTotalNum - calculatedDiscountAmount;
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
      setDiscountPercentage(value);
    } else {
      setFinalClosedAmount(value);
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
      subserviceIds: row.subserviceIds,
      unitPrice: parseFloat(row.unitPrice) || 0,
      quantity: parseFloat(row.quantity) || 0,
      // **Added unit to submission data**
      unit: row.unit,
      amount: parseFloat(row.amount.toFixed(2)) || 0,
    }));

    const hasUnselectedService = serviceItems.some(item => !item.serviceId);
    if (hasUnselectedService) {
      alert("Please select a Service for all rows.");
      return;
    }

    setSubmissionData({
      proposalId,
      currency,
      currencySymbol, // Pass symbol to the next component if needed
      items: serviceItems,
      totals: totals
    });

    console.log("Step 1 Data Saved and Moving to Step 2:", { proposalId, currency, items: serviceItems, totals: totals });
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
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
      <form
        onSubmit={handleNext}
        className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-full mx-auto max-h-[80vh] overflow-y-auto"
      >

        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-700">Step 1: Service Details</h2>

        {/* Proposal ID & Currency Fields */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Proposal ID <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={proposalId}
              onChange={e => setProposalId(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter Proposal ID"
              required
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Currency <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
              required
            >
              {/* Dynamic Currency Options */}
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
                  {/* **New Column Header for Unit** */}
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
                          options={subserviceOptions}
                          selectedValues={row.subserviceIds}
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
                       {/* **New Column Data for Unit Dropdown** */}
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
                        {displaySymbol}{row.amount.toFixed(2)}
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
            {/* Discount Input */}
            <div className="p-3 bg-yellow-50 rounded-lg shadow-inner">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {discountType === 'percentage' ? 'Discount Percentage' : 'Final Closed Amount'}
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
                    discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Discount (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
                    discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Closed Amount ({displaySymbol})
                </button>
              </div>
              {/* Discount Value Input */}
              <input
                type="number"
                min="0"
                max={discountType === 'amount' ? subTotal : 100}
                placeholder={getPlaceholder()}
                value={currentDiscountValue}
                onChange={handleDiscountInputChange}
                className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Total Discount Applied:</span>
                <span className="font-semibold text-red-600">
                  -{displaySymbol}{discountAmount} ({calculatedDiscountPercentage}%)
                </span>
              </div>
            </div>
            {/* Taxable Amount */}
            <div className="flex justify-between items-center text-md font-medium">
              <span className="text-gray-700">Taxable Amount:</span>
              <span className="text-gray-900 font-bold">{displaySymbol}{taxableAmount}</span>
            </div>

            {/* GST (18%) */}
            <div className="flex justify-between items-center text-md font-medium">
              <span className="text-gray-700">GST (18%):</span>
              <span className="text-green-600 font-bold">+ {displaySymbol}{gstAmount}</span>
            </div>

            {/* Final Total Balance */}
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
            Next: Payment Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostSalesForm;

