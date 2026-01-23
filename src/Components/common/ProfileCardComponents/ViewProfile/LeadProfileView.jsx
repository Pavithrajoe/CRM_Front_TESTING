import React from 'react';
import { Dialog } from '@headlessui/react';

const LeadProfileView = ({ profile, showDetails, onClose }) => {
  // console.log("LEAD PROFILE DATA:", profile);

  if (!showDetails || !profile) return null;

  const formatName = (name) => {
    if (!name) return 'Lead';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const DetailField = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-medium text-black whitespace-nowrap">{label}:</span>
        <span className="text-gray-700 break-words">{value}</span>
      </div>
    );
  };

  const getFormattedAddress = (profile) => {
    const addressParts = [];
    if (profile.clead_address1) addressParts.push(profile.clead_address1);

    const line2Parts = [profile.clead_address2, profile.clead_address3].filter(Boolean);
    if (line2Parts.length > 0) addressParts.push(line2Parts.join(', '));

    const line3Parts = [profile.city?.cCity_name, profile.cpincode].filter(Boolean);
    if (line3Parts.length > 0) addressParts.push(line3Parts.join(', '));

    if (profile.city?.district?.cDistrict_name) addressParts.push(profile.city.district.cDistrict_name);
    
    const line5Parts = [profile.city?.district?.state?.cState_name, profile.city?.district?.state?.country?.cCountry_name].filter(Boolean);
    if (line5Parts.length > 0) addressParts.push(line5Parts.join(', '));

    return addressParts.length > 0 ? (
      <>
        <div className="flex items-start gap-1">
          <span className="font-medium text-black">Address:</span>
          <div className="flex flex-col">
            {addressParts.map((part, index) => (
              <span key={index} className="text-gray-700 break-words">{part}</span>
            ))}
          </div>
        </div>
      </>
    ) : null;
  };

  return (
    <Dialog open={showDetails} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-white p-6 sm:p-8 rounded-2xl max-h-[90vh] overflow-y-auto shadow-lg relative transform transition-all duration-300 scale-100 opacity-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-x"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <Dialog.Title className="text-xl sm:text-2xl font-semibold text-black mb-6">
            {formatName(profile?.clead_name)}'s Profile Details
          </Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base">
            {/* Left Column - Basic Contact & Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black border-b pb-2 mb-2">
                Basic Information
              </h3>

              <DetailField label="Lead Name" value={profile.clead_name} />
              <DetailField label="Organization Name" value={profile.corganization} />
              <DetailField label="Website" value={profile.cwebsite} />
              <DetailField label="No. of Employees" value={profile.ino_employee} />
              <DetailField label="Project Value" value={profile.iproject_value ? `${profile.currency?.symbol || '' } ${profile.iproject_value} `
                    : null}/>
              <DetailField label="Email" value={profile.cemail} />
              <DetailField label="Mobile Number" value={profile.iphone_no} />
              <DetailField label="WhatsApp Number" value={profile.whatsapp_number} />
              {/* address */}
              {getFormattedAddress(profile)}
            </div>

            {/* Right Column - Lead & Industry Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black border-b pb-2 mb-2">
                Lead & Industry Details
              </h3>

              <DetailField label="Lead Potential" value={profile.lead_potential?.clead_name} />
              <DetailField label="Lead Status" value={profile.lead_status?.clead_name} />
              <DetailField label="Industry" value={profile.industry?.cindustry_name} />
              <DetailField label="Sub-Industry" value={profile.subindustry?.subindustry_name} />
              <DetailField label="Source" value={profile.lead_sources?.source_name} />
              <DetailField label="Sub-Source" value={profile.sub_src_lead?.sub_source?.ssub_src_name}/>
              {/* <DetailField label="Quantity" value={profile.quantity || '-'} /> */}
              {profile.quantity && (<DetailField label="Quantity" value={profile.quantity} />)}
            <DetailField 
              label="Service" 
              value={
                profile.crm_lead_multi_service?.length
                  ? profile.crm_lead_multi_service
                      .map(s => s.service?.cservice_name)
                      .join(", ")
                  : profile.service?.cservice_name
              } 
            />

              <DetailField label="Sub-Service" value={profile.subservice?.subservice_name} />
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

// import React from 'react';
// import { Dialog } from '@headlessui/react';

// const LeadProfileView = ({ profile, showDetails, onClose }) => {
//   if (!showDetails || !profile) return null;

//   const formatName = (name) => {
//     if (!name) return 'Lead';
//     return name
//       .split(' ')
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   };

//   const DetailField = ({ label, value }) => {
//     if (!value) return null;
//     return (
//       <div className="flex items-center gap-1 flex-wrap">
//         <span className="font-medium text-black whitespace-nowrap">{label}:</span>
//         <span className="text-gray-700 break-words">{value}</span>
//       </div>
//     );
//   };

