import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";

const ModuleControll = () => {
  const [modulesData, setModulesData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // --- CORRECTED: attributes now from module_table.attribute ---
  const groupedModules = useMemo(() => {
    if (!modulesData.length) return [];
    return modulesData.map((dataItem) => ({
      ...dataItem.module_table,
      attributes: dataItem.module_table.attribute || [],
    }));
  }, [modulesData]);

  // Fetch modules on load
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        let company_id = "";

        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(base64));
            company_id = payload.company_id;
          } catch (error) {
            console.error("Token decode error:", error);
            setError("Could not decode token for company ID.");
            return;
          }
        } else {
          console.error("Invalid or missing JWT token");
          setError("Authentication token is missing.");
          return;
        }

        const response = await axios.get(`${ENDPOINTS.MODULE_COMPANY}/${company_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setModulesData(response.data.data || []);
        // console.log("testing response", response)
      } catch (err) {
        setError(err.message || "Something went wrong fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Toggle module checkbox (update bactive true/false)
  const handleModuleChange = (id) => {
    setModulesData((prevData) =>
      prevData.map((dataItem) => {
        if (dataItem.module_table.imodule_id === id) {
          return {
            ...dataItem,
            module_table: {
              ...dataItem.module_table,
              bactive: !dataItem.module_table.bactive,
            },
          };
        }
        return dataItem;
      })
    );
  };

  // Toggle attribute checkbox (update bactive true/false)
  const handleAttributeChange = (moduleId, attributeId) => {
    setModulesData((prevData) =>
      prevData.map((dataItem) => {
        if (dataItem.module_table.imodule_id === moduleId) {
          return {
            ...dataItem,
            module_table: {
              ...dataItem.module_table,
              attribute: dataItem.module_table.attribute.map((attr) =>
                attr.iattribute_id === attributeId
                  ? { ...attr, bactive: !attr.bactive }
                  : attr
              ),
            },
          };
        }
        return dataItem;
      })
    );
  };

  // Toggle selected module for attribute display
  const handleModuleClick = (id) => {
    setSelectedModuleId(prevId => (prevId === id ? null : id)); // Toggle selection
  };

  // Get the attributes for the currently selected module
  const selectedModule = groupedModules.find(mod => mod.imodule_id === selectedModuleId);

  // 🌀 Loading and Error States
  if (loading) return <p className="p-4 text-gray-600">Loading Modules...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="relative w-full max-h-screen bg-[#f9f9f9] rounded-3xl shadow-md p-4 sm:p-6 lg:p-8 mt-4 border border-gray-200 overflow-y-scroll">
      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-3xl">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Heading */}
      <div className="border-t pt-10 mb-6 space-y-6">
        <h2 className="text-[20px] font-semibold text-gray-900 mb-4 border-b-2 border-blue-400 inline-block pb-1">
          Available Modules & Attributes
        </h2>

        {/* Module Checkboxes Grid */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Modules</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedModules.map((mod) => (
              <div
                key={mod.imodule_id}
                className={`bg-white border rounded-lg shadow-sm cursor-pointer transition-all ${selectedModuleId === mod.imodule_id ? 'border-blue-500 ring-2 ring-blue-500' : 'hover:bg-blue-50'}`}
                onClick={() => handleModuleClick(mod.imodule_id)}
              >
                <label
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={mod.bactive}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleModuleChange(mod.imodule_id);
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-gray-800 text-sm font-medium truncate">
                    {mod.cmodule_name}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Check out the checkbox to see the attribute of the modules</h3>


        {/* Attribute Checkboxes */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            {selectedModule ? `Attributes for: ${selectedModule.cmodule_name}` : 'Select a Module to view its Attributes'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedModule && selectedModule.attributes.length > 0 ? (
              selectedModule.attributes.map((attr) => (
                <label
                  key={attr.iattribute_id}
                  className="flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-2 cursor-pointer hover:bg-green-50 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={attr.bactive}
                    onChange={() => handleAttributeChange(selectedModule.imodule_id, attr.iattribute_id)}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-gray-800 text-sm font-medium truncate">
                    {attr.cattribute_name}
                  </span>
                </label>
              ))
            ) : selectedModule ? (
              <p className="col-span-4 text-gray-500">No attributes found for this module.</p>
            ) : (
              <p className="col-span-4 text-gray-500">Click on any module above to see its related attributes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleControll;
