import React, { useState, useMemo, useCallback } from "react";
import { FaPlus, FaTrashAlt, FaTag } from 'react-icons/fa'; // Added FaTag (optional, just good practice)

// Initial state for a single service row
const initialServiceRow = {
  service: '',
  subservice: '',
  noOfPages: 0,
  defaultAmt: 0, // This is the amount per unit/page
  actualAmount: 0, // Calculated: noOfPages * defaultAmt
};

const PostSalesForm = () => {
  const [services, setServices] = useState([initialServiceRow]);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
  const [discountValue, setDiscountValue] = useState(0);

  // --- Handlers for Service Table ---

  const handleServiceChange = useCallback((index, name, value) => {
    setServices(prevServices => {
      const newServices = [...prevServices];
      const row = newServices[index];
      
      // Update the specific field
      let updatedRow = { ...row, [name]: value };

      // Recalculate actualAmount if noOfPages or defaultAmt changes
      if (name === 'noOfPages' || name === 'defaultAmt') {
        const noOfPages = parseFloat(updatedRow.noOfPages) || 0;
        const defaultAmt = parseFloat(updatedRow.defaultAmt) || 0;
        updatedRow.actualAmount = noOfPages * defaultAmt;
      }

      newServices[index] = updatedRow;
      return newServices;
    });
  }, []);

  const addServiceRow = () => {
    setServices(prevServices => [...prevServices, { ...initialServiceRow }]);
  };

  const removeServiceRow = (index) => {
    setServices(prevServices => prevServices.filter((_, i) => i !== index));
  };

  // --- Calculations (Memoized for efficiency) ---

  const { subTotal, discountAmount, taxableAmount, gstAmount, totalBalance } = useMemo(() => {
    // 1. Calculate Sub Total (Sum of all actual amounts)
    const subTotal = services.reduce((sum, row) => sum + row.actualAmount, 0);

    // 2. Calculate Discount Amount
    let calculatedDiscountAmount = 0;
    const value = parseFloat(discountValue) || 0;

    if (discountType === 'percentage') {
      calculatedDiscountAmount = subTotal * (value / 100);
    } else if (discountType === 'amount') {
      calculatedDiscountAmount = value;
    }
    // Ensure discount doesn't exceed subTotal
    calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subTotal);

    // 3. Calculate Taxable Amount (Sub Total - Discount)
    const taxableAmount = subTotal - calculatedDiscountAmount;

    // 4. Calculate GST (18% of Taxable Amount)
    const GST_RATE = 0.18;
    const gstAmount = taxableAmount * GST_RATE;

    // 5. Calculate Total Balance (Taxable Amount + GST Amount)
    const totalBalance = taxableAmount + gstAmount;

    return {
      subTotal: subTotal.toFixed(2),
      discountAmount: calculatedDiscountAmount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalBalance: totalBalance.toFixed(2),
    };
  }, [services, discountType, discountValue]);


  // --- Submit Handler ---

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      services,
      subTotal,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      discountAmount,
      taxableAmount,
      gstAmount,
      totalBalance,
    };
    console.log("Post Sales Data Submitted:", data);
    alert(`Total Balance: ${totalBalance}`);
    // You would integrate your actual API call here
  };

  // --- Render Component ---

  return (
    // Outer container ensures vertical scrolling for the whole page/modal content
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen max-h-screen overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-700">Post Sales Details</h2>

        {/* SERVICE TABLE */}
        <div className="mb-8">
          {/* This class ensures horizontal scroll on small screens */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="sticky left-0 bg-blue-50 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">S.No.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">Service</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">Subservice</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">No. of Pages</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Default Amt</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Actual Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((row, index) => (
                  <tr key={index}>
                    <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{index + 1}</td>
                    
                    {/* Service Input */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="service"
                        value={row.service}
                        onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                        className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                        placeholder="e.g. Design"
                      />
                    </td>
                    
                    {/* Subservice Input */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="subservice"
                        value={row.subservice}
                        onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                        className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                        placeholder="e.g. Logo"
                      />
                    </td>

                    {/* No. of Pages Input */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="noOfPages"
                        min="0"
                        value={row.noOfPages}
                        onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                        className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                      />
                    </td>

                    {/* Default Amount Input */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="defaultAmt"
                        min="0"
                        value={row.defaultAmt}
                        onChange={(e) => handleServiceChange(index, e.target.name, e.target.value)}
                        className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                      />
                    </td>

                    {/* Actual Amount (Calculated) */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-800">
                      ${row.actualAmount.toFixed(2)}
                    </td>

                    {/* Action Button (Remove) */}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={addServiceRow}
            className="mt-3 flex items-center bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm shadow-md"
          >
            <FaPlus className="mr-2" /> Add Service
          </button>
        </div>

        {/* SUMMARY & CALCULATION SECTION */}
        {/* Changed justify-end to flex-col on small screens for better stacking */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs sm:max-w-sm space-y-3"> 
            
            {/* Sub Total */}
            <div className="flex justify-between items-center text-md font-medium border-t pt-3">
              <span className="text-gray-700">Sub Total:</span>
              <span className="text-gray-900 font-bold">${subTotal}</span>
            </div>

            {/* Discount Input */}
            <div className="p-3 bg-yellow-50 rounded-lg shadow-inner">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount:</label>
              <div className="flex gap-2 mb-2">
                {/* Discount Percentage Button */}
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
                    discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Percentage (%)
                </button>
                {/* Discount Fixed Amount Button */}
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 px-3 py-1 text-xs rounded-full transition ${
                    discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fixed Amount ($)
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder={discountType === 'percentage' ? "e.g., 10" : "e.g., 100"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Discount Applied:</span>
                <span className="font-semibold text-red-600">-${discountAmount}</span>
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

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-xl hover:bg-blue-800 transition text-lg font-semibold shadow-lg"
          >
            Finalize Post Sales
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostSalesForm;