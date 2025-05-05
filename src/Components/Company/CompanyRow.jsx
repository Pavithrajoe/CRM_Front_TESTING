import React from 'react';
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaBuilding,
  FaIdBadge,
  FaHashtag,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';

const CompanyRow = ({ company, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-4">
      <div className="flex items-center gap-4">
        <img
          src={company.cLogo_link || 'https://via.placeholder.com/80'}
          alt="Logo"
          className="w-16 h-16 object-cover rounded"
        />
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            <h2 className="text-xl font-bold text-black">{company.cCompany_name}</h2>
            <div className="flex items-center gap-2">
              <FaUser className="text-gray-500" />
              Reseller ID: {company.iReseller_id}
            </div>
            <div className="flex items-center gap-2">
              <FaPhone className="text-gray-500" />
              {company.iPhone_no}
            </div>
            <div className="flex items-center gap-2">
              <FaEnvelope className="text-gray-500" />
              {company.cEmail}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaGlobe className="text-gray-500" />
              {company.cWebsite}
            </div>
            <div className="flex items-center gap-2">
              <FaBuilding className="text-gray-500" />
              {company.caddress1}, {company.caddress2}, {company.caddress3}
            </div>
            <div className="flex items-center gap-2">
              <FaHashtag className="text-gray-500" />
              GST: {company.cGst_no}
            </div>
            <div className="flex items-center gap-2">
              <FaIdBadge className="text-gray-500" />
              CIN: {company.icin_no}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={onEdit}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
          title="Edit"
        >
          <FaEdit className="text-gray-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded bg-gray-100 hover:bg-red-100"
          title="Delete"
        >
          <FaTrash className="text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default CompanyRow;
