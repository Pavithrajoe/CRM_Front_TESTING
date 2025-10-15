import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const requiredFields = {
    'own': ['domainName', 'hostingProvider'], 
    'company': ['domainName', 'registerDate', 'renewalDate', 'hostingProvider']
};

const DomainDetails = ({ onUpdate }) => {
    const [domainStatus, setDomainStatus] = useState('');
    const [domainName, setDomainName] = useState('');
    const [registerDate, setRegisterDate] = useState('');
    const [renewalDate, setRenewalDate] = useState('');
    const [hostingProvider, setHostingProvider] = useState('');
    const [isDataValid, setIsDataValid] = useState(false);
    
    // The validateData function remains the same
    const validateData = useCallback(() => {
        const fieldsToCheck = requiredFields[domainStatus] || [];

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

        let dataToSend = {
            domainStatus,
            domainName: currentData.domainName,
            hostingProvider: currentData.hostingProvider,
        };

        if (domainStatus === 'company') {
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
    
    const isFieldRequired = (fieldName) => {
        return (requiredFields[domainStatus] || []).includes(fieldName);
    };
    
    const handleDomainStatusChange = (status) => {
        setDomainStatus(status);
        setDomainName('');
        setRegisterDate('');
        setRenewalDate('');
    };

    
    return (
        <div className="p-4 rounded-xl border border-gray-300 bg-gray-50 shadow-inner">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                Domain & Hosting Details 
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/*  Domain Status */}
                <div className="md:col-span-2">
                    <div className="flex items-center space-x-4"> 
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Domain Status <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Wrapper for the buttons */}
                        <div className="flex space-x-4"> 
                            <button
                                type="button"
                                onClick={() => handleDomainStatusChange('own')}
                                className={`p-2 rounded-lg text-sm font-semibold transition duration-150 ease-in-out border-2 whitespace-nowrap ${
                                    domainStatus === 'own' 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                                }`}
                            >
                                Client's Own Domain
                            </button>
                            
                            {/* XcodeFix Domain Button */}
                            <button
                                type="button"
                                onClick={() => handleDomainStatusChange('company')}
                                className={`p-2 rounded-lg text-sm font-semibold transition duration-150 ease-in-out border-2 whitespace-nowrap ${
                                    domainStatus === 'company' 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                                }`}
                            >
                                XcodeFix Domain
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Hosting Provider  */}
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

                {/* Domain Name */}
                {domainStatus && (
                    <div> 
                        <label htmlFor="domainName" className="block text-sm font-medium text-gray-700 mb-1">
                            Domain Name (e.g., example.com) {isFieldRequired('domainName') && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="text"
                            id="domainName"
                            value={domainName}
                            onChange={(e) => setDomainName(e.target.value)}
                            placeholder="Enter primary domain name"
                            className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                            required={isFieldRequired('domainName')}
                        />
                    </div>
                )}
                
                {/* Registration Date and Renewal Date */}
                {domainStatus === 'company' && (
                    <>
                        {/* Registration Date */}
                        <div>
                            <label htmlFor="registerDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Registration Date {isFieldRequired('registerDate') && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="date"
                                id="registerDate"
                                value={registerDate}
                                onChange={(e) => setRegisterDate(e.target.value)}
                                className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                required={isFieldRequired('registerDate')}
                            />
                        </div>

                        {/* Renewal Date  */}
                        <div>
                            <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Renewal Date {isFieldRequired('renewalDate') && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="date"
                                id="renewalDate"
                                value={renewalDate}
                                onChange={(e) => setRenewalDate(e.target.value)}
                                className="w-full border p-2 rounded-lg text-sm focus:ring-indigo-400 focus:border-indigo-400"
                                required={isFieldRequired('renewalDate')}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DomainDetails;