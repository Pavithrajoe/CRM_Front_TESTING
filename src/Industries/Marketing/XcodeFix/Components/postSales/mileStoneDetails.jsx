
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaArrowLeft, FaSave, FaCalendarAlt, FaTrashAlt, FaPlusCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import DomainDetails from "./domainDeatils.jsx"; 
import MilestoneStatusBar from './mileStoneStatusBar.jsx';

const initialMilestoneRow = (sNo, defaultAmount, milestoneName = '') => {
    return {
        id: Date.now() + Math.random(), 
        sNo,
        milestone: milestoneName || `Milestone ${sNo}`,
        milestoneDate: '',
        amount: parseFloat(defaultAmount.toFixed(2)),
    };
};

const calculateBalancedSplit = (totalAmount, totalPhases) => {
    if (totalPhases <= 0 || isNaN(totalAmount) || totalAmount <= 0) return [];
    
    const totalRemaining = Math.round(totalAmount * 100); 
    const baseAmountCents = Math.floor(totalRemaining / totalPhases);
    let remainderCents = totalRemaining % totalPhases;
    
    const amounts = Array.from({ length: totalPhases }, () => {
        let amount = baseAmountCents;
        if (remainderCents > 0) {
            amount += 1;
            remainderCents--;
        }
        return amount / 100; 
    });
    
    return amounts;
};

