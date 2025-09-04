import React, { useState, useMemo, useEffect } from 'react';
import MasterModal from '../../Components/Master/MasterModel';
import { Sparkles } from 'lucide-react';
import { ENDPOINTS, BASE_URL } from '../../api/constraints'; // Assuming this path is correct and BASE_URL is needed
import { FaTimesCircle } from 'react-icons/fa';
import CircularProgress from '@mui/material/CircularProgress';

export default function CompanyMaster() {
    const [selectedMaster, setSelectedMaster] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State to store decoded user and company IDs
    const [userId, setUserId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state for decoding
    const [authError, setAuthError] = useState(''); // To store authentication errors

    // useEffect to decode JWT token on component mount
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const base64Url = token.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const payload = JSON.parse(atob(base64));

                setUserId(payload.user_id);
                setCompanyId(payload.company_id);
                setAuthError(''); // Clear any previous errors
            } catch (error) {
                console.error("Token decode error:", error);
                setAuthError("Failed to decode authentication token. Please log in again.");
            } finally {
                setIsLoading(false); // Stop loading regardless of success or failure
            }
        } else {
            setAuthError("Authentication token not found. Please log in to access this page.");
            setIsLoading(false); // Stop loading
        }
    }, []); 
    

    const MASTER_CONFIG = useMemo(() => ([
       {
            title: 'Status',
            value: 'Status Masters',
            modalKey: 'Status', 
            idKey: 'ilead_status_id',
            payloadKey: 'clead_name',
            responseKey: 'response',
            idLocation: 'url',
            modifierIdPayloadKey: 'imodified_by',
            updatedDtPayloadKey: 'dmodified_dt',
            activeStatusPayloadKey: 'bactive',
            get: ENDPOINTS.MASTER_STATUS_GET,
            post: ENDPOINTS.MASTER_STATUS_POST,
            put: (id) => `${ENDPOINTS.MASTER_STATUS_PUT}/${id}`,
            delete: (id) => `${ENDPOINTS.MASTER_STATUS_DELETE}/${id}`,
            
            basePostPayload: { clead_name: '', orderId: null, bactive: true }, 
            basePutPayload: { }, 

            postPayloadFields: ["clead_name", "orderId", "imodified_by", "dmodified_dt", "icompany_id", "bactive"],
            putPayloadFields: ["ilead_status_id", "clead_name", "orderId", "imodified_by", "dmodified_dt", "icompany_id", "bactive"], 

            payloadMapping: {
                clead_name: "clead_name",
                bactive: "bactive",
                imodified_by: "imodified_by",
                dmodified_dt: "dmodified_dt",
                icompany_id: "icompany_id",
                ilead_status_id: "ilead_status_id", 
                orderId: "orderId", 
            },
            skipCompanyIdInjection: false, 
            conditionalFields: [], // This is key: empty to always show orderId for Status
        },
        {
            title: 'Potential',
            value: 'Potential Masters',
            modalKey: 'Potential',
            idKey: 'ileadpoten_id', 
            payloadKey: 'clead_name', 
            responseKey: 'data', 
            idLocation: 'params', // ID in URL path for PUT/DELETE

            // Explicitly define fields for payload if they differ from default formData keys
            postPayloadFields: ["clead_name", "icompany_id"], 
            putPayloadFields: ["clead_name", "bactive", "icompany_id", "dupdated_dt", "updatedBy"],

            // Mapping from frontend formData keys (which are often the same as backend GET keys) to backend POST/PUT keys
            payloadMapping: {
                clead_name: "clead_name",
                bactive: "bactive",
                icompany_id: "icompany_id",
                dupdated_dt: "dupdated_dt",
                updatedBy: "updatedBy",
                // Frontend 'orderId' input maps to backend 'iorder_id'
            },
            
            // Set these to null if they are explicitly handled in putPayloadFields
            activeStatusPayloadKey: null, // bactive is in putPayloadFields, handled via payloadMapping
            modifierIdPayloadKey: { // Explicitly define for post/put if needed
                post: userId, // If 'created_by' is handled by postPayloadFields and payloadMapping
                put: null   // If 'updatedBy' is handled by putPayloadFields and payloadMapping
            },
            updatedDtPayloadKey: { // Explicitly define for post/put if needed
                post: null, // If 'dcreated_dt' is handled by postPayloadFields and payloadMapping
                put: null   // If 'dupdated_dt' is handled by putPayloadFields and payloadMapping
            },

            basePostPayload: { clead_name: '', }, // Initialize orderId for new entries
            basePutPayload: {}, 

            get: ENDPOINTS.MASTER_POTENTIAL_GET,
            post: ENDPOINTS.MASTER_POTENTIAL_POST,
            put: (id) => `${ENDPOINTS.MASTER_POTENTIAL_PUT}/${id}`,
            delete: (id) => `${ENDPOINTS.MASTER_POTENTIAL_DELETE}/${id}`,
            skipCompanyIdInjection: false, // Keep false if companyId is auto-injected by default
            
            conditionalFields: [], // No conditional rendering for orderId for Potential
        },
        {
            title: 'Industries',
            value: 'Industry Masters',
            modalKey: 'Industry', // Changed for clarity in UI
            idKey: 'iindustry_id', // ID key from GET response
            payloadKey: 'cindustry_name', // Main content key from GET response/form field name
            responseKey: 'response.industry', // Path to the array of items in GET response (VERIFY THIS!)
            idLocation: 'params', // ID in URL for PUT/DELETE
            modifierIdPayloadKey: { post: 'created_by', put: 'updated_by' }, // Backend expects 'updated_by' for PUT
            updatedDtPayloadKey: { post: 'dcreated_dt', put: 'dupdated_dt' }, // Backend expects 'dupdated_dt' for PUT
            activeStatusPayloadKey: null, // As per your comment, Industry does not have an active status
            get: ENDPOINTS.MASTER_INDUSTRY_GET,
            post: ENDPOINTS.MASTER_INDUSTRY_POST,
            put: (id) => `${ENDPOINTS.MASTER_INDUSTRY_PUT}/${id}`,
            delete: (id) => `${ENDPOINTS.MASTER_INDUSTRY_DELETE}/${id}`,
            basePostPayload: { cindustry_name: '' }, // Frontend key (from payloadKey)
            putPayloadFields: ['cindustry_name', 'icompany_id'], // Fields to send for PUT
            payloadMapping: {
                iindustry_id: 'iindustry_id', // Maps to itself if backend uses same key
                cindustry_name: 'cindustry_name', // If frontend and backend keys are same
                icompany_id: 'icompany_id',
            },
            skipCompanyIdInjection: false, // Assuming companyId is relevant for Industry
        },
{
    title: 'Sub-Industries',
    value: 'Sub-Industry Masters',
    modalKey: 'Sub Industry',
    idKey: 'isubindustry',
    payloadKey: 'subindustry_name',
    responseKey: 'response.subindustries',
        parentIdInChildResponseKey: 'iindustry_parent',


    get: ENDPOINTS.MASTER_INDUSTRY_GET,
    // responseKey: 'response.subindustries',

    post: ENDPOINTS.MASTER_SUB_INDUSTRY,
    put: ENDPOINTS.MASTER_SUB_INDUSTRY,

    delete: (id, item) => {
        const backendIdKey = 'subindustryId';
        const backendActiveKey = 'isActive';
        const statusForDelete = false;
        return `${ENDPOINTS.MASTER_SUB_INDUSTRY_DELETE}?${backendIdKey}=${id}&${backendActiveKey}=${statusForDelete}`;
    },

    payloadMapping: {
        isubindustry: 'subIndustryId',
        subindustry_name: 'subindustryName',
        industryParent: 'industryParent',
        bactive: 'isActive',
        created_by: 'createdBy',
        icompany_id: 'icompany_id',
    },

    skipCompanyIdInjection: true,

    modifierIdPayloadKey: {
        post: 'createdBy',
        put: 'updated_by',
    },

    updatedDtPayloadKey: {
        post: null,
        put: null,
        delete: null,
    },

    activeStatusPayloadKey: 'bactive',

    basePostPayload: {
        subindustryName: '',
        industryParent: null,
        bactive: true
    },

    baseDeletePayload: {
        isActive: false
    },

    isHierarchical: true,

 parentMasterConfig: {
  masterName: "INDUSTRY",
  getEndpoint: ENDPOINTS.MASTER_INDUSTRY_GET,
  responseKey: 'response.industry',
  idKey: 'iindustry_id',
  nameKey: 'cindustry_name',
  parentIdInChildResponseKey: 'iindustry_parent', // Must match API response field
  formFieldKey: 'industryParent', // Must match form field name
  modalLabel: 'Parent Industry',
  required: true
},

    postPayloadFields: [
        "subindustry_name",
        "industryParent",
        "created_by"
    ],

    putPayloadFields: [  // ✅ Fixed to use frontend keys
        "subindustry_name",
        "updated_by",
        "isubindustry"
    ]
},





        { 
            title: 'Lead Source',
            value: 'Lead Source Masters',
            modalKey: 'Source',
            
            // --- CRITICAL: idKey must match API response's ID field name ---
            idKey: 'source_id', // Make sure this is correct based on your GET API response
            
            payloadKey: 'source_name',
            responseKey: 'data',
            idLocation: 'params', // ID in URL for PUT/DELETE
            
            // --- API Endpoints ---
            get: ENDPOINTS.MASTER_SOURCE_GET,
            post: ENDPOINTS.MASTER_SOURCE_POST,
            
            // PUT: Pass ID in URL path for updates
            put: (id) => `${ENDPOINTS.MASTER_SOURCE_PUT}/${id}`, 
            
            // DELETE: Pass ID in URL path for deletions
            delete: (id) => `${ENDPOINTS.MASTER_SOURCE_DELETE}/${id}`, 
            
             activeStatusPayloadKey: 'is_active',
            updatedDtPayloadKey: { post: null, put: null }, 
            modifierIdPayloadKey: { post: null, put: null }, 
            // additionalFields: ['description'],

            basePostPayload: {
                source_name: '',
                description: '',
                is_active: true,
            },
            
            putPayloadFields: [
                'source_id',
                'source_name',
                'description',
                'is_active',
                'icompany_id' // Ensure company_id is included for PUT
            ],
            postPayloadFields: [ // Add postPayloadFields for consistency
                'source_name',
                'description',
                'is_active',
                'icompany_id' // Ensure company_id is included for POST
            ],
            
            payloadMapping: {
                source_name: 'source_name',
                description: 'description',
                is_active: 'is_active',
                source_id: 'source_id',
                icompany_id: 'icompany_id',
                created_at: 'created_at',
                updated_at: 'updated_at',
            }, 
            
            skipCompanyIdInjection: false, 
        },
{
  title: 'Sub Source',
  value: 'Sub Source Masters',
  modalKey: 'Sub Source',
  
  // ID key from backend response
  idKey: 'isub_src_id',
  
  // Display name from backend response - this should match GET response
  payloadKey: 'ssub_src_name', // ✅ Correct for GET response display
  
  responseKey: 'data',
  parentIdInChildResponseKey: 'isrc_id',
  
  // API endpoints
  get: ENDPOINTS.MASTER_SUB_SOURCE_GET,
  post: ENDPOINTS.MASTER_SUB_SOURCE_POST,
  put: ENDPOINTS.MASTER_SUB_SOURCE_PUT,
  delete: ENDPOINTS.MASTER_SUB_SOURCE_CHANGE,
  
  // ✅ CORRECTED Payload mapping
  payloadMapping: {
    isub_src_id: 'subSrcId',
    ssub_src_name: 'subSrcName', // Map frontend field to backend field
    isrc_id: 'srcId'
  },
  
  // ✅ CORRECTED Base payloads
  basePostPayload: {
    ssub_src_name: "", // Frontend form field name
    srcId: null
  },
  
  basePutPayload: { 
    ssub_src_name: '', // Frontend form field name
    srcId: null
  },
  
  // ✅ CORRECTED Payload fields (use frontend field names)
  postPayloadFields: [
    "ssub_src_name", // Frontend form field name
    "srcId"
  ],
  
  putPayloadFields: [
    "isub_src_id",
    "ssub_src_name", // Frontend form field name
    "srcId"
  ],
  
  // Rest of the configuration remains the same...
  skipCompanyIdInjection: true,
  modifierIdPayloadKey: { post: null, put: null, delete: null },
  updatedDtPayloadKey: { post: null, put: null, delete: null },
  activeStatusPayloadKey: 'status',
  isHierarchical: true,
  
  parentMasterConfig: {
    masterName: "LEAD_SOURCE",
    getEndpoint: ENDPOINTS.MASTER_SOURCE_GET,
    responseKey: 'data',
    idKey: 'source_id',
    nameKey: 'source_name',
    parentIdInChildResponseKey: 'isrc_id',
    formFieldKey: 'srcId',
    modalLabel: 'Parent Source',
    required: true
  },
  
  deletePayload: {
    subSrcId: null,
    status: false
  }
},

        
    {
  title: 'Service',
  value: 'Service Masters',
  modalKey: 'Service',
  idKey: 'iservice_id',
  payloadKey: 'cservice_name',
  responseKey: 'data',
  idLocation: 'body',
  modifierIdPayloadKey: {
      post: 'icreated_by',
      put: 'iupdated_by'
  },
  updatedDtPayloadKey: {
      post: 'dcreated_at',
      put: 'dupdated_at'
  },
  activeStatusPayloadKey: 'bactive',
  get: ENDPOINTS.MASTER_SERVICE_GET,
  post: ENDPOINTS.MASTER_SERVICE_POST,
  put: ENDPOINTS.MASTER_SERVICE_PUT,
  
  // ✅ FIX: Change `delete` to a function that takes `id`
  delete: (id) => `${ENDPOINTS.MASTER_SERVICE_DELETE}?serviceId=${id}`,
  
  basePostPayload: { cservice_name: '' },
  basePutPayload: {},
  putPayloadFields: ["iservice_id", "cservice_name", "iupdated_by", "dupdated_at", "icompany_id"],
  postPayloadFields: ["cservice_name", "icreated_by", "dcreated_at", "icompany_id"],
  payloadMapping: {
      iservice_id: 'serviceId',
      cservice_name: 'serviceName',
      bactive: 'bactive',
      icompany_id: 'icompany_id',
      icreated_by: 'icreated_by',
      iupdated_by: 'iupdated_by',
      dcreated_at: 'dcreated_at',
      dupdated_at: 'dupdated_at'
  },
  skipCompanyIdInjection: false
},
{
    title: 'Sub-Service',
    value: 'Sub-Service Masters',
    modalKey: 'Sub Service',
    idKey: 'isubservice_id',
    payloadKey: 'subservice_name',
    responseKey: 'data',
    parentIdInChildResponseKey: 'iservice_parent',
    parentNameInChildResponseKey: 'service.cservice_name', 


    get: ENDPOINTS.SUB_SERVICE,
    post: ENDPOINTS.SUB_SERVICE,
    put: (id) => `${ENDPOINTS.SUB_SERVICE}/${id}`,
    
    delete: (id) => `${ENDPOINTS.SUB_SERVICE}/${id}`,

    payloadMapping: {
        isubservice_id: 'isubservice_id',
        subservice_name: 'subservice_name', // Matches API expectation
        iservice_parent: 'serviceParent',
        bactive: 'bactive',
        created_by: 'createdBy', // Matches API expectation
        updated_by: 'updated_by'
    },

    skipCompanyIdInjection: true,

    modifierIdPayloadKey: {
        post: 'createdBy',
        put: 'updated_by',
    },

    updatedDtPayloadKey: {
        post: null,
        put: null,
        delete: null,
    },

    activeStatusPayloadKey: 'bactive',

    basePostPayload: {
        subservice_name: '', // Must match exactly what API expects
        serviceParent: null,
        createdBy: null, // Will be populated with user ID
        bactive: true
    },

    baseDeletePayload: {},

    isHierarchical: true,

    parentMasterConfig: {
        masterName: "SERVICE",
        getEndpoint: ENDPOINTS.MASTER_SERVICE_GET,
        responseKey: 'data',
        idKey: 'iservice_id',
        nameKey: 'cservice_name',
        parentIdInChildResponseKey: 'iservice_parent',
        formFieldKey: 'serviceParent',
        modalLabel: 'Parent Service',
        required: true
    },

    postPayloadFields: [
        "subservice_name", // Must match API expectation exactly
        "serviceParent",
        "createdBy" // Must match API expectation exactly
    ],

    putPayloadFields: [
        "subservice_name",
        "updated_by"
    ],

    deletePayloadFields: []
},



{
    title: 'Proposal Send Mode',
    value: 'Proposal Send Modes',
    modalKey: 'ProposalSendMode',
    idKey: 'proposal_send_mode_id', 
    payloadKey: 'name', 
    
    // Updated response handling for nested structure
    responseKey: 'data.data', // Now points to the actual array of items
    dropdownOptions: {
        labelKey: 'name',                  // Display text in dropdown
        valueKey: 'proposal_send_mode_id'  // Value to store
    },
    
    // Filter only active items for dropdown (optional)
    filterDropdownItems: (items) => items.filter(item => item.bactive === true),

    idLocation: 'params',
    postPayloadFields: ["name", "bactive"],
    putPayloadFields: ["name", "bactive"],
    payloadMapping: {
        name: "name",
        bactive: "bactive"
    },
    
    // Status and modifier keys
    activeStatusPayloadKey: 'bactive',
    modifierIdPayloadKey: {
        post: 'created_by',
        put: 'updated_by'
    },
    updatedDtPayloadKey: {
        post: 'created_dt',
        put: 'updated_dt'
    },

    // Base payload structures
    basePostPayload: { 
        name: '', 
        bactive: true,
        created_by: userId,  // Ensure this is injected
        created_dt: new Date().toISOString() 
    },
    basePutPayload: { 
        updated_by: userId,   // Ensure this is injected
        updated_dt: new Date().toISOString() 
    },

    // API endpoints
    get: ENDPOINTS.MASTER_PROPOSAL_SEND_MODE,
    post: ENDPOINTS.MASTER_PROPOSAL_SEND_MODE,
    put: (id) => `${ENDPOINTS.MASTER_PROPOSAL_SEND_MODE}/${id}`,
    delete: (id) => `${ENDPOINTS.MASTER_PROPOSAL_SEND_MODE}/${id}`,
    skipCompanyIdInjection: true,
    conditionalFields: []
},
{
  title: 'Email Template',
  value: 'Email Template Masters',
  modalKey: 'Email Template',
  idKey: 'mailTemplateId',
  payloadKey: 'mailTitle', // Used for list view display
  responseKey: 'data',
  isRichText: true, // Add this flag to indicate mailBody uses ReactQuill
  richTextField: 'mailBody', // Explicitly specify which field is rich text
    // idLocation: 'query',

    // API Endpoints
    get: ENDPOINTS.MAIL_TEMPLATE,
    post: ENDPOINTS.MAIL_TEMPLATE,
    put: ENDPOINTS.MAIL_TEMPLATE,
 delete: (id) => `${ENDPOINTS.MAIL_TEMPLATE}?mailTemplateId=${id}&status=false`,
    idLocation: 'query',
    // Payload configuration    
    basePostPayload: {
        mailTitle: '',
        mailBody: ''
    },
    basePutPayload: {},

    // Fields to include in POST/PUT requests
    postPayloadFields: [
        "mailTitle",
        "mailBody",
        "icompany_id",
        "createdBy"
    ],
    putPayloadFields: [
        "mailTemplateId",
        "mailTitle",
        "mailBody",
        "icompany_id",
        "updatedBy"
    ],

    // Field mappings between frontend and backend
    payloadMapping: {
        mailTemplateId: 'mailTemplateId',
        mailTitle: 'mailTitle',
        mailBody: 'mailBody',
        icompany_id: 'icompany_id',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy'
    },

    // User and timestamp configuration
    modifierIdPayloadKey: {
        post: 'createdBy',
        put: 'updatedBy'
    },
    updatedDtPayloadKey: {
        post: null, // Handled by backend
        put: null   // Handled by backend
    },

    // No active status field for email templates
    activeStatusPayloadKey: null,

    // Additional configuration
    skipCompanyIdInjection: false,
    additionalFields: ['mailBody'] // Indicates there's an additional textarea field
},
        // { // Corrected Label Master configuration
        //     title: 'Label ',
        //     value: 'Lead Form Labels',
        //     modalKey: 'Lead Form Title', // Display label for the main input in the modal

        //     idKey: 'iformLabelMasterId', // The unique ID field name as it appears in the GET response object.
        //     payloadKey: 'leadFormTitle', // The main form field name and the key for the primary data in payloads.
        //     responseKey: 'Message', // Path to the object itself in the GET response.

        //     idLocation: 'body', // Indicates that the ID for PUT/DELETE is part of the request body.

        //     modifierIdPayloadKey: { 
        //         post: 'icreated_by',
        //         put: 'iupdated_by' 
        //     },
        //     updatedDtPayloadKey: { 
        //         post: 'dcreated_dt',
        //         put: 'updated_dt'
        //     },
        //     activeStatusPayloadKey: 'bactive', // Example for a checkbox, if used.

        //     additionalFields: ['section1Label', 'section2Label', 'section3Label'], 

        //     get: ENDPOINTS.MASTER_LABEL_GET, 
        //     post: ENDPOINTS.MASTER_LABEL_POST, 
        //     put: ENDPOINTS.MASTER_LABEL_PUT, 
        //     // delete: Explicitly commented out, MasterModal will hide the delete button.

        //     basePostPayload: {
        //         leadFormTitle: '',
        //         section1Label: '',
        //         section2Label: '',
        //         section3Label: '',
        //     },
        //     basePutPayload: {}, 

        //     // CORRECTED: This MUST be an array of strings
        //     putPayloadFields: [
        //         "iformLabelMasterId", // Include the ID if it's part of the PUT body
        //         "leadFormTitle",
        //         "section1Label",
        //         "section2Label",
        //         "section3Label",
        //         "icompany_id", // Assuming company_id is always part of Label Master payload
        //         "iupdated_by", // Explicitly include if updated_by is expected
        //         "updated_dt"   // Explicitly include if updated_dt is expected
        //     ],
        //     postPayloadFields: [ // Define for POST as well for consistency
        //         "leadFormTitle",
        //         "section1Label",
        //         "section2Label",
        //         "section3Label",
        //         "icompany_id",
        //         "icreated_by",
        //         "dcreated_dt"
        //     ],
            
        //     payloadMapping: {
        //         iformLabelMasterId: 'formLabelMastersId', 
        //         leadFormTitle: 'leadFormTitle',
        //         section1Label: 'section1Label',
        //         section2Label: 'section2Label',
        //         section3Label: 'section3Label',
        //         icompany_id: 'icompany_id', 
        //         icreated_by: 'icreated_by', 
        //         iupdated_by: 'iupdated_by', 
        //         dcreated_dt: 'dcreated_dt', 
        //         updated_dt: 'updated_dt', 
        //     },

        //     skipCompanyIdInjection: false, 
        // },


        {
            title: 'Lead Lost Reason',
            value: 'Lead Lost Reasons',
            modalKey: 'Lost Reason', // Display label for the main input

            idKey: 'ilead_lost_reason_id', // ID field name in GET response and for operations
            payloadKey: 'cLeadLostReason', // Main input field's key for formData
            responseKey: 'data',          // Path to the data array/object in the GET response

            idLocation: 'query', // Signals ID is in query string for DELETE

            get: ENDPOINTS.MASTER_LOST_REASON_GET,
            post: ENDPOINTS.MASTER_LOST_REASON_POST,
            put: ENDPOINTS.MASTER_LOST_REASON_PUT, // PUT still sends ID in body based on `putPayloadFields`

            delete: (id, 
              item) => {
                const backendIdKey = 'lostReasonId'; // Backend's expected ID key in query
                const backendActiveKey = 'isActive'; // Backend's expected active status key in query
                const statusForDelete = false;         // Always set to false for soft delete
                return `${ENDPOINTS.MASTER_LOST_REASON_DELETE}?${backendIdKey}=${id}&${backendActiveKey}=${statusForDelete}`;
            },

            payloadMapping: {
                ilead_lost_reason_id: 'lostReasonId', // Map frontend ID to backend ID name for payloads
                cLeadLostReason: 'lostReason',        // Map frontend name to backend name for payloads
                bactive: 'isActive',                  // Map frontend active status to backend active status for payloads
                icompany_id: 'icompany_id', // Add company ID mapping
            },

            modifierIdPayloadKey: {
                post: 'icreated_by',
                put: null,
                delete: 'iupdated_by'
            },
            updatedDtPayloadKey: {
                post: 'dcreated_at',
                put: null,
                delete: 'dmodified_at'
            },

            activeStatusPayloadKey: 'bactive', // Used for GET display and POST checkbox

            basePostPayload: {
                cLeadLostReason: '',
                bactive: true,
            },

            baseDeletePayload: {
                isActive: false, 
            },

            // putPayloadFields: Explicitly list fields for the PUT request body.
            putPayloadFields: ['cLeadLostReason', 'ilead_lost_reason_id', 'icompany_id'], 
            postPayloadFields: ['cLeadLostReason', 'bactive', 'icreated_by', 'dcreated_at', 'icompany_id'],
            
            skipCompanyIdInjection: false, // Set to false if company_id is explicitly needed in payload
        },

    ]), []); // Empty dependency array means MASTER_CONFIG is created only once

    const handleTileClick = (masterItem) => {
        // Check if decoded companyId or userId are missing
        // Skip this check for masters explicitly configured to not need companyId (like Sub-Industries in your config)
        if (!masterItem.skipCompanyIdInjection && (companyId === null || companyId === undefined)) {
            // console.warn("Cannot open master modal: Company ID missing after token decode.");
            setAuthError("Missing company ID. Please ensure your token is valid.");
            return;
        }
        if (userId === null || userId === undefined) {
            // console.warn("Cannot open master modal: User ID missing after token decode.");
            setAuthError("Missing user ID. Please ensure your token is valid.");
            return;
        }

        // Create a mutable copy of the master item to pass to the modal
        const currentMaster = { ...masterItem };

        // Pass the state variables directly, MasterModal will use them for injection.
        currentMaster.companyId = companyId;
        currentMaster.userId = userId;

        setSelectedMaster(currentMaster);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedMaster(null);
        setIsModalOpen(false);
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <CircularProgress />
                <p className="ml-4 text-lg text-gray-700">Loading authentication details...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="flex flex-col items-center gap-4 bg-red-50 border border-red-300 text-red-700 px-6 py-8 rounded-xl shadow-lg w-full max-w-md text-center">
                    <FaTimesCircle className="text-5xl text-red-500 mb-2" />
                    <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
                    <p className="text-base leading-relaxed">{authError}</p>
                    <p className="text-sm text-gray-600 mt-4">
                        Please try logging in again. If the problem persists, contact support.
                    </p>
                </div>
            </div>
        );
    }

    // --- Main Content (renders only if authentication is successful and IDs are available) ---
    return (
        <div className="px-6 py-10 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-10 text-center">Company Master Settings</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {MASTER_CONFIG.map((master, index) => (
                    <div
                        key={index}
                        onClick={() => handleTileClick(master)}
                        className="relative min-h-[220px] cursor-pointer bg-white border border-blue-100 shadow-xl rounded-2xl p-6 hover:shadow-blue-200 transition-transform duration-300 hover:scale-[1.03] group"
                    >
                        <div className="absolute top-3 right-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
                                    {master.title}
                                </h3>
                                <p className="text-xl font-extrabold text-gray-900 leading-snug">
                                    {master.value}
                                </p>
                            </div>
                            <div className="mt-6 h-2 w-10 bg-blue-500 rounded-full mx-auto group-hover:w-full transition-all duration-300" />
                        </div>
                    </div>
                ))}
            </div>

            {selectedMaster && isModalOpen && (
                <MasterModal
                    master={selectedMaster}
                    onClose={handleCloseModal} // <--- onClose prop is passed here
                    companyId={companyId}
                    userId={userId}
                    masterConfigs={MASTER_CONFIG.reduce((acc, config) => {
                        acc[config.title.toUpperCase().replace(/[-\s]/g, '_')] = config;
                        return acc;
                    }, {})}
                />
            )}
        </div>
    );
}