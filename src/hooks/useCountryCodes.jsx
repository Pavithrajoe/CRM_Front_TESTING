import { useContext, useMemo, useCallback } from "react";
import { CountryCodeContext } from "../context/Master/CountryCodeContext/CountryCodeContext";

export const useCountryCodes = () => {
  const context = useContext(CountryCodeContext);
  
  if (!context) {
    throw new Error("useCountryCodes must be used within a CountryCodeProvider");
  }

  const {
    countryCodes,
    filteredCodes,
    loading,
    error,
    defaultCode,
    filterCountryCodes,
    getCountryCodeByValue,
    getCountryByName,
    refreshCountryCodes,
    setFilteredCodes
  } = context;

  // Get options for dropdown
  const countryCodeOptions = useMemo(() => {
    return filteredCodes.map(cc => ({
      value: cc.code,
      label: `${cc.code} (${cc.name})`,
      name: cc.name,
      flag: cc.flag,
      countryCode: cc.countryCode
    }));
  }, [filteredCodes]);

  // Get formatted display string
  const getFormattedDisplay = useCallback((code) => {
    const country = getCountryCodeByValue(code);
    return country ? `${country.code} (${country.name})` : code;
  }, [getCountryCodeByValue]);

  // Split phone number
  const splitPhoneNumber = useCallback((fullPhoneNumber) => {
    if (!fullPhoneNumber) {
      return {
        countryCode: defaultCode,
        nationalNumber: '',
      };
    }

    if (!fullPhoneNumber.startsWith('+')) {
      return {
        countryCode: defaultCode,
        nationalNumber: fullPhoneNumber,
      };
    }

    const regexMatch = fullPhoneNumber.match(/^\+(\d{1,4})\s*(.*)/);
    if (regexMatch && regexMatch.length === 3) {
      return {
        countryCode: `+${regexMatch[1]}`,
        nationalNumber: regexMatch[2],
      };
    }

    return {
      countryCode: defaultCode,
      nationalNumber: fullPhoneNumber,
    };
  }, [defaultCode]);

  // Validate phone number
  const validatePhoneNumber = useCallback((phoneNumber) => {
    if (!phoneNumber) return "Phone number is required";
    
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    if (digitsOnly.length < 6) {
      return "Phone number must be at least 6 digits";
    }
    
    if (digitsOnly.length > 15) {
      return "Phone number cannot exceed 15 digits";
    }
    
    return "";
  }, []);

  return {
    countryCodes,
    filteredCodes,
    countryCodeOptions,
    loading,
    error,
    defaultCode,
    filterCountryCodes,
    getCountryCodeByValue,
    getCountryByName,
    refreshCountryCodes,
    setFilteredCodes,
    getFormattedDisplay,
    splitPhoneNumber,
    validatePhoneNumber
  };
};