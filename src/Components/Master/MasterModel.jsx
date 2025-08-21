import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { PlusCircle, Edit, Trash2, X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { IntroModal } from "./IntroModal";

const formatMasterName = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const getNestedObject = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export default function MasterModal({
  master,
  onClose,
  companyId,
  userId,
  masterConfigs,
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [existingItems, setExistingItems] = useState([]);
  const [groupedHierarchicalItems, setGroupedHierarchicalItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [isLoadingParentOptions, setIsLoadingParentOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openParents, setOpenParents] = useState({});
  const [showIntro, setShowIntro] = useState(true);

  const isLabelMaster = useMemo(
    () => master?.title === "Label Master",
    [master]
  );

  const areLabelFieldsEmpty = useMemo(() => {
    if (!isLabelMaster) return false;
    const requiredLabelFields = [
      "leadFormTitle",
      "section1Label",
      "section2Label",
      "section3Label",
    ];
    return requiredLabelFields.every(
      (field) => !formData[field] || formData[field].length === 0
    );
  }, [formData, isLabelMaster]);

  const [allLeadSourceItems, setAllLeadSourceItems] = useState([]);
  const [isLoadingAllLeadSourceItems, setIsLoadingAllLeadSourceItems] = useState(false);

  const industryConfig = masterConfigs?.INDUSTRY;
  const subIndustryConfig = masterConfigs?.SUB_INDUSTRIES;
  const leadSourceConfig = masterConfigs?.LEAD_SOURCE;

  const groupSubItemsByParent = (items, config) => {
    if (!config || !config.isHierarchical || !config.parentMasterConfig) {
      return [];
    }

    const parentIdKey = config.parentMasterConfig.parentIdInChildResponseKey || "parentId";
    const parentNameKey = config.parentMasterConfig.nameKey || "name";
    const childPayloadKey = config.payloadKey;

    const grouped = items.reduce((acc, item) => {
      const parentId = item[parentIdKey];
      if (!acc[parentId]) {
        acc[parentId] = {
          parentId,
          children: []
        };
      }
      acc[parentId].children.push(item);
      return acc;
    }, {});

    return Object.values(grouped).map(group => ({
      ...group,
      parentName: parentOptions.find(p => p[config.parentMasterConfig.idKey] === group.parentId)?.[parentNameKey] || "Unknown Parent"
    }));
  };

  const groupedSubItems = useMemo(() => {
    if (!master?.isHierarchical) return [];
    
    const grouped = groupSubItemsByParent(existingItems, master);
    
    if (!searchTerm) return grouped;
    
    return grouped.map(group => ({
      ...group,
      children: group.children.filter(child => {
        const mainField = child[master.payloadKey]?.toString().toLowerCase() || '';
        return mainField.includes(searchTerm);
      })
    })).filter(group => group.children.length > 0);
  }, [existingItems, master, parentOptions, searchTerm]);

  const filteredItems = useMemo(() => {
    if (!searchTerm || master?.isHierarchical) return existingItems;
    return existingItems.filter(item => {
      const mainField = item[master.payloadKey]?.toString().toLowerCase() || '';
      return mainField.includes(searchTerm);
    });
  }, [existingItems, searchTerm, master]);

  const filteredGroupedItems = useMemo(() => {
    if (!searchTerm) return groupedHierarchicalItems;
    return groupedHierarchicalItems.map(industry => ({
      ...industry,
      children: industry.children?.filter(subindustry => {
        const subField = subindustry[subIndustryConfig?.payloadKey]?.toString().toLowerCase() || '';
        return subField.includes(searchTerm);
      }) || []
    })).filter(industry => industry.children.length > 0);
  }, [groupedHierarchicalItems, searchTerm, subIndustryConfig?.payloadKey]);

  const shouldFieldBeRendered = useCallback(
    (fieldName, currentFormData) => {
      if (!master.conditionalFields || master.conditionalFields.length === 0) {
        return true;
      }

      const rule = master.conditionalFields.find(
        (rule) => rule.fieldName === fieldName
      );
      if (!rule) {
        return true;
      }

      const dependsOnValue = currentFormData[rule.dependsOn];
      let conditionMet = false;

      switch (rule.operator) {
        case "===":
          conditionMet = dependsOnValue === rule.value;
          break;
        case "!==":
          conditionMet = dependsOnValue !== rule.value;
          break;
        case ">":
          conditionMet = dependsOnValue > rule.value;
          break;
        case "<":
          conditionMet = dependsOnValue < rule.value;
          break;
        case ">=":
          conditionMet = dependsOnValue >= rule.value;
          break;
        case "<=":
          conditionMet = dependsOnValue <= rule.value;
          break;
        case "includes":
          conditionMet =
            Array.isArray(dependsOnValue) &&
            dependsOnValue.includes(rule.value);
          break;
        case "excludes":
          conditionMet =
            Array.isArray(dependsOnValue) &&
            !dependsOnValue.includes(rule.value);
          break;
        case "truthy":
          conditionMet = !!dependsOnValue;
          break;
        case "falsy":
          conditionMet = !dependsOnValue;
          break;
        default:
          conditionMet = true;
      }
      return conditionMet;
    },
    [master.conditionalFields]
  );

  const fetchItems = useCallback(async () => {
    if (!master || !master.get) return;

    setIsLoadingItems(true);
    setApiError(null);
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const response = await axios.get(master.get, { headers });

      if (
        master.title === subIndustryConfig?.title &&
        master.get === industryConfig?.get
      ) {
        const industries = getNestedObject(
          response.data,
          industryConfig.responseKey
        );
        const subindustries = getNestedObject(
          response.data,
          subIndustryConfig.responseKey
        );

        if (Array.isArray(industries) && Array.isArray(subindustries)) {
          const grouped = industries.map((industry) => {
            return {
              [industryConfig.idKey]: industry[industryConfig.idKey],
              [industryConfig.payloadKey]: industry[industryConfig.payloadKey],
              children: subindustries.filter(
                (sub) =>
                  sub[
                    subIndustryConfig.parentMasterConfig
                      ?.parentIdInChildResponseKey || ""
                  ] === industry[industryConfig.idKey]
              ),
            };
          });
          setGroupedHierarchicalItems(grouped);
          setExistingItems([]);
        } else {
          console.warn(
            "Hierarchical data expected but not found or not arrays.",
            { industries, subindustries }
          );
          setGroupedHierarchicalItems([]);
          setExistingItems([]);
        }
      } else {
        let items = getNestedObject(response.data, master.responseKey);

        if (items && typeof items === "object" && !Array.isArray(items)) {
          items = [items];
        }

        setExistingItems(Array.isArray(items) ? items : []);
        setGroupedHierarchicalItems([]);
      }
      setApiError(null);
    } catch (error) {
      let errorMessage = `Failed to fetch ${master.title} items.`;
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          errorMessage;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingItems(false);
    }
  }, [master, industryConfig, subIndustryConfig]);

  const fetchAllLeadSourceItems = useCallback(async () => {
    if (!leadSourceConfig || !leadSourceConfig.get) return;
    
    setIsLoadingAllLeadSourceItems(true);
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const response = await axios.get(leadSourceConfig.get, { headers });
      const items = getNestedObject(response.data, leadSourceConfig.responseKey);
      setAllLeadSourceItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to fetch all lead source items:", error);
      toast.error("Failed to load lead source options.");
      setAllLeadSourceItems([]);
    } finally {
      setIsLoadingAllLeadSourceItems(false);
    }
  }, [leadSourceConfig]);

  useEffect(() => {
    if (master) {
      setFormData({});
      setSelectedItemForEdit(null);
      fetchItems();
      if (master.title === leadSourceConfig?.title) {
        fetchAllLeadSourceItems();
      }
    }
  }, [master, fetchItems, leadSourceConfig, fetchAllLeadSourceItems]);

  useEffect(() => {
    const fetchParentOptions = async () => {
      if (
        !master ||
        !master.isHierarchical ||
        !master.parentMasterConfig ||
        !master.parentMasterConfig.getEndpoint
      ) {
        setParentOptions([]);
        return;
      }

      setIsLoadingParentOptions(true);
      setApiError(null);
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const response = await axios.get(
          master.parentMasterConfig.getEndpoint,
          { headers }
        );
        const parents = getNestedObject(
          response.data,
          master.parentMasterConfig.responseKey
        );

        if (Array.isArray(parents)) {
          setParentOptions(parents);
        } else {
          setParentOptions([]);
          toast.warn(
            `Could not load parent options for ${master.title}. Check parentMasterConfig.responseKey.`
          );
        }
      } catch (error) {
        let errorMessage = `Failed to fetch parent options for ${master.title}.`;
        if (axios.isAxiosError(error) && error.response) {
          errorMessage =
            error.response.data.message ||
            error.response.data.error ||
            errorMessage;
        }
        setApiError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingParentOptions(false);
      }
    };

    if (master && master.isHierarchical && master.parentMasterConfig) {
      fetchParentOptions();
    } else {
      setParentOptions([]);
    }
  }, [master]);

  useEffect(() => {
    if (!master) return;

    let newFormData = {};

    if (selectedItemForEdit) {
      if (selectedItemForEdit.isSubIndustry && subIndustryConfig) {
        const parentIdKey =
          subIndustryConfig.parentMasterConfig?.parentIdInChildResponseKey ||
          "industryParent";
        const formParentKey =
          subIndustryConfig.parentMasterConfig?.formFieldKey ||
          "industryParent";

        newFormData = {
          [subIndustryConfig.payloadKey]:
            selectedItemForEdit[subIndustryConfig.payloadKey] || "",
          [formParentKey]:
            selectedItemForEdit[parentIdKey] !== undefined
              ? Number(selectedItemForEdit[parentIdKey])
              : null,
          [subIndustryConfig.idKey]:
            selectedItemForEdit[subIndustryConfig.idKey],
          ...(subIndustryConfig.activeStatusPayloadKey && {
            [subIndustryConfig.activeStatusPayloadKey]:
              selectedItemForEdit[subIndustryConfig.activeStatusPayloadKey] ||
              false,
          }),
        };
      } else {
        newFormData = { ...selectedItemForEdit };
      }
    } else {
      newFormData = { ...master.basePostPayload };

      if (master.isHierarchical && master.parentMasterConfig) {
        const formParentKey =
          master.parentMasterConfig.formFieldKey || "parentId";
        newFormData[formParentKey] = null;
      }
    }

    setFormData(newFormData);
  }, [
    selectedItemForEdit,
    master,
    subIndustryConfig,
    industryConfig,
    leadSourceConfig,
  ]);

const stripHtml = (html) => {
  if (!html) return '';
  // Convert <p> tags to newlines for good formatting
  let text = html.replace(/<\/?p[^>]*>/gi, '\n');
  // Replace <br> with newline
  text = text.replace(/<\/?br[^>]*>/gi, '\n');
  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Replace multiple newlines with single newline
  text = text.replace(/\n\s*\n/g, '\n');
  return text.trim();
};




  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      let newValue = value;
      
      if (name === master.payloadKey) {
        newValue = formatMasterName(value);
      }
      
      if (
        master.isHierarchical &&
        master.parentMasterConfig &&
        name === (master.parentMasterConfig.formFieldKey || "parentId")
      ) {
        newValue = value === "" ? null : Number(value);
      } else if (type === "checkbox") {
        newValue = checked;
      } else if (name === "orderId" && type === "number") {
        newValue = value === "" ? null : Number(value);
      } else if (name === "parentLeadSourceId") {
        newValue = value === "" ? null : Number(value);
      }
      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const validateMasterName = (name, masterType) => {
    if (!name) return `${masterType} name is required`;
    if (name.length < 2)
      return `${masterType} name must be at least 2 characters`;
    if (name.length > 50)
      return `${masterType} name cannot exceed 50 characters`;
    return null;
  };

  const handleSave = async () => {
    if (!master) {
      toast.error("Master configuration is missing. Cannot save.");
      return;
    }

    const nameField = master.payloadKey;
    const nameValue = formData[nameField];
    const validationError = validateMasterName(nameValue, master.title);

    if (validationError) {
      setApiError(validationError);
      return;
    }

    // Check for duplicate entry
    const isDuplicate = existingItems.some(item => {
      if (selectedItemForEdit && item[master.idKey] === selectedItemForEdit[master.idKey]) {
        return false;
      }
      return item[master.payloadKey].toLowerCase() === formData[master.payloadKey].toLowerCase();
    });

    if (isDuplicate) {
      setApiError(`${master.title} with this name already exists`);
      toast.error(`${master.title} with this name already exists`);
      return;
    }

    if (
      formData[master.payloadKey]?.length < 2 ||
      formData[master.payloadKey]?.length > 50
    ) {
      setApiError(
        `${master.modalKey || master.title} must be between 2-50 characters`
      );
      return;
    }

    setIsSaving(true);
    setApiError(null);

    if (
      master.title === leadSourceConfig?.title &&
      formData.orderId !== undefined &&
      master.orderIdMustBeOne &&
      formData.orderId !== 1
    ) {
      setApiError("Order ID for Lead Source must be 1.");
      toast.error("Order ID for Lead Source must be 1.");
      setIsSaving(false);
      return;
    }

    const isEditing = selectedItemForEdit && selectedItemForEdit[master.idKey];
    const currentSaveMasterConfig =
      selectedItemForEdit?.isSubIndustry && subIndustryConfig
        ? subIndustryConfig
        : master;

    const url = isEditing
      ? typeof currentSaveMasterConfig.put === "function"
        ? currentSaveMasterConfig.put(
            selectedItemForEdit[currentSaveMasterConfig.idKey]
          )
        : currentSaveMasterConfig.put
      : currentSaveMasterConfig.post;
    const method = isEditing ? "PUT" : "POST";

    let payload = {};

    const fieldsToMap =
      isEditing &&
      currentSaveMasterConfig.putPayloadFields &&
      Array.isArray(currentSaveMasterConfig.putPayloadFields)
        ? currentSaveMasterConfig.putPayloadFields
        : !isEditing &&
          currentSaveMasterConfig.postPayloadFields &&
          Array.isArray(currentSaveMasterConfig.postPayloadFields)
        ? currentSaveMasterConfig.postPayloadFields
        : Object.keys(formData);

    fieldsToMap.forEach((field) => {
      if (master.title === "Label Master" && isEditing) {
        if (field === "iformLabelMasterId") {
          payload["formLabelMastersId"] = formData.iformLabelMasterId;
          return;
        } else if (
          field === "icompany_id" &&
          formData.icompany_id !== undefined
        ) {
          payload["icompany_id"] = formData.icompany_id;
          return;
        }
      }

      if (Object.hasOwn(formData, field) && formData[field] !== undefined) {
        const apiPayloadKey =
          currentSaveMasterConfig.payloadMapping?.[field] || field;
        payload[apiPayloadKey] = formData[field];
      }
    });

    if (isEditing) {
      payload = { ...currentSaveMasterConfig.basePutPayload, ...payload };
      if (
        currentSaveMasterConfig.idLocation === "body" &&
        currentSaveMasterConfig.idKey &&
        selectedItemForEdit &&
        master.title !== "Label Master"
      ) {
        const mappedIdKey =
          currentSaveMasterConfig.payloadMapping?.[
            currentSaveMasterConfig.idKey
          ] || currentSaveMasterConfig.idKey;
        if (!Object.hasOwn(payload, mappedIdKey)) {
          payload[mappedIdKey] =
            selectedItemForEdit[currentSaveMasterConfig.idKey];
        }
      }
    } else {
      payload = { ...currentSaveMasterConfig.basePostPayload, ...payload };
      const mappedIdKey =
        currentSaveMasterConfig.payloadMapping?.[
          currentSaveMasterConfig.idKey
        ] || currentSaveMasterConfig.idKey;
      if (
        Object.hasOwn(payload, mappedIdKey) &&
        !currentSaveMasterConfig.sendIdForPost &&
        master.title !== "Label Master"
      ) {
        delete payload[mappedIdKey];
      }
    }

    if (
      !currentSaveMasterConfig.skipCompanyIdInjection &&
      companyId !== null &&
      companyId !== undefined &&
      master.title !== "Label Master"
    ) {
      const companyIdApiField =
        currentSaveMasterConfig.payloadMapping?.icompany_id || "icompany_id";
      if (companyIdApiField) {
        payload[companyIdApiField] = companyId;
      }
    }

    const modifierKey =
      typeof currentSaveMasterConfig.modifierIdPayloadKey === "object"
        ? isEditing
          ? currentSaveMasterConfig.modifierIdPayloadKey.put
          : currentSaveMasterConfig.modifierIdPayloadKey.post
        : currentSaveMasterConfig.modifierIdPayloadKey;
    if (modifierKey && userId !== null && userId !== undefined) {
      const mappedModifierKey =
        currentSaveMasterConfig.payloadMapping?.[modifierKey] || modifierKey;
      if (mappedModifierKey) {
        payload[mappedModifierKey] = userId;
      }
    }

    const updatedDtKey =
      typeof currentSaveMasterConfig.updatedDtPayloadKey === "object"
        ? isEditing
          ? currentSaveMasterConfig.updatedDtPayloadKey.put
          : currentSaveMasterConfig.updatedDtPayloadKey.post
        : currentSaveMasterConfig.updatedDtPayloadKey;
    if (updatedDtKey) {
      const mappedUpdatedDtKey =
        currentSaveMasterConfig.payloadMapping?.[updatedDtKey] || updatedDtKey;
      if (mappedUpdatedDtKey) {
        payload[mappedUpdatedDtKey] = new Date().toISOString();
      }
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (method === "POST") {
        await axios.post(url, payload, { headers });
      } else if (method === "PUT") {
        await axios.put(url, payload, { headers });
      } else {
        throw new Error("Unsupported HTTP method for saving.");
      }

      toast.success(`${currentSaveMasterConfig.title} saved successfully!`);

      setSelectedItemForEdit(null);
      const newEntryFormData = { ...currentSaveMasterConfig.basePostPayload };
      if (
        currentSaveMasterConfig.activeStatusPayloadKey &&
        newEntryFormData[currentSaveMasterConfig.activeStatusPayloadKey] ===
          undefined
      ) {
        newEntryFormData[currentSaveMasterConfig.activeStatusPayloadKey] = true;
      }
      if (
        currentSaveMasterConfig.isHierarchical &&
        currentSaveMasterConfig.parentMasterConfig
      ) {
        const formParentKey =
          currentSaveMasterConfig.parentMasterConfig.formFieldKey || "parentId";
        newEntryFormData[formParentKey] = null;
      }
      if (
        (master.title === "Lead Status" || master.title === "Potential") &&
        newEntryFormData.orderId !== undefined
      ) {
        newEntryFormData.orderId = "";
      }
      if (master.title === leadSourceConfig?.title) {
        newEntryFormData.parentLeadSourceId = null;
      }
      setFormData(newEntryFormData);

      await fetchItems();
      if (master.title === leadSourceConfig?.title) {
        fetchAllLeadSourceItems();
      }
    } catch (error) {
      let errorMessage = `Failed to save ${currentSaveMasterConfig.title}.`;
      if (axios.isAxiosError(error) && error.response) {
        if (
          error.response.data &&
          Array.isArray(error.response.data.issues) &&
          error.response.data.issues.length > 0
        ) {
          errorMessage = `Validation Error: ${error.response.data.issues
            .map(
              (issue) => issue.message || issue.field || JSON.stringify(issue)
            )
            .join("; ")}`;
        } else {
          errorMessage =
            error.response.data.message ||
            error.response.data.error ||
            `Server Error: ${error.response.status}`;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        errorMessage =
          "No response from server. Please check your network connection.";
      } else {
        errorMessage = error.message;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!master) {
      toast.error("Master configuration is missing. Cannot delete.");
      return;
    }

    setIsDeleting(true);
    setApiError(null);

    const itemToDelete = existingItems.find(
      (item) => item[master.idKey] === itemId
    );

    if (!master.delete) {
      toast.error(`Delete endpoint not configured for ${master.title}.`);
      setIsDeleting(false);
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${
        itemToDelete?.[master.payloadKey] || "this item"
      }"?`
    );
    if (!confirmDelete) {
      setIsDeleting(false);
      return;
    }

    const url =
      typeof master.delete === "function"
        ? master.delete(itemId, itemToDelete)
        : master.delete;

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let deletePayload = {};
      const mappedIdKey = master.payloadMapping?.[master.idKey] || master.idKey;

      if (itemId !== undefined && itemId !== null) {
        deletePayload[mappedIdKey] = itemId;
      }

      if (master.baseDeletePayload) {
        deletePayload = { ...master.baseDeletePayload, ...deletePayload };
      }

      if (
        master.activeStatusPayloadKey &&
        !Object.hasOwn(deletePayload, master.activeStatusPayloadKey)
      ) {
        const mappedActiveKey =
          master.payloadMapping?.[master.activeStatusPayloadKey] ||
          master.activeStatusPayloadKey;
        deletePayload[mappedActiveKey] = false;
      }

      const deleteModifierKey =
        typeof master.modifierIdPayloadKey === "object"
          ? master.modifierIdPayloadKey.delete
          : master.modifierIdPayloadKey;
      if (deleteModifierKey && userId !== null && userId !== undefined) {
        const mappedDeleteModifierKey =
          master.payloadMapping?.[deleteModifierKey] || deleteModifierKey;
        if (mappedDeleteModifierKey) {
          deletePayload[mappedDeleteModifierKey] = userId;
        }
      }

      const deleteUpdatedDtKey =
        typeof master.updatedDtPayloadKey === "object"
          ? master.updatedDtPayloadKey.delete
          : master.updatedDtPayloadKey;
      if (deleteUpdatedDtKey) {
        const mappedDeleteUpdatedDtKey =
          master.payloadMapping?.[deleteUpdatedDtKey] || deleteUpdatedDtKey;
        if (mappedDeleteUpdatedDtKey) {
          deletePayload[mappedDeleteUpdatedDtKey] = new Date().toISOString();
        }
      }

      const sendPayloadInBody = master.idLocation === "body";

      if (sendPayloadInBody) {
        if (Object.keys(deletePayload).length === 0) {
          console.warn(
            `Attempting to send DELETE with empty body. Ensure master.idKey and baseDeletePayload are configured correctly.`
          );
        }
        await axios.delete(url, { data: deletePayload, headers: headers });
      } else {
        await axios.delete(url, { headers: headers });
      }

      toast.success(`${master.title} deleted successfully!`);

      setSelectedItemForEdit(null);
      const newEntryFormData = { ...master.basePostPayload };
      if (
        master.activeStatusPayloadKey &&
        newEntryFormData[master.activeStatusPayloadKey] === undefined
      ) {
        newEntryFormData[master.activeStatusPayloadKey] = true;
      }
      if (master.isHierarchical && master.parentMasterConfig) {
        const formParentKey =
          master.parentMasterConfig.formFieldKey || "parentId";
        newEntryFormData[formParentKey] = null;
      }
      if (
        (master.title === "Lead Status" || master.title === "Potential") &&
        newEntryFormData.orderId !== undefined
      ) {
        newEntryFormData.orderId = "";
      }
      if (master.title === leadSourceConfig?.title) {
        newEntryFormData.parentLeadSourceId = null;
      }
      setFormData(newEntryFormData);

      await fetchItems();
      if (master.title === leadSourceConfig?.title) {
        fetchAllLeadSourceItems();
      }
    } catch (error) {
      let errorMessage = `Failed to delete ${master.title}.`;
      if (axios.isAxiosError(error) && error.response) {
        if (
          error.response.data &&
          Array.isArray(error.response.data.issues) &&
          error.response.data.issues.length > 0
        ) {
          errorMessage = `Validation Error: ${error.response.data.issues
            .map(
              (issue) => issue.message || issue.field || JSON.stringify(issue)
            )
            .join("; ")}`;
        } else {
          errorMessage =
            error.response.data.message ||
            error.response.data.error ||
            `Server Error: ${error.response.status}`;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        errorMessage =
          "No response from server during delete. Please check your network.";
      } else {
        errorMessage = error.message;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubIndustryClick = (subIndustryItem) => {
    setSelectedItemForEdit({ ...subIndustryItem, isSubIndustry: true });

    if (subIndustryConfig) {
      const parentIdKeyInResponse =
        subIndustryConfig.parentMasterConfig?.parentIdInChildResponseKey ||
        "industryParent";
      const formParentKey =
        subIndustryConfig.parentMasterConfig?.formFieldKey || "industryParent";

      const newFormData = {
        [subIndustryConfig.payloadKey]:
          subIndustryItem[subIndustryConfig.payloadKey] || "",
        [formParentKey]:
          subIndustryItem[parentIdKeyInResponse] !== undefined
            ? Number(subIndustryItem[parentIdKeyInResponse])
            : null,
        [subIndustryConfig.idKey]: subIndustryItem[subIndustryConfig.idKey],
        ...(subIndustryConfig.activeStatusPayloadKey && {
          [subIndustryConfig.activeStatusPayloadKey]:
            subIndustryItem[subIndustryConfig.activeStatusPayloadKey] || false,
        }),
      };

      setFormData(newFormData);
    }
  };

  const handleDeleteSubIndustryClick = async (subIndustryItem) => {
    if (!subIndustryConfig) {
      toast.error("Sub-Industry configuration not available for delete.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${
        subIndustryItem[subIndustryConfig.payloadKey]
      }"?`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    setApiError(null);

    try {
      const itemId = subIndustryItem[subIndustryConfig.idKey];
      if (!itemId) {
        throw new Error("Sub-Industry ID is missing for deletion.");
      }
      const deleteUrl = subIndustryConfig.delete(itemId, subIndustryItem);

      if (
        subIndustryConfig.idLocation === "body" &&
        Object.keys(subIndustryConfig.baseDeletePayload || {}).length > 0
      ) {
        const deletePayload = {
          ...(subIndustryConfig.baseDeletePayload || {}),
          [subIndustryConfig.payloadMapping?.[subIndustryConfig.idKey] ||
          subIndustryConfig.idKey]: itemId,
        };
        const modifierKey =
          typeof subIndustryConfig.modifierIdPayloadKey === "object"
            ? subIndustryConfig.modifierIdPayloadKey.delete
            : subIndustryConfig.modifierIdPayloadKey;
        if (modifierKey && userId !== null && userId !== undefined) {
          deletePayload[modifierKey] = userId;
        }
        const updatedDtKey =
          typeof subIndustryConfig.updatedDtPayloadKey === "object"
            ? subIndustryConfig.updatedDtPayloadKey.delete
            : undefined;
        if (updatedDtKey) {
          deletePayload[updatedDtKey] = new Date().toISOString();
        }

        await axios.delete(deleteUrl, {
          data: deletePayload,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await axios.delete(deleteUrl, {
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success(
        `${subIndustryItem[subIndustryConfig.payloadKey]} deleted successfully!`
      );
      await fetchItems();
    } catch (error) {
      let errorMessage = `Failed to delete ${
        subIndustryItem[subIndustryConfig.payloadKey]
      }.`;
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          `Server Error: ${error.response.status}`;
      } else if (axios.isAxiosError(error) && error.request) {
        errorMessage =
          "No response from server during delete. Please check your network.";
      } else {
        errorMessage = error.message;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLeadSourceOptions = React.useMemo(() => {
    if (
      master.title !== leadSourceConfig?.title ||
      formData.orderId === undefined ||
      formData.orderId === null ||
      formData.orderId === ""
    ) {
      return [];
    }
    const orderIdValue = Number(formData.orderId);
    const mappedOrderIdKey =
      leadSourceConfig?.payloadMapping?.orderId || "orderId";

    return allLeadSourceItems.filter(
      (item) =>
        item[mappedOrderIdKey] === orderIdValue &&
        item[leadSourceConfig.idKey] !==
          (selectedItemForEdit
            ? selectedItemForEdit[leadSourceConfig.idKey]
            : null)
    );
  }, [
    formData.orderId,
    allLeadSourceItems,
    master.title,
    leadSourceConfig,
    selectedItemForEdit,
  ]);

  const parentLabel =
    master.isHierarchical && master.parentMasterConfig
      ? master.parentMasterConfig.modalLabel ||
        `Parent ${master.parentMasterConfig.title || "Item"}`
      : "";

  const formParentKey =
    master.isHierarchical && master.parentMasterConfig
      ? master.parentMasterConfig.formFieldKey || "parentId"
      : null;

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
  ];

  if (!master) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Error: Master configuration not provided.
          </h2>
          <p>
            Please ensure a valid master configuration is passed to the modal.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return <IntroModal masterTitle={master.title} onClose={() => setShowIntro(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">
          {master.title} Master
        </h2>
        <button
          onClick={onClose}
          className="related top-10 right-10 ms-[800px] mt-[-65px] text-gray-500 hover:text-gray-700 text-3xl font-bold"
        >
          &times;
        </button>

        {apiError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <div className="flex flex-1 mt-10 overflow-hidden">
          {/* Existing Items List (Left Side) */}
          <div className="w-1/2 pr-4 overflow-y-auto border-r border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-blue-700">
              Existing {master.title}
            </h3>
            
            {/* Search Bar */}
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder={`Search ${master.title}...`}
                className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <svg
                className="absolute left-2.5 top-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>

            {isLoadingItems ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading items...</p>
              </div>
            ) : (
              <>
                {master.isHierarchical ? (
                  <div className="space-y-4">
                    {groupedSubItems.length > 0 ? (
                      groupedSubItems.map(group => (
                        <div key={group.parentId} className="mb-4 border rounded-md">
                          {/* Parent Section Header */}
                          <div
                            onClick={() =>
                              setOpenParents(prev => ({
                                ...prev,
                                [group.parentId]: !prev[group.parentId]
                              }))
                            }
                            className="bg-gray-100 p-3 font-medium cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-semibold text-blue-700">
                              {group.parentName}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {openParents[group.parentId] ? '▼' : '▶'} ({group.children.length}{' '}
                              {master.title.includes("Industry") ? "sub-industries" : "sub-services"})
                            </span>
                          </div>

                          {/* Children List (expandable) */}
                          {openParents[group.parentId] && (
                            <ul className="divide-y divide-gray-200">
                              {group.children.map(child => (
                                <li
                                  key={child[master.idKey]}
                                  className={`p-3 hover:bg-gray-50 flex justify-between items-center transition-colors duration-200 ${
                                    selectedItemForEdit &&
                                    selectedItemForEdit[master.idKey] === child[master.idKey]
                                      ? "bg-blue-100 border-blue-400"
                                      : "bg-white"
                                  }`}
                                >
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      {child[master.payloadKey]}
                                      {master.title === "Status" && child.orderId !== undefined && (
                                        <span className="ml-2 text-sm text-gray-500">
                                          (Order: {child.orderId})
                                        </span>
                                      )}
                                    </span>
                                    {master.activeStatusPayloadKey &&
                                      child[master.activeStatusPayloadKey] !== undefined && (
                                        <span
                                          className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                            child[master.activeStatusPayloadKey]
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {child[master.activeStatusPayloadKey]
                                            ? 'Active'
                                            : 'Inactive'}
                                        </span>
                                      )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setSelectedItemForEdit(child)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                                      title="Edit"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(child[master.idKey])}
                                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                                      title="Delete"
                                      disabled={isDeleting || !master.delete}
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        {searchTerm ? 'No matching items found' : 'No items available'}
                      </p>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <li
                          key={item[master.idKey]}
                          className={`p-3 border rounded-md flex justify-between items-center transition-colors duration-200 ${
                            selectedItemForEdit &&
                            selectedItemForEdit[master.idKey] === item[master.idKey]
                              ? "bg-blue-100 border-blue-400"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {item[master.payloadKey]}
                              {master.title === "Status" && item.orderId !== undefined && (
                                <span className="ml-2 text-sm text-gray-500">
                                  (Order: {item.orderId})
                                </span>
                              )}
                            </span>
                            {master.additionalFields &&
                              master.additionalFields.map((field) => {
                                if (
                                  master.isHierarchical &&
                                  master.parentMasterConfig &&
                                  field ===
                                    (master.parentMasterConfig.formFieldKey ||
                                      "parentId")
                                ) {
                                  return null;
                                }
                                return (
                                  item[field] && (
                                    <span
                                      key={field}
                                      className="text-sm text-gray-500"
                                    >
                                      {item[field]}
                                    </span>
                                  )
                                );
                              })}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedItemForEdit(item)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            {!isLabelMaster && (
                              <button
                                onClick={() => handleDelete(item[master.idKey])}
                                disabled={isDeleting || !master.delete}
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        {searchTerm ? 'No matching items found' : 'No items available'}
                      </p>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Form for Add/Edit (Right Side) */}
          <div className="w-1/2 pl-4 flex flex-col">
            <h3 className="text-xl font-semibold mb-3 text-blue-700">
              {selectedItemForEdit
                ? `Edit Existing ${master.modalKey || master.title}`
                : `Add New ${master.modalKey || master.title}`}
            </h3>
            
            {/* Show parent name when editing hierarchical items (Sub-Industry or Sub-Service) */}
{/* Show parent name when editing hierarchical items (Sub-Industry or Sub-Service) */}
{selectedItemForEdit && master.isHierarchical && master.parentMasterConfig && (
  <div className="mb-3">
    <h3 className="text-lg font-semibold text-blue-700">
      Parent: {(() => {
        const parentId = selectedItemForEdit[
          master.parentMasterConfig.parentIdInChildResponseKey || "parentId"
        ];
        const matchedParent = parentOptions.find(
          (parent) => String(parent[master.parentMasterConfig.idKey]) === String(parentId)
        );
        return matchedParent?.[master.parentMasterConfig.nameKey] || "Not Found";
      })()}
    </h3>
  </div>
)}
{/* {selectedItemForEdit && (
  (master.title === "Sub-Industries" || master.title === "Sub-Services") ? (
    <div className="mb-3">
      <h3 className="text-lg font-semibold text-blue-700">
        Parent: {(() => {
          const parentId = selectedItemForEdit[
            master.parentMasterConfig?.parentIdInChildResponseKey || "parentId"
          ];
          const matchedParent = parentOptions.find(
            parent => String(parent[master.parentMasterConfig.idKey]) === String(parentId)
          );
          return matchedParent?.[master.parentMasterConfig.nameKey] || "Not Found";
        })()}
      </h3>
    </div>
  ) : (master.isHierarchical && master.parentMasterConfig) && (
    <div className="mb-3">
      <h3 className="text-lg font-semibold text-blue-700">
        Parent: {(() => {
          const parentId = selectedItemForEdit[
            master.parentMasterConfig?.parentIdInChildResponseKey || "parentId"
          ];
          const matchedParent = parentOptions.find(
            parent => String(parent[master.parentMasterConfig.idKey]) === String(parentId)
          );
          return matchedParent?.[master.parentMasterConfig.nameKey] || "Not Found";
        })()}
      </h3>
    </div>
  )
)} */}


            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {master.isHierarchical &&
                master.parentMasterConfig &&
                formParentKey && (
                  <div className="mb-4">
                    <label
                      htmlFor={formParentKey}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {parentLabel}:
                    </label>
                    <select
                      id={formParentKey}
                      name={formParentKey}
                      value={
                        formData[formParentKey] === null
                          ? ""
                          : String(formData[formParentKey])
                      }
                      onChange={handleChange}
                      required={master.parentMasterConfig.required}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSaving || (selectedItemForEdit && (master.title === "Sub-Industries" || master.title === "Sub-Services"))}
                    >
                      <option value="">Select a {parentLabel}</option>
                      {parentOptions.map((parent) => (
                        <option
                          key={parent[master.parentMasterConfig.idKey]}
                          value={String(
                            parent[master.parentMasterConfig.idKey]
                          )}
                        >
                          {parent[master.parentMasterConfig.nameKey]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

<div className="mb-4">
  <label
    htmlFor={master.payloadKey}
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    {master.modalKey || master.title}:
    {master.title !== "Email Template" && (
      <span className="ml-2 text-xs text-green-500">
        {formData[master.payloadKey]?.length || 0}/50
      </span>
    )}
  </label>

  {master.title === "Email Template" && master.payloadKey === "mailBody" ? (
    <>
      {/* Email Subject Field */}
      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject:
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.subject || ""}
          onChange={handleChange}
          required
          disabled={isSaving}
        />
      </div>

      {/* Email Body Editor */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content:
        </label>
        <ReactQuill
          theme="snow"
          value={formData["mailBody"] || ""}
          onChange={(value) =>
            handleChange({
              target: { name: "mailBody", value },
            })
          }
          readOnly={isSaving}
          className="mt-1 mb-2 bg-white rounded-md border border-gray-300"
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              ['link'],
              ['clean']
            ],
            clipboard: {
              matchVisual: false,
            }
          }}
          formats={[
            'bold', 'italic', 'underline', 'strike',
            'link'
          ]}
        />
      </div>

      {/* Plain Text Preview: Title and Body */}
      {(formData.subject || formData.mailBody) && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="mb-2">
            <span className="font-semibold text-gray-700">Title:</span>
            <span className="ml-2">{formData.subject || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Body:</span>
            <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
              {stripHtml(formData["mailBody"])}
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    <input
      id={master.payloadKey}
      name={master.payloadKey}
      type="text"
      className={`mt-1 block w-full border ${
        formData[master.payloadKey]?.length > 0 &&
        (formData[master.payloadKey]?.length < 3 ||
          formData[master.payloadKey]?.length > 50)
          ? "border-red-500"
          : "border-gray-300"
      } rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500`}
      value={formData[master.payloadKey] || ""}
      onChange={handleChange}
      required
      minLength={3}
      maxLength={50}
      disabled={isSaving}
    />
  )}

  {master.title !== "Email Template" &&
    formData[master.payloadKey]?.length > 0 && (
      <p
        className={`mt-1 text-xs ${
          formData[master.payloadKey]?.length < 3 ||
          formData[master.payloadKey]?.length > 50
            ? "text-red-600"
            : "text-green-600"
        }`}
      >
        {formData[master.payloadKey]?.length < 3
          ? "Minimum 3 characters required"
          : formData[master.payloadKey]?.length > 50
          ? "Maximum 50 characters exceeded"
          : "Valid length"}
      </p>
    )}
</div>


              {master.title === "Status" &&
                shouldFieldBeRendered("orderId", formData) && (
                  <div className="mb-4">
                    <label
                      htmlFor="orderId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sort Order:
                    </label>
                    <input
                      id="orderId"
                      name="orderId"
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      value={
                        formData.orderId !== undefined &&
                        formData.orderId !== null
                          ? formData.orderId
                          : ""
                      }
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                )}

              {master.additionalFields &&
                master.additionalFields.map((field) => {
                  if (
                    master.isHierarchical &&
                    master.parentMasterConfig &&
                    field ===
                      (master.parentMasterConfig.formFieldKey || "parentId")
                  ) {
                    return null;
                  }
                  return (
                    shouldFieldBeRendered(field, formData) && (
                      <div className="mb-4" key={field}>
                        <label
                          htmlFor={field}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {field
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          :
                        </label>
                        {field === "mailBody" ? (
                          <ReactQuill
                            theme="snow"
                            value={formData["mailBody"] || ""}
                            onChange={(value) =>
                              handleChange({
                                target: { name: "mailBody", value },
                              })
                            }
                            readOnly={isSaving}
                            className="mt-1 mb-4"
                            modules={modules}
                            formats={formats}
                          />
                        ) : (
                          <input
                            id={field}
                            name={field}
                            type="text"
                            className="mt-1 block w-full border border-blue-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData[field] || ""}
                            onChange={handleChange}
                            disabled={isSaving}
                          />
                        )}
                      </div>
                    )
                  );
                })}

              <div className="flex justify-end space-x-2 mt-auto pt-4">
                {selectedItemForEdit && (
                  <button
                    type="button"
                    onClick={() => setSelectedItemForEdit(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Cancel Edit
                  </button>
                )}
                {(!isLabelMaster ||
                  (isLabelMaster && areLabelFieldsEmpty)) && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedItemForEdit
                      ? "Update"
                      : "Add"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};