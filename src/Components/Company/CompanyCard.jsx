import React from 'react';
import { Building2, Mail, Phone, Globe, MapPin, BadgeDollarSign, User2 } from 'lucide-react';

export default function CompanyCard({ company, onEdit, onDelete }) {
  return (
    <div className="border rounded p-4 shadow text-sm">
      <img src={company.cLogo_link} alt="Logo" className="h-12 w-12 object-contain mb-2" />
      <h3 className="font-bold text-lg">{company.cCompany_name}</h3>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2"><User2 size={14} /> Reseller ID: {company.iReseller_id}</div>
        <div className="flex items-center gap-2"><Phone size={14} /> {company.iPhone_no}</div>
        <div className="flex items-center gap-2"><Mail size={14} /> {company.cEmail}</div>
        <div className="flex items-center gap-2"><Globe size={14} /> {company.cWebsite}</div>
        <div className="flex items-center gap-2"><MapPin size={14} /> {company.caddress1}, {company.caddress2}, {company.caddress3}</div>
        <div className="flex items-center gap-2"><BadgeDollarSign size={14} /> GST: {company.cGst_no}</div>
        <div className="flex items-center gap-2">CIN: {company.icin_no}</div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onEdit} className="bg-black text-white px-3 py-1 rounded">Edit</button>
        <button onClick={onDelete} className="bg-black text-white px-3 py-1 rounded">Delete</button>
      </div>
    </div>
  );
}
