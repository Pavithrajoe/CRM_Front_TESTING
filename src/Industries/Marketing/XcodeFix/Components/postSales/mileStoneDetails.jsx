import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ENDPOINTS } from "../../../../../api/constraints"; // Assuming correct path

// Helper function to format date objects to YYYY-MM-DD string
const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
        // Handle ISO string from API (e.g., "2025-10-15T00:00:00.000Z")
        return date.split('T')[0];
    }
    // Handle Date object
    return date.toISOString().split('T')[0];
};

// **Updated Component for Step 2**
const PaymentAndDomainDetailsCombined = ({ serviceData, onBack, totalBalance, currencySymbol, leadId, initialData }) => {
    // State for Project Duration
    const [projectDuration, setProjectDuration] = useState(initialData.projectDuration || 6);

    // State for Domain Details
    const [domainName, setDomainName] = useState(initialData.clientDomain?.domainName || '');
    const [ownDomain, setOwnDomain] = useState(initialData.clientDomain?.ownDomain === false ? 'no' : 'yes'); // 'yes' or 'no'
    const [registerDate, setRegisterDate] = useState(formatDate(initialData.clientDomain?.registerDate));
    const [renewalDate, setRenewalDate] = useState(formatDate(initialData.clientDomain?.renewalDate));

    // State for Payment Details
    const [paymentPhases, setPaymentPhases] = useState(initialData.paymentPhases || '3'); // '2', '3', '4'
    const [paymentTermsAndConditions, setPaymentTermsAndConditions] = useState(initialData.paymentTermsAndConditions || '');

    // State for Milestones
    const initialMilestones = useMemo(() => {
        if (initialData.milestones && initialData.milestones.length > 0) {
            // Map historical milestones to our state structure
            return initialData.milestones.map((m, index) => ({
                id: m.id, // Keep the history ID for update API
                expectedAmount: m.expectedAmount,
                expectedMilestoneDate: formatDate(m.expectedMilestoneDate),
                name: `Milestone ${index + 1}`, // Generate name based on index
                // Keep actual fields from history item if needed for viewing/context
                actualAmount: m.actualAmount || 0,
                actualMilestoneDate: m.actualMilestoneDate,
            }));
        }
        return [];
    }, [initialData.milestones]);

    const [milestones, setMilestones] = useState(initialMilestones);
    const [isEditingExistingProposal] = useState(initialData.isEditingExisting || false);
    const [originalProposalId] = useState(initialData.proposalId); // Keep ID for update

    // --- Core Logic: Milestone Calculation ---
    // Calculate the total balance after tax (passed from Step 1)
    const netTotal = parseFloat(totalBalance) || 0;

    // Recalculate milestones when paymentPhases or netTotal changes
    useEffect(() => {
        // Only auto-split if we are NOT editing an existing proposal 
        // OR if the history data didn't contain any milestones (a rare edge case)
        if (!isEditingExistingProposal || initialMilestones.length === 0) {
            const numPhases = parseInt(paymentPhases);
            if (numPhases > 0 && netTotal > 0) {
                const equalSplitAmount = netTotal / numPhases;
                const newMilestones = Array.from({ length: numPhases }, (_, index) => {
                    const existingMilestone = milestones.find(m => m.name === `Milestone ${index + 1}`);
                    return {
                        id: existingMilestone ? existingMilestone.id : null, // Preserve ID if it exists
                        expectedAmount: equalSplitAmount,
                        expectedMilestoneDate: '', // Clear date for new split
                        name: `Milestone ${index + 1}`, // Set milestone name
                        actualAmount: 0,
                        actualMilestoneDate: null,
                    };
                });
                setMilestones(newMilestones);
            } else {
                setMilestones([]);
            }
        }
        // If isEditingExistingProposal is true, the initialMilestones are preserved by the initial state setup.
    }, [paymentPhases, netTotal, isEditingExistingProposal, initialMilestones]);


    // Handle individual milestone amount change
    const handleMilestoneAmountChange = (index, value) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { ...newMilestones[index], expectedAmount: parseFloat(value) || 0 };
        setMilestones(newMilestones);
    };

    // Handle individual milestone date change
    const handleMilestoneDateChange = (index, date) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { ...newMilestones[index], expectedMilestoneDate: date };
        setMilestones(newMilestones);
    };

    // Calculate sum of expected milestone amounts for validation
    const milestoneSum = milestones.reduce((sum, m) => sum + (m.expectedAmount || 0), 0);
    const isMilestoneSumValid = Math.abs(milestoneSum - netTotal) < 0.01; // Allow for floating point error

    // Handle submission (Final Step)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isMilestoneSumValid) {
            alert(`Milestone total (${currencySymbol}${milestoneSum.toFixed(2)}) must equal the Total Balance (${currencySymbol}${netTotal.toFixed(2)}).`);
            return;
        }
        if (milestones.some(m => !m.expectedMilestoneDate)) {
             alert("All milestones must have an expected date set.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Authentication token missing.");
            return;
        }

        const domainDetails = {
            domainName,
            ownDomain: ownDomain === 'yes',
            registerDate: ownDomain === 'yes' ? registerDate : null, // Only send dates if own domain is 'yes'
            renewalDate: ownDomain === 'yes' ? renewalDate : null
        };
        // If using XcodeFix domain, use the initial data's domain details if available
        if (ownDomain === 'no' && initialData.clientDomain) {
             domainDetails.domainName = initialData.clientDomain.domainName;
             domainDetails.registerDate = initialData.clientDomain.registerDate;
             domainDetails.renewalDate = initialData.clientDomain.renewalDate;
        }


        // Construct the payload
        const payload = {
            id: isEditingExistingProposal ? initialData.id : null, // ID of the post-sales record if editing
            leadId: leadId,
            bactive: true, // Assuming a new/updated proposal starts as active
            proposalId: originalProposalId,
            projectDuration: parseInt(projectDuration),
            paymentTermsAndConditions: paymentTermsAndConditions,
            paymentPhases: paymentPhases,
            projectValue: serviceData.totals.taxableAmount, // Project Value (After Discount, Before GST)
            discount: serviceData.totals.discountPercentage,
            milestones: milestones.map(m => ({
                // When updating, we might need to send the history milestone ID.
                // When creating new, the backend handles the ID.
                id: m.id || null, 
                expectedAmount: m.expectedAmount,
                expectedMilestoneDate: m.expectedMilestoneDate,
            })),
            services: serviceData.items.map(s => ({
                // NOTE: The API response structure implies service and subservice IDs are handled.
                // Here we map back the calculated service items.
                serviceId: s.serviceId,
                subServiceId: s.subserviceIds && s.subserviceIds.length > 0 ? s.subserviceIds[0] : null, // Assuming API handles one subservice for simplicity or first in array
                unitPrice: s.unitPrice,
                unit: s.unit,
                quantity: s.quantity,
                amount: s.amount
            })),
            currency: serviceData.currency, // Currency Code (e.g., "INR")
            clientDomain: domainDetails,
            // Include tax/GST calculation if needed by the backend, otherwise calculate it there
            gstAmount: serviceData.totals.gstAmount,
            totalBalance: netTotal,
        };

        const apiEndpoint = isEditingExistingProposal 
            ? ENDPOINTS.UPDATE_POST_SALES // Assuming a dedicated update endpoint or a PUT/PATCH to a specific ID
            : ENDPOINTS.POST_SALES_CREATE;

        try {
            // Note: Update endpoint might require the ID in the URL. Adjust if necessary.
            const response = await axios.post(apiEndpoint, payload, { 
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Post Sales Submission Successful:", response.data);
            alert(`Proposal ${originalProposalId} successfully ${isEditingExistingProposal ? 'updated' : 'created'}!`);
            
            // Redirect or clear form (e.g., force a refresh or navigate away)
            window.location.reload(); 

        } catch (error) {
            console.error("Post Sales Submission Error:", error.response?.data || error.message);
            alert(`Submission failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const isDomainFieldsRequired = ownDomain === 'yes';

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">
                Step 2: Payment & Project Details
                {isEditingExistingProposal && <span className="text-base font-normal text-red-500 ml-3">(Editing Existing Proposal: {originalProposalId})</span>}
            </h2>

            {/* Total Summary */}
            <div className="bg-green-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-green-200">
                <span className="text-xl font-semibold text-green-700">Total Project Balance (Including GST):</span>
                <span className="text-2xl font-extrabold text-green-900">{currencySymbol}{netTotal.toFixed(2)}</span>
            </div>

            {/* Payment Phases & Project Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Payment Phases */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                        Payment Phases <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="flex space-x-2">
                        {['2', '3', '4'].map(phase => (
                            <button
                                key={phase}
                                type="button"
                                onClick={() => setPaymentPhases(phase)}
                                className={`flex-1 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                                    paymentPhases === phase ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {phase} Phases (Auto-Split)
                            </button>
                        ))}
                    </div>
                </div>

                {/* Project Duration */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                        Project Duration (Months) <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={projectDuration}
                        onChange={(e) => setProjectDuration(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                        placeholder="e.g., 6"
                        required
                    />
                </div>
            </div>
            
            {/* Domain & Hosting Details */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Domain & Hosting Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Own Domain Status */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                            Client Has Own Domain? <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="flex space-x-4 items-center">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="ownDomain"
                                    value="yes"
                                    checked={ownDomain === 'yes'}
                                    onChange={(e) => setOwnDomain(e.target.value)}
                                    className="form-radio text-blue-600"
                                />
                                <span className="ml-2 text-sm">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="ownDomain"
                                    value="no"
                                    checked={ownDomain === 'no'}
                                    onChange={(e) => setOwnDomain(e.target.value)}
                                    className="form-radio text-blue-600"
                                />
                                <span className={`ml-2 text-sm ${ownDomain === 'no' ? 'font-bold text-red-600' : ''}`}>
                                    No (Use XcodeFix Domain)
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    {/* Domain Name */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                            Domain Name {isDomainFieldsRequired && <span style={{ color: "red" }}>*</span>}
                        </label>
                        <input
                            type="text"
                            value={domainName}
                            onChange={(e) => setDomainName(e.target.value)}
                            className={`border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400 ${!isDomainFieldsRequired ? 'bg-gray-100' : ''}`}
                            placeholder="e.g., www.clientwebsite.com"
                            required={isDomainFieldsRequired}
                            disabled={!isDomainFieldsRequired}
                        />
                    </div>
                    
                    {/* Registration Date */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                            Registration Date {isDomainFieldsRequired && <span style={{ color: "red" }}>*</span>}
                        </label>
                        <input
                            type="date"
                            value={registerDate}
                            onChange={(e) => setRegisterDate(e.target.value)}
                            className={`border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400 ${!isDomainFieldsRequired ? 'bg-gray-100' : ''}`}
                            required={isDomainFieldsRequired}
                            disabled={!isDomainFieldsRequired}
                        />
                    </div>
                    
                    {/* Renewal Date */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                            Renewal Date {isDomainFieldsRequired && <span style={{ color: "red" }}>*</span>}
                        </label>
                        <input
                            type="date"
                            value={renewalDate}
                            onChange={(e) => setRenewalDate(e.target.value)}
                            className={`border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400 ${!isDomainFieldsRequired ? 'bg-gray-100' : ''}`}
                            required={isDomainFieldsRequired}
                            disabled={!isDomainFieldsRequired}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Milestones Table */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Milestones ({paymentPhases} Phases)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-yellow-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Milestone Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Amount ({currencySymbol})</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {milestones.map((milestone, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {milestone.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="date"
                                            value={milestone.expectedMilestoneDate}
                                            onChange={(e) => handleMilestoneDateChange(index, e.target.value)}
                                            className="w-full border p-1 rounded text-sm"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={milestone.expectedAmount.toFixed(2)}
                                            onChange={(e) => handleMilestoneAmountChange(index, e.target.value)}
                                            className="w-full border p-1 rounded text-sm text-right font-semibold"
                                            required
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Validation Summary */}
                <div className={`mt-3 p-2 rounded text-sm font-semibold flex justify-between ${isMilestoneSumValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span>Milestone Total:</span>
                    <span>{currencySymbol}{milestoneSum.toFixed(2)} / {currencySymbol}{netTotal.toFixed(2)}</span>
                    <span className='font-bold'>{isMilestoneSumValid ? 'Total Valid' : 'Total Mismatch!'}</span>
                </div>
            </div>

            {/* Payment Terms and Conditions */}
            <div className="mb-8">
                <label className="text-sm font-medium text-gray-700 mb-2">
                    Payment Terms and Conditions
                </label>
                <textarea
                    value={paymentTermsAndConditions}
                    onChange={(e) => setPaymentTermsAndConditions(e.target.value)}
                    rows="4"
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Enter any specific terms and conditions here..."
                ></textarea>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="bg-gray-500 text-white py-2 px-6 rounded-xl hover:bg-gray-700 transition text-md font-semibold"
                >
                    &larr; Back to Services
                </button>
                <button
                    type="submit"
                    disabled={!isMilestoneSumValid}
                    className="bg-blue-600 text-white py-3 px-8 rounded-xl hover:bg-blue-800 transition text-lg font-semibold shadow-lg disabled:opacity-50"
                >
                    {isEditingExistingProposal ? 'Final Update Proposal' : 'Create Proposal'}
                </button>
            </div>
        </form>
    );
};

export default PaymentAndDomainDetailsCombined;