const PaymentAndDomainDetailsCombined = ({ serviceData, onBack, totalBalance, leadId  }) => {
    const navigate = useNavigate(); 
    const location = useLocation();
    console.log("leadID", leadId)
    
    const totalAmount = parseFloat(totalBalance) || 0; 
    const [termsAndConditions, setTermsAndConditions] = useState('');
    const [paymentPhases, setPaymentPhases] = useState(0); 
    const [milestones, setMilestones] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [domainData, setDomainData] = useState(null); 

    // Get URL search params and state
    const searchParams = new URLSearchParams(location.search);
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    const pageFromState = location.state?.returnPage;
    const selectedFilter = location.state?.activeTab;

    const [currentPage, setCurrentPage] = useState(() => {
        return pageFromState || pageFromUrl || 1;
    });

    // Auto-split functionality
    useEffect(() => {
        const newPhases = parseInt(paymentPhases);
        
        if (newPhases > 0 && !isInitialized) {
            const splitAmounts = calculateBalancedSplit(totalAmount, newPhases);
            
            // Create milestone names based on phase count
            const milestoneNames = {
                2: ['Initial Payment', 'Final Payment'],
                3: ['Initial Payment', 'Progress Payment', 'Final Payment'],
                4: ['Initial Payment', 'Second Payment', 'Third Payment', 'Final Payment']
            };

            const newMilestones = splitAmounts.map((amount, index) => 
                initialMilestoneRow(
                    index + 1, 
                    amount, 
                    milestoneNames[newPhases]?.[index] || `Milestone ${index + 1}`
                )
            );
            
            setMilestones(newMilestones);
            setIsInitialized(true); 
        } else if (newPhases === 0) {
            setMilestones([]);
            setIsInitialized(false);
        }
    }, [paymentPhases, totalAmount]);

    const handlePhaseSelect = (e) => {
        const value = parseInt(e.target.value);
        setPaymentPhases(value);
        setIsInitialized(false); // Reset initialization to trigger auto-split
    };

    const handleMilestoneChange = (id, name, value) => {
        setMilestones(prevMilestones => {
            return prevMilestones.map(m => 
                m.id === id ? { ...m, [name]: name === 'amount' ? parseFloat(value) || 0 : value } : m
            );
        });
    };
    
    const handleAddMilestone = () => {
        setMilestones(prevMilestones => {
            const nextSNo = prevMilestones.length > 0 ? Math.max(...prevMilestones.map(m => m.sNo)) + 1 : 1;
            const newRow = initialMilestoneRow(nextSNo, 0); 
            return [...prevMilestones, newRow];
        });
    };
    
    const handleDeleteMilestone = (id) => {
        if (milestones.length <= 1) {
            alert("Cannot delete the only milestone. At least one milestone is required.");
            return;
        }
        
        setMilestones(prevMilestones => {
            const filtered = prevMilestones.filter(m => m.id !== id);
            return filtered.map((m, index) => ({
                ...m,
                sNo: index + 1 
            }));
        });
    };

    const currentMilestoneSum = useMemo(() => 
        milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0)
    , [milestones]);
    
    const amountDifference = (totalAmount - currentMilestoneSum).toFixed(2);
    const isSumValid = Math.abs(amountDifference) < 0.01;
    
    const handleDomainDataUpdate = useCallback((data) => {
        setDomainData(data);
    }, []);

    const handleSave = () => {
        const tolerance = 0.01;

        if (paymentPhases === 0) {
            alert("Error: Please select the number of Payment Phases.");
            return;
        }

        if (milestones.length === 0) {
            alert("Error: Please add at least one Milestone.");
            return;
        }

        if (Math.abs(currentMilestoneSum - totalAmount) > tolerance) {
            alert(
                `Error: Sum of milestone amounts ($${currentMilestoneSum.toFixed(
                2
                )}) must equal the Total Balance ($${totalAmount.toFixed(2)}). Please adjust.`
            );
            return;
        }

        const hasEmptyDateOrMilestone = milestones.some(
            (m) => !m.milestone || !m.milestoneDate
        );
        if (hasEmptyDateOrMilestone) {
            alert("Error: Please fill in the Milestone name and Date for all entries.");
            return;
        }

        if (!domainData) {
            alert("Error: Please fill and validate the Domain Details section.");
            return;
        }

        const finalSubmission = {
            ...serviceData,
            leadId,
            termsAndConditions,
            paymentPhases: paymentPhases,
            milestones: milestones.map((m) => ({
                sNo: m.sNo,
                milestone: m.milestone,
                milestoneDate: m.milestoneDate,
                amount: parseFloat(m.amount.toFixed(2)),
            })),
            domainDetails: domainData,
            finalTotalBalance: totalAmount.toFixed(2),
        };

        console.log("Submitting final data:", finalSubmission);
        alert("Data successfully compiled and ready for API submission!");

        navigate(`/xcodefix_leaddetailview_milestone/${9}`, {
            state: {
                returnPage: currentPage,
                activeTab: selectedFilter,
            },
        });
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-full lg:max-w-6xl mx-auto max-h-[95vh] overflow-y-auto">

                {/* Header and Back Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <button 
                        onClick={onBack} 
                        className="flex items-center text-blue-600 hover:text-blue-800 transition text-sm font-semibold mb-3 sm:mb-0"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Service Details
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Payment & Domain Details (Lead ID: {leadId || 'N/A'})</h2>
                </div>
                
                {/* Total Amount Display */}
                <div className="flex justify-end mb-6">
                    <div className="text-xl font-extrabold text-green-700">
                        Total Amount Due: ${totalAmount.toFixed(2)}
                    </div>
                </div>

                {/* Milestone Status Bar */}
                {leadId && (
                    <div className="mb-8 border border-blue-200 rounded-lg p-4 bg-white shadow-sm">
                        <MilestoneStatusBar leadId={leadId} />
                    </div>
                )}

                <hr className="my-8 border-t-2 border-blue-200" />
                
                {/* Payment Terms and Condition */}
                <div className="mb-6 border p-4 rounded-lg bg-gray-50">
                    <label htmlFor="terms" className="block text-md font-medium text-gray-700 mb-2">
                        Payment Terms and Conditions
                    </label>
                    <textarea
                        id="terms"
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        maxLength={1000} 
                        rows="4"
                        placeholder="Enter the specific payment terms and conditions for this deal..."
                        className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400 resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right">{termsAndConditions.length} / 1000 characters</p>
                </div>

                {/* Payment Phases Selection */}
                <div className="mb-6 border p-4 rounded-lg bg-blue-50">
                    <label htmlFor="phases" className="block text-md font-medium text-gray-700 mb-2">
                        Select Payment Phases for Initial Split (Optional: You can customize below)
                    </label>
                    <select
                        id="phases"
                        value={paymentPhases}
                        onChange={handlePhaseSelect}
                        className="w-full sm:w-1/2 md:w-1/3 border p-2 rounded-lg text-sm focus:ring-blue-400 focus:border-blue-400 bg-white"
                    >
                        <option value="0" disabled>Select number of phases</option>
                        <option value="2">2 Phases (Auto-Split)</option>
                        <option value="3">3 Phases (Auto-Split)</option>
                        <option value="4">4 Phases (Auto-Split)</option>
                    </select>
                    {paymentPhases > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                            ✅ Auto-split applied! Amount divided into {paymentPhases} equal phases. You can customize below.
                        </p>
                    )}
                </div>

                {/* Milestone Table */}
                {paymentPhases > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3 text-blue-600">
                            Payment Milestones
                        </h3>
                        
                        {/* Milestone table */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-10">S.No.</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase min-w-[150px]">Milestone Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase min-w-[120px]">Milestone Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase min-w-[100px]">Amount ($)</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-10">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {milestones.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{row.sNo}</td>
                                            
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={row.milestone}
                                                    onChange={(e) => handleMilestoneChange(row.id, 'milestone', e.target.value)}
                                                    className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400"
                                                    placeholder="e.g., Initial Deposit"
                                                />
                                            </td>
                                            
                                            <td className="px-3 py-2">
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={row.milestoneDate}
                                                        onChange={(e) => handleMilestoneChange(row.id, 'milestoneDate', e.target.value)}
                                                        className="w-full border p-1 rounded text-sm focus:ring-blue-400 focus:border-blue-400 pr-8"
                                                        required
                                                    />
                                                    <FaCalendarAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                                </div>
                                            </td>

                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.amount}
                                                    onChange={(e) => handleMilestoneChange(row.id, 'amount', e.target.value)}
                                                    className="w-full border p-1 rounded text-sm font-semibold text-gray-800 focus:ring-blue-400 focus:border-blue-400"
                                                    required
                                                />
                                            </td>
                                            
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMilestone(row.id)}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                    title="Delete Milestone"
                                                    disabled={milestones.length <= 1}
                                                >
                                                    <FaTrashAlt size={16} className={milestones.length <= 1 ? 'opacity-50' : ''} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Add Milestone Button and Totals */}
                        <div className="flex justify-between items-start mt-4">
                            <button
                                type="button"
                                onClick={handleAddMilestone}
                                className="flex items-center text-blue-600 hover:text-blue-800 transition font-semibold text-sm"
                            >
                                <FaPlusCircle className="mr-2" size={16} /> Add Custom Milestone
                            </button>
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between font-bold text-gray-700 text-base border-t pt-2">
                                    <span>Total Due:</span>
                                    <span>${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-700 text-base">
                                    <span>Milestones Sum:</span>
                                    <span>${currentMilestoneSum.toFixed(2)}</span>
                                </div>
                                <div className={`flex justify-between font-extrabold pt-2 border-t-2 ${isSumValid ? 'text-green-600' : 'text-red-600'}`}>
                                    <span>Difference:</span>
                                    <span>${amountDifference}</span>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                )}
                
                <hr className="my-8 border-t-2 border-blue-200" />
                
                {/* DOMAIN DETAILS  */}
                <DomainDetails 
                    onUpdate={handleDomainDataUpdate}
                />
                
                <hr className="my-8 border-t-2 border-blue-200" />

                {/* Final Save Button */}
                <div className="mt-8 text-center pt-6">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={paymentPhases === 0 || milestones.length === 0 || !isSumValid || !domainData}
                        className="w-full sm:w-auto bg-green-600 text-white py-3 px-8 rounded-xl hover:bg-green-800 transition text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaSave className="inline mr-2" /> Save & Finalize 
                    </button>
                    {(!isSumValid && paymentPhases > 0) && (
                        <p className="mt-3 text-sm text-red-600 font-medium">
                            🚨 Milestone amounts do not match the total balance. Please adjust amounts to proceed.
                        </p>
                    )}
                    {(!domainData) && (
                        <p className="mt-3 text-sm text-orange-500 font-medium">
                            Please fill in all required Domain Details to finalize the deal.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentAndDomainDetailsCombined;
