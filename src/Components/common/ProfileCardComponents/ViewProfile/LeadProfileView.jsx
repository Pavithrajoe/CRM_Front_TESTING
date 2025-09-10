// src/Components/common/ProfileCardComponents/ViewProfile/LeadProfileView.jsx

import React from 'react';
import { Dialog } from '@headlessui/react';
import {
  FiX,
  FiMail,
  FiPhone,
  FiCodesandbox,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiGlobe,
  FiTag,
  FiBriefcase,
  FiAperture,
  FiFileText,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { TbWorld } from 'react-icons/tb';

const LeadProfileView = ({ profile, showDetails, onClose }) => {
  if (!showDetails || !profile) {
    return null;
  }

  const formatName = (name) => {
    if (!name) return 'Lead';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const DetailField = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <Icon className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{label}:</span>
          <span className="break-words text-gray-700">{value}</span>
        </div>
      </div>
    );
  };

  const getFullAddress = (profile) => {
    const addressParts = [];
    if (profile.clead_address1) addressParts.push(profile.clead_address1);
    if (profile.clead_address2) addressParts.push(profile.clead_address2);
    if (profile.clead_address3) addressParts.push(profile.clead_address3);
    if (profile.city?.cCity_name) addressParts.push(profile.city.cCity_name);
    if (profile.cpincode) addressParts.push(profile.cpincode);
    if (profile.city?.district?.cDistrict_name)
      addressParts.push(profile.city.district.cDistrict_name);
    if (profile.city?.district?.state?.cState_name)
      addressParts.push(profile.city.district.state.cState_name);
    if (profile.city?.district?.state?.country?.cCountry_name)
      addressParts.push(profile.city.district.state.country.cCountry_name);
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const fullAddress = getFullAddress(profile);

  return (
    <Dialog open={showDetails} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-white p-6 sm:p-8 rounded-2xl max-h-[90vh] overflow-y-auto shadow-lg relative transform transition-all duration-300 scale-100 opacity-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>

          <Dialog.Title className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
            {formatName(profile?.clead_name)}'s Profile Details
          </Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base">
            {/* Left Column: Basic Contact & Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-2">
                Basic Information
              </h3>

              <DetailField icon={FiUser} label="Lead Name" value={profile.clead_name} />
              <DetailField icon={FiCodesandbox} label="Organization Name" value={profile.corganization} />
              <DetailField icon={FiGlobe} label="Website" value={profile.cwebsite} />
              <DetailField icon={FiUser} label="No. of Employees" value={profile.ino_employee} />
              <DetailField
                icon={FiDollarSign}
                label="Project Value"
                value={
                  profile.iproject_value
                    ? `${profile.iproject_value} ${profile.currency?.symbol || ''}`
                    : null
                }
              />
              <DetailField icon={FiMail} label="Email" value={profile.cemail} />
              <DetailField icon={FiPhone} label="Mobile Number" value={profile.iphone_no} />
              <DetailField icon={FaWhatsapp} label="WhatsApp Number" value={profile.whatsapp_number} />
              <DetailField icon={FiMapPin} label="Address" value={fullAddress} />
            </div>

            {/* Right Column: Lead & Industry Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-2">
                Lead & Industry Details
              </h3>

              <DetailField icon={FiTag} label="Potential Status" value={profile.lead_potential?.clead_name} />
              <DetailField icon={FiBriefcase} label="Lead Status" value={profile.lead_status?.clead_name} />
              <DetailField icon={FiBriefcase} label="Industry" value={profile.industry?.cindustry_name} />
              <DetailField icon={FiAperture} label="Sub-Industry" value={profile.subindustry?.subindustry_name} />
              <DetailField icon={FiFileText} label="Source" value={profile.lead_sources?.source_name} />
              <DetailField icon={FiFileText} label="Sub-Source" value={profile.sub_src_lead?.sub_source?.ssub_src_name} />
              <DetailField icon={FiFileText} label="Service" value={profile.service?.cservice_name} />
              <DetailField icon={FiFileText} label="Sub-Service" value={profile.subservice?.subservice_name} />
            </div>
          </div>

          {profile.website_lead === true && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm text-sm mt-10 text-yellow-800 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-600 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.344a1.5 1.5 0 012.986 0l2.376 6.07a1.5 1.5 0 01-.734 1.944l-4.136 1.84a1.5 1.5 0 01-1.944-.734l-6.07-2.376a1.5 1.5 0 01-.734-1.944l1.84-4.136a1.5 1.5 0 011.944-.734l2.376 6.07a.5.5 0 00.986-.388l-2.136-5.462a.5.5 0 00-.986.388l2.136 5.462a.5.5 0 00.388.986l5.462 2.136a.5.5 0 00.388-.986l-5.462-2.136z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-7.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zM10 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="font-semibold">This lead originated from the website.</p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LeadProfileView;