//   const getFormattedAddress = (profile) => {
//     const addressParts = [];
//     if (profile.clead_address1) addressParts.push(profile.clead_address1);

//     const line2Parts = [profile.clead_address2, profile.clead_address3].filter(Boolean);
//     if (line2Parts.length > 0) addressParts.push(line2Parts.join(', '));

//     const line3Parts = [profile.city?.cCity_name, profile.cpincode].filter(Boolean);
//     if (line3Parts.length > 0) addressParts.push(line3Parts.join(', '));

//     if (profile.city?.district?.cDistrict_name) addressParts.push(profile.city.district.cDistrict_name);
    
//     const line5Parts = [profile.city?.district?.state?.cState_name, profile.city?.district?.state?.country?.cCountry_name].filter(Boolean);
//     if (line5Parts.length > 0) addressParts.push(line5Parts.join(', '));

//     return addressParts.length > 0 ? (
//       <>
//         <div className="flex items-start gap-1">
//           <span className="font-medium text-black">Address:</span>
//           <div className="flex flex-col">
//             {addressParts.map((part, index) => (
//               <span key={index} className="text-gray-700 break-words">{part}</span>
//             ))}
//           </div>
//         </div>
//       </>
//     ) : null;
//   };

//   return (
//     <Dialog open={showDetails} onClose={onClose} className="relative z-50">
//       <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" aria-hidden="true" />
//       <div className="fixed inset-0 flex items-center justify-center p-4">
//         <Dialog.Panel className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-white p-6 sm:p-8 rounded-2xl max-h-[90vh] overflow-y-auto shadow-lg relative transform transition-all duration-300 scale-100 opacity-100">
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="24"
//               height="24"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="feather feather-x"
//             >
//               <line x1="18" y1="6" x2="6" y2="18"></line>
//               <line x1="6" y1="6" x2="18" y2="18"></line>
//             </svg>
//           </button>

//           <Dialog.Title className="text-xl sm:text-2xl font-semibold text-black mb-6">
//             {formatName(profile?.clead_name)}'s Profile Details
//           </Dialog.Title>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base">
//             {/* Left Column - Basic Contact & Organization Details */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-black border-b pb-2 mb-2">
//                 Basic Information
//               </h3>

//               <DetailField label="Lead Name" value={profile.clead_name} />
//               <DetailField label="Organization Name" value={profile.corganization} />
//               <DetailField label="Website" value={profile.cwebsite} />
//               <DetailField label="No. of Employees" value={profile.ino_employee} />
//               <DetailField label="Project Value" value={profile.iproject_value ? `${profile.currency?.symbol || '' } ${profile.iproject_value} `
//                     : null}/>
//               <DetailField label="Email" value={profile.cemail} />
//               <DetailField label="Mobile Number" value={profile.iphone_no} />
//               <DetailField label="WhatsApp Number" value={profile.whatsapp_number} />
//               {/* address */}
//               {getFormattedAddress(profile)}
//             </div>

//             {/* Right Column - Lead & Industry Details */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-black border-b pb-2 mb-2">
//                 Lead & Industry Details
//               </h3>

//               <DetailField label="Lead Potential" value={profile.lead_potential?.clead_name} />
//               <DetailField label="Lead Status" value={profile.lead_status?.clead_name} />
//               <DetailField label="Industry" value={profile.industry?.cindustry_name} />
//               <DetailField label="Sub-Industry" value={profile.subindustry?.subindustry_name} />
//               <DetailField label="Source" value={profile.lead_sources?.source_name} />
//               <DetailField label="Sub-Source" value={profile.sub_src_lead?.sub_source?.ssub_src_name}/>
//               <DetailField label="Service" value={profile.service?.cservice_name} />
//               <DetailField label="Sub-Service" value={profile.subservice?.subservice_name} />
//             </div>
//           </div>

//           {profile.website_lead === true && (
//             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm text-sm mt-10 text-yellow-800 flex items-center gap-2">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-yellow-600 flex-shrink-0"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M8.257 3.344a1.5 1.5 0 012.986 0l2.376 6.07a1.5 1.5 0 01-.734 1.944l-4.136 1.84a1.5 1.5 0 01-1.944-.734l-6.07-2.376a1.5 1.5 0 01-.734-1.944l1.84-4.136a1.5 1.5 0 011.944-.734l2.376 6.07a.5.5 0 00.986-.388l-2.136-5.462a.5.5 0 00-.986.388l2.136 5.462a.5.5 0 00.388.986l5.462 2.136a.5.5 0 00.388-.986l-5.462-2.136z"
//                   clipRule="evenodd"
//                 />
//                 <path
//                   fillRule="evenodd"
//                   d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-7.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zM10 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               <p className="font-semibold">This lead originated from the website.</p>
//             </div>
//           )}
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// };

// export default LeadProfileView;