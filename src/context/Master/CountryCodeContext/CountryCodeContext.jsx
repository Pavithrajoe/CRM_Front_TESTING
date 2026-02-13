import React, { createContext, useState, useEffect, useCallback } from "react";

// Create Context
export const CountryCodeContext = createContext();

// Provider Component
export const CountryCodeProvider = ({ children }) => {
  const [countryCodes, setCountryCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [defaultCode, setDefaultCode] = useState("+91");

  // Fetch country codes
  const fetchCountryCodes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,idd"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch country codes");
      }

      const data = await response.json();

      const codes = data
        .map((country) => {
          if (!country.idd || !country.idd.root) return null;

          const suffix = country.idd.suffixes?.[0] || "";
          const fullCode = `${country.idd.root}${suffix}`;

          if (!fullCode || fullCode === "+") return null;

          return {
            name: country.name.common,
            code: fullCode,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      // Common countries on top
      const commonCountries = [
        "India",
        "United States",
        "United Kingdom",
        "Canada",
        "Australia",
      ];

      const sortedCodes = [
        ...codes
          .filter((c) => commonCountries.includes(c.name))
          .sort(
            (a, b) =>
              commonCountries.indexOf(a.name) -
              commonCountries.indexOf(b.name)
          ),
        ...codes.filter((c) => !commonCountries.includes(c.name)),
      ];

      setCountryCodes(sortedCodes);
      setFilteredCodes(sortedCodes);

      // Default = India if available
      const indiaCode =
        sortedCodes.find((c) => c.name === "India")?.code || "+91";
      setDefaultCode(indiaCode);
    } catch (err) {
      console.error("Error fetching country codes:", err);
      setError(err.message);

      // Fallback
      const fallbackCodes = [
        { name: "India", code: "+91" },
        { name: "United States", code: "+1" },
        { name: "United Kingdom", code: "+44" },
        { name: "Canada", code: "+1" },
        { name: "Australia", code: "+61" },
        { name: "Germany", code: "+49" },
        { name: "France", code: "+33" },
        { name: "Japan", code: "+81" },
        { name: "China", code: "+86" },
        { name: "Brazil", code: "+55" },
      ];

      setCountryCodes(fallbackCodes);
      setFilteredCodes(fallbackCodes);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter
  const filterCountryCodes = useCallback(
    (searchTerm) => {
      if (!searchTerm || searchTerm.trim() === "") {
        setFilteredCodes(countryCodes);
        return;
      }

      const term = searchTerm.toLowerCase().trim();

      const filtered = countryCodes.filter(
        (cc) =>
          cc.name.toLowerCase().includes(term) ||
          cc.code.toLowerCase().includes(term)
      );

      setFilteredCodes(filtered);
    },
    [countryCodes]
  );

  // Get by code
  const getCountryCodeByValue = useCallback(
    (code) => {
      return countryCodes.find((cc) => cc.code === code) || null;
    },
    [countryCodes]
  );

  // Get by name
  const getCountryByName = useCallback(
    (name) => {
      return (
        countryCodes.find(
          (cc) => cc.name.toLowerCase() === name.toLowerCase()
        ) || null
      );
    },
    [countryCodes]
  );

  // Refresh
  const refreshCountryCodes = useCallback(() => {
    fetchCountryCodes();
  }, [fetchCountryCodes]);

  useEffect(() => {
    fetchCountryCodes();
  }, [fetchCountryCodes]);

  return (
    <CountryCodeContext.Provider
      value={{
        countryCodes,
        filteredCodes,
        loading,
        error,
        defaultCode,
        filterCountryCodes,
        getCountryCodeByValue,
        getCountryByName,
        refreshCountryCodes,
        setFilteredCodes,
      }}
    >
      {children}
    </CountryCodeContext.Provider>
  );
};
