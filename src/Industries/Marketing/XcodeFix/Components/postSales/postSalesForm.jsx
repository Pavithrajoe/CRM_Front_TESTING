import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaPlus, FaTrashAlt, FaChevronDown, FaCheck } from 'react-icons/fa';
import MilestoneDetails from './MilestoneDetails'; 

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
        <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
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

const initialServiceRow = {
  serviceId: null,
  serviceName: '',
  subserviceIds: [],
  unitPrice: 0,
  quantity: 0,
  amount: 0,
};

const API_BASE_URL = "http://192.168.29.236:3000/api"; 

const PostSalesForm = () => {
  const [step, setStep] = useState(1); 
  const [submissionData, setSubmissionData] = useState({}); 
  const [services, setServices] = useState([initialServiceRow]);
  const [discountType, setDiscountType] = useState('percentage'); 
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [finalClosedAmount, setFinalClosedAmount] = useState(0);
  const [masterServices, setMasterServices] = useState([]);
  const [masterSubservices, setMasterSubservices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const [servicesRes, subservicesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/lead-service`, authHeaders),
          fetch(`${API_BASE_URL}/sub-service`, authHeaders)
        ]);

        if (!servicesRes.ok || !subservicesRes.ok) {
          if (servicesRes.status === 401 || subservicesRes.status === 401) {
            throw new Error("Token expired or invalid. Please log in again.");
          }
          throw new Error(`Failed to fetch master data. Status: ${servicesRes.status}/${subservicesRes.status}`);
        }

        const servicesData = await servicesRes.json();
        const subservicesData = await subservicesRes.json();
        
        console.log("Services API Response:", servicesData.data);
        console.log("Subservices API Response:", subservicesData.data);
        
        const sortedServices = servicesData.data.sort((a, b) => 
          a.cservice_name.localeCompare(b.cservice_name)
        );
        setMasterServices(sortedServices);
        setMasterSubservices(subservicesData.data);
        
      } catch (err) {
        console.error("API Fetch Error:", err.message);
        setError(err.message || "Could not load services/subservices.");
      } finally {
        setLoading(false);
        console.log("--- API Fetch complete. ---");
      }
    };

    fetchMasterData();
  }, []); 

  const handleServiceChange = useCallback((index, name, value) => {
    setServices(prevServices => {
      const newServices = [...prevServices];
      let updatedRow = { ...newServices[index], [name]: value };

      if (name === 'serviceId') {
          updatedRow.subserviceIds = [];
          const selectedService = masterServices.find(s => s.iservice_id === value);
          updatedRow.serviceName = selectedService ? selectedService.cservice_name : '';
      }

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
      amount: parseFloat(row.amount.toFixed(2)) || 0,
    }));
    
    const hasUnselectedService = serviceItems.some(item => !item.serviceId);
    if (hasUnselectedService) {
      alert("Please select a Service for all rows.");
      return;
    }

    setSubmissionData({
        items: serviceItems,
        totals: totals
    });
    
    console.log("Step 1 Data Saved and Moving to Step 2:", { items: serviceItems, totals: totals });
    setStep(2); 
  };
  const getPlaceholder = () => {
    if (discountType === 'percentage') {
      return `Enter % (Equivalent to $${discountAmount} off)`;
    } else {
      return `Enter Final Closed Amount (Max: $${subTotal})`; 
    }
  };

  if (loading) return <div className="text-center p-10 text-lg">Loading services...</div>;
  if (error) return <div className="text-center p-10 text-lg text-red-600">{error}</div>;

  if (step === 2) {
    return (
      <MilestoneDetails 
        serviceData={submissionData} 
        onBack={() => setStep(1)} 
        totalBalance={totalBalance} 
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

                      <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-800">
                        ${row.amount.toFixed(2)}
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
              <span className="text-gray-900 font-bold">${subTotal}</span>
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
                  Closed Amount ($)
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
                  -${discountAmount} ({calculatedDiscountPercentage}%)
                </span>
              </div>
            </div>
            
            {/* Taxable Amount */}
            <div className="flex justify-between items-center text-md font-medium">
              <span className="text-gray-700">Taxable Amount:</span>
              <span className="text-gray-900 font-bold">${taxableAmount}</span>
            </div>

            {/* GST (18%) */}
            <div className="flex justify-between items-center text-md font-medium">
              <span className="text-gray-700">GST (18%):</span>
              <span className="text-green-600 font-bold">+ ${gstAmount}</span>
            </div>

            {/* Final Total Balance */}
            <div className="flex justify-between items-center text-xl font-extrabold border-t-2 border-blue-700 pt-3 mt-3">
              <span className="text-blue-700">TOTAL BALANCE:</span>
              <span className="text-blue-700">${totalBalance}</span>
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


// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import { FaPlus, FaTrashAlt, FaChevronDown, FaCheck } from 'react-icons/fa';

// // --- MultiSelectDropdown Component ---
// const MultiSelectDropdown = ({ options, selectedValues, onChange, disabled }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   const toggleOption = (value) => {
//     let newSelection;
//     if (selectedValues.includes(value)) {
//       newSelection = selectedValues.filter(v => v !== value);
//     } else {
//       newSelection = [...selectedValues, value];
//     }
//     onChange(newSelection);
//   };

//   const displayLabel = selectedValues.length > 0 
//     ? selectedValues.map(v => options.find(o => o.id === v)?.name).join(', ')
//     : 'Select Subservices...';

//   return (
//     <div className="relative w-full">
//       <button
//         type="button"
//         onClick={() => !disabled && setIsOpen(!isOpen)}
//         className={`w-full border p-1 rounded text-left text-sm flex justify-between items-center transition ${
//           disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-blue-400 focus:border-blue-400'
//         }`}
//         disabled={disabled}
//       >
//         <span className="truncate">{displayLabel}</span>
//         <FaChevronDown className={`ml-2 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
//       </button>

//       {isOpen && !disabled && (
//         <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
//           {options.length > 0 ? (
//             options.map((option) => (
//               <div
//                 key={option.id}
//                 onClick={() => toggleOption(option.id)}
//                 className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
//               >
//                 <span>{option.name}</span>
//                 {selectedValues.includes(option.id) && <FaCheck className="text-blue-600" size={12} />}
//               </div>
//             ))
//           ) : (
//             <div className="px-3 py-2 text-sm text-gray-500">No subservices available.</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // Initial state for a single service row - Updated field names
// const initialServiceRow = {
//   serviceId: null,
//   serviceName: '',
//   subserviceIds: [],
//   unitPrice: 0,
//   quantity: 0,
//   amount: 0,
// };

// const API_BASE_URL = "http://192.168.29.236:3000/api"; // Base URL

// const PostSalesForm = () => {
//   const [services, setServices] = useState([initialServiceRow]);
//   // Renamed 'amount' to 'fixedAmount' for clarity, maintaining original 'percentage'
//   const [discountType, setDiscountType] = useState('percentage'); 
  
//   // State for the user-entered values
//   const [discountPercentage, setDiscountPercentage] = useState(0);
//   // *** NEW STATE: Stores the final amount the deal was closed at (or "Final Closed Amount") ***
//   const [finalClosedAmount, setFinalClosedAmount] = useState(0);

//   // API Data States
//   const [masterServices, setMasterServices] = useState([]);
//   const [masterSubservices, setMasterSubservices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // --- Data Fetching (Including Token) ---
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       setError("Authorization token is missing. Please log in.");
//       setLoading(false);
//       console.error("Token missing, aborting API fetch.");
//       return; 
//     }

//     console.log("--- Starting API data fetch with token... ---");
    
//     const authHeaders = {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     };

//     const fetchMasterData = async () => {
//       try {
//         const [servicesRes, subservicesRes] = await Promise.all([
//           fetch(`${API_BASE_URL}/lead-service`, authHeaders),
//           fetch(`${API_BASE_URL}/sub-service`, authHeaders)
//         ]);

//         if (!servicesRes.ok || !subservicesRes.ok) {
//           if (servicesRes.status === 401 || subservicesRes.status === 401) {
//             throw new Error("Token expired or invalid. Please log in again.");
//           }
//           throw new Error(`Failed to fetch master data. Status: ${servicesRes.status}/${subservicesRes.status}`);
//         }

//         const servicesData = await servicesRes.json();
//         const subservicesData = await subservicesRes.json();
        
//         console.log("Services API Response:", servicesData.data);
//         console.log("Subservices API Response:", subservicesData.data);
        
//         const sortedServices = servicesData.data.sort((a, b) => 
//           a.cservice_name.localeCompare(b.cservice_name)
//         );
//         setMasterServices(sortedServices);
//         setMasterSubservices(subservicesData.data);
        
//       } catch (err) {
//         console.error("API Fetch Error:", err.message);
//         setError(err.message || "Could not load services/subservices.");
//       } finally {
//         setLoading(false);
//         console.log("--- API Fetch complete. ---");
//       }
//     };

//     fetchMasterData();
//   }, []); 
//   // --- End Data Fetching ---

//   // --- Handlers for Service Table ---

//   const handleServiceChange = useCallback((index, name, value) => {
//     setServices(prevServices => {
//       const newServices = [...prevServices];
//       let updatedRow = { ...newServices[index], [name]: value };

//       if (name === 'serviceId') {
//           updatedRow.subserviceIds = [];
//           const selectedService = masterServices.find(s => s.iservice_id === value);
//           updatedRow.serviceName = selectedService ? selectedService.cservice_name : '';
//       }

//       if (name === 'quantity' || name === 'unitPrice') {
//         const quantity = parseFloat(updatedRow.quantity) || 0;
//         const unitPrice = parseFloat(updatedRow.unitPrice) || 0;
//         updatedRow.amount = quantity * unitPrice;
//       }

//       newServices[index] = updatedRow;
      
//       console.log(`Row ${index + 1} updated. Field: ${name}, Value:`, value);
//       console.log(`Row ${index + 1} new state:`, updatedRow);
      
//       return newServices;
//     });
//   }, [masterServices]);

//   const addServiceRow = () => {
//     setServices(prevServices => {
//       console.log("Adding new service row.");
//       return [...prevServices, { ...initialServiceRow }];
//     });
//   };

//   const removeServiceRow = (index) => {
//     setServices(prevServices => {
//       console.log(`Removing service row ${index + 1}.`);
//       return prevServices.filter((_, i) => i !== index);
//     });
//   };
  
//   const getSubserviceOptions = (serviceId) => {
//     if (!serviceId) return [];

//     return masterSubservices
//       .filter(sub => sub.iservice_parent === serviceId)
//       .map(sub => ({
//         id: sub.isubservice_id,
//         name: sub.subservice_name,
//       }));
//   };

//   // --- Calculations (Memoized for efficiency) ---
//   const { 
//     subTotal, 
//     discountAmount, 
//     taxableAmount, 
//     gstAmount, 
//     totalBalance, 
//     calculatedDiscountPercentage 
//   } = useMemo(() => {
//     const subTotal = services.reduce((sum, row) => sum + row.amount, 0);
//     const subTotalNum = parseFloat(subTotal) || 0;

//     let finalTaxableAmount = subTotalNum;
//     let calculatedDiscountAmount = 0;
//     let calculatedPercentage = 0;
    
//     // Logic for calculating discount based on the selected type
//     if (discountType === 'percentage') {
//         const percentageValue = parseFloat(discountPercentage) || 0;
        
//         calculatedDiscountAmount = subTotalNum * (percentageValue / 100);
        
//         // Ensure discount is not more than subTotal
//         calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subTotalNum);

//         finalTaxableAmount = subTotalNum - calculatedDiscountAmount;
//         calculatedPercentage = (calculatedDiscountAmount / subTotalNum) * 100; // Use actual discount amount
        
//     } else { // discountType is 'amount' (now interpreted as Final Closed Amount)
//         const closedAmountValue = parseFloat(finalClosedAmount) || 0;
        
//         // The user entered the final amount they closed the deal for (Taxable Amount)
//         // If closed amount is more than sub total, set discount to 0
//         calculatedDiscountAmount = Math.max(0, subTotalNum - closedAmountValue);
        
//         finalTaxableAmount = subTotalNum - calculatedDiscountAmount;
        
//         // The percentage is the discount (subTotal - closedAmount) as a percentage of subTotal
//         calculatedPercentage = subTotalNum > 0 
//             ? (calculatedDiscountAmount / subTotalNum) * 100 
//             : 0;
//     }

//     const GST_RATE = 0.18;
//     const gstAmount = finalTaxableAmount * GST_RATE;
//     const totalBalance = finalTaxableAmount + gstAmount;
    
//     console.log("Calculation Summary:", { 
//         subTotal: subTotalNum.toFixed(2), 
//         discountAmount: calculatedDiscountAmount.toFixed(2), 
//         totalBalance: totalBalance.toFixed(2),
//         calculatedPercentage: calculatedPercentage.toFixed(2)
//     });

//     return {
//       subTotal: subTotalNum.toFixed(2),
//       discountAmount: calculatedDiscountAmount.toFixed(2),
//       taxableAmount: finalTaxableAmount.toFixed(2),
//       gstAmount: gstAmount.toFixed(2),
//       totalBalance: totalBalance.toFixed(2),
//       calculatedDiscountPercentage: calculatedPercentage.toFixed(2)
//     };
//   }, [services, discountType, discountPercentage, finalClosedAmount]);
  
//   // --- Handlers for Discount Input ---
//   const handleDiscountInputChange = (e) => {
//     const value = e.target.value;
//     if (discountType === 'percentage') {
//         setDiscountPercentage(value);
//     } else {
//         // *** Store the entered value as the FINAL CLOSED AMOUNT ***
//         setFinalClosedAmount(value);
//     }
//   };

//   const currentDiscountValue = discountType === 'percentage' 
//     ? discountPercentage 
//     // Show the calculated taxable amount if 'amount' (Final Closed Amount) is selected,
//     // otherwise show the user's input of the finalClosedAmount.
//     : finalClosedAmount; 
    
//   // --- Submit Handler ---
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const submissionData = {
//         items: services.map(row => ({
//             serviceId: row.serviceId,
//             serviceName: row.serviceName,
//             subserviceIds: row.subserviceIds,
//             unitPrice: parseFloat(row.unitPrice) || 0,
//             quantity: parseFloat(row.quantity) || 0,
//             amount: parseFloat(row.amount.toFixed(2)) || 0,
//         })),
//         totals: {
//             subTotal: parseFloat(subTotal),
//             discountType,
//             // Submit the value that was actually entered (percentage or closed amount)
//             discountValue: parseFloat(currentDiscountValue) || 0, 
//             discountAmount: parseFloat(discountAmount),
//             discountPercentage: parseFloat(calculatedDiscountPercentage), 
//             taxableAmount: parseFloat(taxableAmount),
//             gstAmount: parseFloat(gstAmount),
//             totalBalance: parseFloat(totalBalance),
//             // Explicitly include the Final Closed Amount (Taxable Amount) for 'amount' type
//             finalClosedAmount: discountType === 'amount' ? parseFloat(currentDiscountValue) : parseFloat(taxableAmount),
//         }
//     };
    
//     console.log("=====================================");
//     console.log("FINAL POST SALES DATA SUBMISSION:");
//     console.log(submissionData);
//     console.log("=====================================");
    
//     alert(`Total Balance: ${totalBalance}`);
//   };

//   // Determine the placeholder text based on the selected type
//   const getPlaceholder = () => {
//     if (discountType === 'percentage') {
//         return `Enter % (Equivalent to $${discountAmount} off)`;
//     } else {
//         // Show the Sub Total as a reference for the max possible closed amount
//         return `Enter Final Closed Amount (Max: $${subTotal})`; 
//     }
//   };


//   // --- Render Component ---

//   if (loading) return <div className="text-center p-10 text-lg">Loading services...</div>;
//   if (error) return <div className="text-center p-10 text-lg text-red-600">{error}</div>;

//   return (
//     <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
//       <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-full mx-auto">
//         <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-700">Post Sales Details</h2>

//         {/* SERVICE TABLE (UNCHANGED) */}
//         <div className="mb-8">
//           <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-blue-50">
//                 <tr>
//                   <th className="sticky left-0 bg-blue-50 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">S.No.</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Service</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Subservice</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Unit Price</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Quantity</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Amount</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Action</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {services.map((row, index) => {
//                   const subserviceOptions = getSubserviceOptions(row.serviceId);
                  
//                   return (
//                     <tr key={index}>
//                       <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{index + 1}</td>
                      
//                       <td className="px-3 py-2">
//                         <select
//                           name="serviceId"
//                           value={row.serviceId || ''}
//                           onChange={(e) => handleServiceChange(index, e.target.name, parseInt(e.target.value))}
//                           className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
//                         >
//                           <option value="" disabled>Select Service</option>
//                           {masterServices.map((service) => (
//                             <option key={service.iservice_id} value={service.iservice_id}>
//                               {service.cservice_name}
//                             </option>
//                           ))}
//                         </select>
//                       </td>
                      
//                       <td className="px-3 py-2">
//                         <MultiSelectDropdown
//                           options={subserviceOptions}
//                           selectedValues={row.subserviceIds}
//                           onChange={(newIds) => handleServiceChange(index, 'subserviceIds', newIds)}
//                           disabled={!row.serviceId || subserviceOptions.length === 0}
//                         />
//                       </td>

//                       <td className="px-3 py-2">
//                         <input
//                           type="number"
//                           name="unitPrice"
//                           min="0"
//                           value={row.unitPrice}
//                           onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
//                           className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
//                         />
//                       </td>

//                       <td className="px-3 py-2">
//                         <input
//                           type="number"
//                           name="quantity"
//                           min="0"
//                           value={row.quantity}
//                           onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
//                           className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
//                         />
//                       </td>

//                       <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-800">
//                         ${row.amount.toFixed(2)}
//                       </td>

//                       <td className="px-3 py-2 text-center">
//                         <button
//                           type="button"
//                           onClick={() => removeServiceRow(index)}
//                           className="text-red-600 hover:text-red-900 disabled:opacity-50"
//                           disabled={services.length === 1}
//                           title="Remove Row"
//                         >
//                           <FaTrashAlt size={14} />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* Add Row Button */}
//           <button
//             type="button"
//             onClick={addServiceRow}
//             className="mt-3 flex items-center bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm shadow-md"
//           >
//             <FaPlus className="mr-2" /> Add Service Row
//           </button>
//         </div>

//         {/* SUMMARY & CALCULATION SECTION */}
//         <div className="flex justify-end">
//           <div className="w-full max-w-xs sm:max-w-sm space-y-3"> 
            
//             {/* Sub Total */}
//             <div className="flex justify-between items-center text-md font-medium border-t pt-3">
//               <span className="text-gray-700">Sub Total:</span>
//               <span className="text-gray-900 font-bold">${subTotal}</span>
//             </div>

//             {/* Discount Input */}
//             <div className="p-3 bg-yellow-50 rounded-lg shadow-inner">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 {discountType === 'percentage' ? 'Discount Percentage' : 'Final Closed Amount'}
//               </label>
              
//               <div className="flex gap-2 mb-2">
//                 <button
//                   type="button"
//                   onClick={() => setDiscountType('percentage')}
//                   className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
//                     discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                   }`}
//                 >
//                   Discount (%)
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setDiscountType('amount')}
//                   className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
//                     discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                   }`}
//                 >
//                   Closed Amount ($)
//                 </button>
//               </div>
              
//               {/* Discount Value Input */}
//               <input
//                 type="number"
//                 min="0"
//                 max={discountType === 'amount' ? subTotal : 100} // Cap Closed Amount at Sub Total, cap % at 100
//                 placeholder={getPlaceholder()}
//                 value={currentDiscountValue}
//                 onChange={handleDiscountInputChange}
//                 className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
//               />
              
//               <div className="flex justify-between mt-2 text-xs text-gray-600">
//                 <span>Total Discount Applied:</span>
//                 <span className="font-semibold text-red-600">
//                   -${discountAmount} ({calculatedDiscountPercentage}%)
//                 </span>
//               </div>
//             </div>
            
//             {/* Taxable Amount (Calculated based on discount or closed amount) */}
//             <div className="flex justify-between items-center text-md font-medium">
//               <span className="text-gray-700">Taxable Amount:</span>
//               <span className="text-gray-900 font-bold">${taxableAmount}</span>
//             </div>

//             {/* GST (18%) */}
//             <div className="flex justify-between items-center text-md font-medium">
//               <span className="text-gray-700">GST (18%):</span>
//               <span className="text-green-600 font-bold">+ ${gstAmount}</span>
//             </div>

//             {/* Final Total Balance */}
//             <div className="flex justify-between items-center text-xl font-extrabold border-t-2 border-blue-700 pt-3 mt-3">
//               <span className="text-blue-700">TOTAL BALANCE:</span>
//               <span className="text-blue-700">${totalBalance}</span>
//             </div>

//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="mt-8 text-center">
//           <button
//             type="submit"
//             className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-xl hover:bg-blue-800 transition text-lg font-semibold shadow-lg"
//           >
//             Finalize Post Sales
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default PostSalesForm;