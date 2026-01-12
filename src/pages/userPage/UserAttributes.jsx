import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";

export default function UserAttributes({ userId }) {
  const [modules, setModules] = useState({});

  useEffect(() => {
    if (!userId) return;

    const fetchUserAttributes = async () => {
      try {
        const token = localStorage.getItem("token");
        const url = `${ENDPOINTS.USER_ACCESS}/${userId}`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const attributes = response.data?.attributes || [];
        const grouped = attributes.reduce((acc, attr) => {
          const moduleName = attr.moduleName?.trim() || "Unknown";
          if (!acc[moduleName]) acc[moduleName] = [];
          acc[moduleName].push(attr);
          return acc;
        }, {});

        setModules(grouped);
      } catch (error) {
        console.error("❌ Error fetching user attributes:", error);
      }
    };

    fetchUserAttributes();
  }, [userId]);

  const handleCheckboxChange = async (moduleName, attrId, checked) => {
    const token = localStorage.getItem("token");
    const url = `${ENDPOINTS.USERACCESS_CHANGE}/${attrId}/status`;

    try {
      await axios.put(
        url,
        { status: checked },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setModules((prev) => ({
        ...prev,
        [moduleName]: prev[moduleName].map((a) =>
          a.iua_id === attrId ? { ...a, bactive: checked } : a
        ),
      }));
    } catch (error) {
      console.error("❌ Error updating attribute:", error);
    }
  };

  return (
    <>
    <p className="text-center mt-5 w-full font-extrabold text-3xl  mb-8 border-b-4 border-blue-400 pb-3 animate-fade-in-down items-center text-blue-900">User Access Control</p>
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">

      
      {Object.keys(modules).length === 0 ? (
        <p className="text-gray-500 italic">No modules found for this user.</p>
      ) : (
        Object.keys(modules).map((moduleName) => (
          <div
            key={moduleName}
            className="bg-white rounded-lg shadow-lg p-5 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">
              {moduleName}
            </h2>
            <ul className="space-y-3">
              {modules[moduleName].map((attr) => (
                <li key={attr.iua_id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={attr.bactive}
                    onChange={(e) =>
                      handleCheckboxChange(moduleName, attr.iua_id, e.target.checked)
                    }
                    className="h-5 w-5 accent-green-600"
                  />
                  <span className="text-gray-800 font-medium">{attr.attributeName}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
    </>
  );
}
