import React, { useContext } from "react";
import { RoleContext } from "../../context/RoleContext";

const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200">
    <span className="text-gray-700 font-medium">{label}</span>
    <div
      onClick={onToggle}
      className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer ${
        isChecked ? "bg-green-600" : "bg-yellow-400"
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transition ${
          isChecked ? "translate-x-5" : ""
        }`}
      />
    </div>
  </div>
);

const UserEditForm = ({
  users,
  editFormData,
  handleChange,
  handleSubmit,
  handleFormClose,
  reportToUsers = [],
  handleToggleUserActive,
  handleToggleDCRM,
  isSubmitting,
}) => {

  /* ROLES FROM CONTEXT */
  const { roles } = useContext(RoleContext);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={handleFormClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleFormClose}
          className="absolute top-4 right-4 text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          Edit User Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ===== TWO COLUMN GRID ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium mb-1"> Employee Name </label>
              <input name="cFull_name" value={editFormData.cFull_name || ""} onChange={handleChange} className="w-full border p-3 rounded-lg" required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                name="cUser_name"
                value={editFormData.cUser_name || ""}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                required
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Title
              </label>
              <input
                name="cjob_title"
                value={editFormData.cjob_title || ""}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="cEmail"
                value={editFormData.cEmail || ""}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Role
              </label>
              <select
                name="irole_id"
                value={editFormData.irole_id || ""}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
              >
                <option value="">Select Role</option>
                {roles
                ?.filter(role =>
                    role.bactive === true &&
                    !["Cmaster_reseller", "Creseller", "God", "Reseller"].includes(role.eRole_type)
                )
                .map(role => (
                    <option key={role.irole_id} value={role.irole_id}>
                    {role.cRole_name}
                    </option>
                ))}

              </select>
            </div>

            {/* Reports To */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reports To
              </label>
              <select name="reports_to" value={editFormData.reports_to || ""} onChange={handleChange} className="w-full border p-3 rounded-lg" >
                <option value="">Select Manager</option>
                {reportToUsers
                  .filter(user => user.bactive === true)
                  .map(user => (
                    <option key={user.iUser_id} value={user.iUser_id}>
                      {user.cFull_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Business Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Business Phone Number </label>
              <input name="i_bPhone_no" value={editFormData.i_bPhone_no || ""} onChange={handleChange} className="w-full border p-3 rounded-lg" />
            </div>

            {/* Personal Phone */}
            <div>
              <label className="block text-sm font-medium mb-1"> Personal Phone Number </label>
              <input  name="iphone_no" value={editFormData.iphone_no || ""} onChange={handleChange} className="w-full border p-3 rounded-lg" />
            </div>
          </div>

          {/* ===== TOGGLES  ===== */}
          <div className="border-t pt-4 space-y-2">
            <ToggleSwitch
              label="User Active"
              isChecked={users.bactive}
              onToggle={handleToggleUserActive}
            />

            <ToggleSwitch
              label="DCRM Access"
              isChecked={users.DCRM_enabled === true}
              onToggle={handleToggleDCRM}
            />
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserEditForm;




// import React from "react";
// import { RoleContext } from "../../context/RoleContext";


// const ToggleSwitch = ({ label, isChecked, onToggle }) => (
//   <div className="flex justify-between items-center py-3 border-b border-gray-200">
//     <span className="text-gray-700 font-medium">{label}</span>
//     <div
//       onClick={onToggle}
//       className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer ${
//         isChecked ? "bg-green-600" : "bg-yellow-400"
//       }`}
//     >
//       <div
//         className={`bg-white w-5 h-5 rounded-full shadow-md transition ${
//           isChecked ? "translate-x-5" : ""
//         }`}
//       />
//     </div>
//   </div>
// );

// const UserEditForm = ({
//   users,
//   editFormData,
//   handleChange,
//   handleSubmit,
//   handleFormClose,
//   reportToUsers = [],
//   roles = [],
//   handleToggleUserActive,
//   handleToggleDCRM,
//   isSubmitting,
// }) => {
//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
//       onClick={handleFormClose}
//     >
//       <div
//         className="bg-white rounded-xl p-6 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-y-auto relative"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={handleFormClose}
//           className="absolute top-4 right-4 text-gray-600"
//         >
//           ✕
//         </button>

//         <h2 className="text-2xl font-bold text-center mb-6">
//           Edit User Details
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-6">

//           {/* ===== TWO COLUMN GRID ===== */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//             {/* Employee Name */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Employee Name
//               </label>
//               <input
//                 name="cFull_name"
//                 value={editFormData.cFull_name || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//                 required
//               />
//             </div>

//             {/* Username */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Username
//               </label>
//               <input
//                 name="cUser_name"
//                 value={editFormData.cUser_name || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//                 required
//               />
//             </div>

//             {/* Job Title */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Job Title
//               </label>
//               <input
//                 name="cjob_title"
//                 value={editFormData.cjob_title || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 name="cEmail"
//                 value={editFormData.cEmail || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//                 required
//               />
//             </div>

//             {/* Role (AUTO FETCHED) */}
//             <div>
//             <label className="block text-sm font-medium">Role</label>
//                 <select name="irole_id" value={editFormData.irole_id || ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" >
//                     <option value="">Select Role</option>
//                     {roles.map(role => (
//                     <option key={role.irole_id} value={role.irole_id}>
//                         {role.cRole_name}
//                     </option>
//                     ))}
//                 </select>
//             </div>


//             {/* <div>
//               <label className="block text-sm font-medium mb-1">
//                 Role
//               </label>
//               <select
//                 name="irole_id"
//                 value={editFormData.irole_id || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//               >
//                 <option value="">Select Role</option>
//                 {roles.map((role) => (
//                   <option key={role.irole_id} value={role.irole_id}>
//                     {role.cRole_name}
//                   </option>
//                 ))}
//               </select>
//             </div> */}

//             {/* Reports To  */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Reports To
//               </label>
//               <select
//                 name="reports_to"
//                 value={editFormData.reports_to || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//               >
//                 <option value="">Select Manager</option>
//                 {reportToUsers.map((user) => (
//                   <option key={user.iUser_id} value={user.iUser_id}>
//                     {user.cFull_name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Business Phone */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Business Phone Number
//               </label>
//               <input
//                 name="i_bPhone_no"
//                 value={editFormData.i_bPhone_no || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//               />
//             </div>

//             {/* Personal Phone */}
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Personal Phone Number
//               </label>
//               <input
//                 name="iphone_no"
//                 value={editFormData.iphone_no || ""}
//                 onChange={handleChange}
//                 className="w-full border p-3 rounded-lg"
//               />
//             </div>
//           </div>

//           {/* ===== TOGGLES (UNCHANGED) ===== */}
//           <div className="border-t pt-4 space-y-2">
//             <ToggleSwitch
//               label="User Active"
//               isChecked={users.bactive}
//               onToggle={handleToggleUserActive}
//             />

//             <ToggleSwitch
//               label="DCRM Access"
//               isChecked={users.DCRM_enabled === true}
//               onToggle={handleToggleDCRM}
//             />
//           </div>

//           {/* SAVE BUTTON */}
//           <div className="flex justify-center pt-6">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>

//         </form>
//       </div>
//     </div>
//   );
// };

// export default UserEditForm;
