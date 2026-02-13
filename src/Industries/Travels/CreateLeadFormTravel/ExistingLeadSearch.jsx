import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import PopupMessage from "../../../context/PopUpMessage/PopupMessage";
import { useCountryCodes } from "../../../hooks/useCountryCodes";

const apiEndPoint = import.meta.env.VITE_API_URL;

const ExistingLeadSearch = ({
  token,
  onLeadSelect,
  canSeeExistingLeads
}) => {

  const {
    countryCodeOptions,
    loading: countryCodesLoading,
    filterCountryCodes
  } = useCountryCodes();

  const mobileCountryCodeRef = useRef(null);

  const [searchMobile, setSearchMobile] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchMobileCountryCode, setSearchMobileCountryCode] = useState("+91");
  const [isMobileCountryCodeDropdownOpen, setIsMobileCountryCodeDropdownOpen] = useState(false);

  const [foundLeads, setFoundLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleSearchExistingLead = async () => {
    if (!searchMobile && !searchEmail) {
      setPopupMessage("Please enter mobile or email");
      setIsPopupVisible(true);
      return;
    }

    setLoading(true);
    setFoundLeads([]);

    try {
      let body = {};

      if (searchMobile) {
        body = {
          phonenumber: searchMobile,
          phone_country_code: searchMobileCountryCode,
        };
      } else {
        body = { email: searchEmail };
      }

      const res = await fetch(`${apiEndPoint}/lead/getExistingLeads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data.data)) {
        setFoundLeads(data.data);
      } else {
        setPopupMessage("No existing lead found.");
        setIsPopupVisible(true);
      }
    } catch (error) {
      setPopupMessage("Search failed.");
      setIsPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = async (leadId) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiEndPoint}/lead/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        onLeadSelect(data); // send to parent
      }
    } catch (error) {
      setPopupMessage("Failed to fetch lead.");
      setIsPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (!canSeeExistingLeads) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Search Existing Lead</h3>

      <input
        type="text"
        placeholder="Mobile Number"
        value={searchMobile}
        onChange={(e) => {
          setSearchMobile(e.target.value);
          if (e.target.value) setSearchEmail("");
        }}
        className="border px-3 py-2 rounded w-full"
      />

      <input
        type="text"
        placeholder="Email Address"
        value={searchEmail}
        onChange={(e) => {
          setSearchEmail(e.target.value);
          if (e.target.value) setSearchMobile("");
        }}
        className="border px-3 py-2 rounded w-full"
      />

      <button
        type="button"
        onClick={handleSearchExistingLead}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {foundLeads.length > 0 && (
        <select
          onChange={(e) => handleSelectLead(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">Select Lead</option>
          {foundLeads.map((lead) => (
            <option key={lead.ilead_id} value={lead.ilead_id}>
              {lead.clead_name}
            </option>
          ))}
        </select>
      )}

      {isPopupVisible && (
        <PopupMessage
          isVisible={isPopupVisible}
          message={popupMessage}
          onClose={() => setIsPopupVisible(false)}
        />
      )}
    </div>
  );
};

export default ExistingLeadSearch;
