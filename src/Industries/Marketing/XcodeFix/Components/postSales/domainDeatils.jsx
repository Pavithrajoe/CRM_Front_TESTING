import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const requiredFields = {
    'own': ['domainName', 'registerDate', 'renewalDate', 'hostingProvider'],
    'company': ['hostingProvider']
};

const DomainDetails = ({ onUpdate }) => {
    const [domainStatus, setDomainStatus] = useState('');
    const [domainName, setDomainName] = useState('');
    const [registerDate, setRegisterDate] = useState('');
    const [renewalDate, setRenewalDate] = useState('');
    const [hostingProvider, setHostingProvider] = useState('');
    const [isDataValid, setIsDataValid] = useState(false);
    const validateData = useCallback(() => {
        const fieldsToCheck = requiredFields[domainStatus] || [];
        let missingFields = [];

        if (!domainStatus) {
            return { isValid: false, data: null };
        }

        const currentData = {
            domainStatus,
            domainName: domainName.trim(),
            registerDate: registerDate.trim(),
            renewalDate: renewalDate.trim(),
            hostingProvider: hostingProvider.trim(),
        };

        const isValid = fieldsToCheck.every(fieldKey => {
            const value = currentData[fieldKey];
            return value && value.length > 0;
        });

        const dataToSend = {
            domainStatus,
            hostingProvider: currentData.hostingProvider,
        };

        if (domainStatus === 'own') {
            dataToSend.domainName = currentData.domainName;
            dataToSend.registerDate = currentData.registerDate;
            dataToSend.renewalDate = currentData.renewalDate;
        }

        return { isValid, data: dataToSend };
    }, [domainStatus, domainName, registerDate, renewalDate, hostingProvider]);


    useEffect(() => {
        const { isValid, data } = validateData();
        
        setIsDataValid(isValid);
        onUpdate(isValid ? data : null);
        
    }, [domainStatus, domainName, registerDate, renewalDate, hostingProvider, onUpdate, validateData]);
    
    
    return (
        <div className="p-4 rounded-xl border border-gray-300 bg-gray-50 shadow-inner">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                Domain & Hosting Details
               
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/*  Domain Status  */}
                <div>
                    <label htmlFor="domainStatus" className="block text-sm font-medium text-gray-700 mb-1">
                        Domain Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="domainStatus"
                        value={domainStatus}
                        onChange={(e) => {
                            setDomainStatus(e.target.value);
                            setDomainName('');
                            setRegisterDate('');
                            setRenewalDate('');
                        }}
                        className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                        required
                    >
                        <option value="">Select Domain Owner</option>
                        <option value="own">Client's Own Domain</option>
                        <option value="company">Company Domain (Purchased by us)</option>
                    </select>
                </div>
                
                {/* Hosting Provider */}
                <div>
                    <label htmlFor="hostingProvider" className="block text-sm font-medium text-gray-700 mb-1">
                        Hosting Provider <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="hostingProvider"
                        value={hostingProvider}
                        onChange={(e) => setHostingProvider(e.target.value)}
                        placeholder="e.g., GoDaddy, AWS, Client Server"
                        className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                        required
                    />
                </div>

                {/*  if Client's Own Domain is selected */}
                {domainStatus === 'own' && (
                    <>
                        {/* Domain Name */}
                        <div className="md:col-span-2"> 
                            <label htmlFor="domainName" className="block text-sm font-medium text-gray-700 mb-1">
                                Domain Name (e.g., example.com) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="domainName"
                                value={domainName}
                                onChange={(e) => setDomainName(e.target.value)}
                                placeholder="Enter primary domain name"
                                className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                required
                            />
                        </div>

                        {/* Registration Date */}
                        <div>
                            <label htmlFor="registerDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Registration Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="registerDate"
                                value={registerDate}
                                onChange={(e) => setRegisterDate(e.target.value)}
                                className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                required
                            />
                        </div>

                        {/* Renewal Date */}
                        <div>
                            <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Renewal Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="renewalDate"
                                value={renewalDate}
                                onChange={(e) => setRenewalDate(e.target.value)}
                                className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                required
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DomainDetails;