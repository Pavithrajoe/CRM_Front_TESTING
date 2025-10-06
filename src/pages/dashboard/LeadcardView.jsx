import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaGlobe, FaCrown, FaUser } from 'react-icons/fa';
import { LayoutGrid, List, Filter, RotateCw, Users } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import Loader from '../../Components/common/Loader';
import LeadFilterModal from './LeadViewComponents/LeadFilterModal'; 
import LeadCountSelector from './LeadViewComponents/LeadCountSelector';
import { ENDPOINTS } from '../../api/constraints';
import { jwtDecode } from 'jwt-decode';

const LeadCardViewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [allLeads, setAllLeads] = useState([]);
    const [assignedLeads, setAssignedLeads] = useState([]);
    const [lostLeads, setLostLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFilter, setSelectedFilter] = useState(location.state?.activeTab || 'all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentToken, setCurrentToken] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'dmodified_dt', direction: 'descending' });
    const leadsPerPage = 12;
    const [showLostLeads, setShowLostLeads] = useState(true);
    const [showLostDeals, setShowLostDeals] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [roleID, setRoleID] = useState();
    const [websiteActive, setWebsiteActive] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [potentials, setPotentials] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [sources, setSources] = useState([]);
    const [displayedData, setDisplayedData] = useState([]);
  
    // New states for bulk assignment
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState(null);
    const [assignSuccess, setAssignSuccess] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [selectedPotential, setSelectedPotential] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [leadsToShow, setLeadsToShow] = useState(null);
    const [showPagination, setShowPagination] = useState(true);

    // Get page from URL or state
    const params = new URLSearchParams(location.search);
    const pageFromUrl = Number(params.get("page")) || 1;
    const pageFromState = location.state?.returnPage;
    
    // Initialize currentPage with proper priority
    const [currentPage, setCurrentPage] = useState(() => {
        return pageFromState || pageFromUrl || 1;
    });

    const token = localStorage.getItem("token"); 

    // FIXED: Proper tab filtration logic
// FIXED: Add modal filter states to dependencies
const dataToDisplay = useMemo(() => {
    let data = [];
    
    // First get the base data based on selected filter
    if (selectedFilter === 'assignedToMe') {
        data = assignedLeads;
    } else if (selectedFilter === 'lost') {
        data = lostLeads;
    } else {
        data = allLeads;
    }

    // Then apply search and date filters with tab-specific logic
    return data.filter((item) => {
        const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch =
            match(item.clead_name) ||
            match(item.corganization || item.c_organization) ||
            match(item.cemail || item.c_email) ||
            match(item.iphone_no || item.c_phone) ||
            (selectedFilter === 'assignedToMe' && match(item.iassigned_by_name)) ||
            (selectedFilter === 'assignedToMe' && match(item.statusDisplay));

        let dateToFilter = item.dmodified_dt || item.d_modified_date;
        if (selectedFilter === 'assignedToMe') {
            dateToFilter = item.dupdate_dt || item.dmodified_dt || item.dcreate_dt;
        }
        
        const isWithinDateRange = (date) => {
            if (!date) return true;
            const d = new Date(date);
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
            return (!from || d >= from) && (!to || d <= to);
        };
        
        const matchesDate = isWithinDateRange(dateToFilter);

        // ADDED: Modal filters for specific tabs
        let matchesModalFilters = true;
        
        // Only apply modal filters to these tabs
        if (selectedFilter === 'all' || selectedFilter === 'leads' || selectedFilter === 'websiteLeads') {
            // Filter by Potential
            if (selectedPotential) {
                const itemPotential = item.lead_potential?.clead_name || item.potentialDisplay;
                if (itemPotential !== selectedPotential) {
                    matchesModalFilters = false;
                }
            }
            
            // Filter by Status
            if (selectedStatus) {
                const itemStatus = item.lead_status?.clead_name || item.statusDisplay;
                if (itemStatus !== selectedStatus) {
                    matchesModalFilters = false;
                }
            }
            
            // Filter by Source
            if (selectedSource) {
                if (item.lead_source_id !== Number(selectedSource)) {
                    matchesModalFilters = false;
                }
            }
            
            // Filter by Industry
            if (selectedIndustry) {
                if (item.cindustry_id !== Number(selectedIndustry)) {
                    matchesModalFilters = false;
                }
            }
            
            // Filter by Service
            if (selectedService) {
                if (item.iservice_id !== Number(selectedService)) {
                    matchesModalFilters = false;
                }
            }
        }

        // Tab-specific business logic
        const isConverted = item.bisConverted === true || item.bisConverted === 'true';
        const isActive = item.bactive === true || item.bactive === 'true';
        const isWebsite = item.website_lead === true || item.website_lead === 'true' || item.website_lead === 1;

        if (selectedFilter === 'all') {
            return matchesSearch && matchesDate && matchesModalFilters && isActive;
        } else if (selectedFilter === 'leads') {
            return matchesSearch && matchesDate && matchesModalFilters && isActive && !isConverted && !isWebsite;
        } else if (selectedFilter === 'websiteLeads') {
            return matchesSearch && matchesDate && matchesModalFilters && isWebsite && isActive;
        } else if (selectedFilter === 'lost') {
            if (isActive === false) {
                const isLeadLost = !isConverted && showLostLeads;
                const isDealLost = isConverted && showLostDeals;
                return matchesSearch && matchesDate && (isLeadLost || isDealLost);
            }
            return false;
        } else if (selectedFilter === 'assignedToMe') {
            return matchesSearch && matchesDate && isActive;
        }
        return matchesSearch && matchesDate && matchesModalFilters;
    });
}, [
    selectedFilter, 
    assignedLeads, 
    lostLeads, 
    allLeads, 
    searchTerm, 
    fromDate, 
    toDate, 
    showLostLeads, 
    showLostDeals,
    // ADD THESE DEPENDENCIES:
    selectedPotential,
    selectedStatus,
    selectedSource,
    selectedIndustry,
    selectedService
]);

    // FIXED: Proper displayed data calculation
    const displayedDataCalculated = useMemo(() => {
        if (leadsToShow !== null) {
            return dataToDisplay.slice(0, leadsToShow);
        } else {
            const startIndex = (currentPage - 1) * leadsPerPage;
            const endIndex = startIndex + leadsPerPage;
            return dataToDisplay.slice(startIndex, endIndex);
        }
    }, [dataToDisplay, leadsToShow, currentPage, leadsPerPage]);

    const totalPages = leadsToShow ? 1 : Math.ceil(dataToDisplay.length / leadsPerPage);

    useEffect(() => {
        // Change this function to async
        const fetchMasterData = async () => {
            const headers = { Authorization: `Bearer ${token}` };
            try {
                // Fetch potentials
                const potentialsRes = await fetch(ENDPOINTS.MASTER_POTENTIAL_GET, { headers });
                const potentialsData = await potentialsRes.json();
                if (potentialsData?.data) {
                    setPotentials(potentialsData.data.filter(p => p.bactive));
                }

                // Fetch sources
                const sourcesRes = await fetch(ENDPOINTS.MASTER_SOURCE_GET, { headers });
                const sourcesData = await sourcesRes.json();
                if (sourcesData?.data) {
                    setSources(sourcesData.data.filter(s => s.is_active));
                }

                // Fetch statuses
                const statusesRes = await fetch(ENDPOINTS.MASTER_STATUS_GET, { headers });
                const statusesData = await statusesRes.json();
                if (statusesData?.response) {
                    setStatuses(statusesData.response.filter(s => s.bactive).sort((a, b) => (a.orderId || 0) - (b.orderId || 0)));
                }

                // Fetch industries
                const industriesRes = await fetch(ENDPOINTS.MASTER_INDUSTRY_GET, { headers });
                const industriesData = await industriesRes.json();
                if (industriesData?.response?.industry) {
                    setIndustries(industriesData.response.industry.filter(i => i.bactive));
                }

                // Fetch services
                const servicesRes = await fetch(ENDPOINTS.MASTER_SERVICE_GET, { headers });
                const servicesData = await servicesRes.json();
                if (servicesData?.data) {
                    setServices(servicesData.data.filter(s => s.bactive));
                }

            } catch (err) {
                console.error("Failed to fetch master data:", err);
            }
        };

        if (token) {
            fetchMasterData();
        }
    }, [token]);

    const handleSelectCount = (count) => {
        setLeadsToShow(count);
        setShowPagination(false);
    };

    const resetToDefaultView = () => {
        setLeadsToShow(null);
        setShowPagination(true);
    };

    // Update displayed data when calculated data changes
    useEffect(() => {
        setDisplayedData(displayedDataCalculated);
    }, [displayedDataCalculated]);

    useEffect(() => {
        const handleRefreshEvent = () => {
            setRefreshTrigger(prev => prev + 1);
        };
        window.addEventListener('leadDataUpdated', handleRefreshEvent);
        return () => {
            window.removeEventListener('leadDataUpdated', handleRefreshEvent);
        };
    }, []);

    useEffect(() => {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
            try {
                const parsedData = JSON.parse(storedUserData);
                const webiteAccess = parsedData?.website_access === true;
                setWebsiteActive(webiteAccess);
                localStorage.setItem('website_access', webiteAccess);
            } catch (error) {
                console.error('Error parsing user_data:', error);
            }
        } else {
            const webiteAccess = localStorage.getItem('website_access') === 'true';
            setWebsiteActive(webiteAccess);
        }
    }, []);

    useEffect(() => {
        if (location.state?.activeTab) {
            setSelectedFilter(location.state.activeTab);
        }
    }, [location.state]);

    // Handle back navigation from detail page
    useEffect(() => {
        if (location.state?.returnPage) {
            setCurrentPage(location.state.returnPage);
            // Clear the state after using it to prevent infinite loop
            navigate(location.pathname + location.search, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, location.search, navigate]);

    useEffect(() => {
        let extractedUserId = null;
        let extractedRoleID = null;
        let tokenFromStorage = null;
        try {
            tokenFromStorage = localStorage.getItem('token');
            if (tokenFromStorage) {
                const decodedToken = jwtDecode(tokenFromStorage);
                extractedUserId = decodedToken.user_id;
                extractedRoleID = decodedToken.role_id;
                if (!extractedUserId) {
                    throw new Error("User ID (user_id) not found in decoded token payload.");
                }
            } else {
                console.error("Authentication token not found in local storage. Please log in.");
                setError("Authentication required. Please log in.");
                setLoading(false);
                return;
            }
        } catch (e) {
            console.error("Error retrieving or decoding token in LeadCardViewPage:", e);
            setError(`Authentication error: ${e.message}`);
            setLoading(false);
            return;
        }

        if (extractedUserId && tokenFromStorage) {
            setCurrentUserId(extractedUserId);
            setRoleID(extractedRoleID);
            setCurrentToken(tokenFromStorage);
        } else {
            setError("Failed to obtain valid user ID or authentication token.");
            setLoading(false);
        }
    }, []);

    // Fetch users for assignment
    useEffect(() => {
        if (!currentToken) return;
        
        const fetchUsers = async () => {
            try {
                const response = await fetch(ENDPOINTS.GET_USERS, {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Handle different response structures
                    let usersArray = [];
                    
                    if (Array.isArray(data)) {
                        usersArray = data;
                    } else if (data.data && Array.isArray(data.data)) {
                        usersArray = data.data;
                    } else if (data.response && Array.isArray(data.response)) {
                        usersArray = data.response;
                    } else {
                        console.error("Unexpected response structure:", data);
                    }
                    
                    // Filter out any invalid users and ensure iuser_id exists
                    const validUsers = usersArray.filter(user => 
                        user && user.iUser_id !== undefined && user.iUser_id !== null
                    );
                    
                    setUsersList(validUsers);
                } else {
                    console.error("Failed to fetch users for assignment");
                    setUsersList([]);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
                setUsersList([]);
            }
        };
        
        fetchUsers();
    }, [currentToken]);

    const formatDate = (dateStr) =>
        dateStr
            ? new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'numeric',
                year: 'numeric',
            })
            : '-';

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'hot':
                return 'bg-red-700 text-white';
            case 'warm':
                return 'bg-yellow-500 text-white';
            case 'cold':
                return 'bg-blue-700 text-white';
            case 'new':
                return 'bg-sky-600 text-white';
            case 'contacted':
                return 'bg-green-500 text-white';
            case 'interested':
                return 'bg-purple-600 text-white';
            case 'lost':
            case 'closed lost':
                return 'bg-red-700 text-white';
            case 'pending':
                return 'bg-orange-500 text-white';
            case 'website lead':
                return 'bg-blue-100 text-blue-700';
            case 'lead':
                return 'bg-indigo-100 text-indigo-700';
            default:
                return 'bg-gray-300 text-gray-700';
        }
    };

    const fetchLeads = useCallback(async () => {
        if (!currentUserId || !currentToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${ENDPOINTS.LEAD}${currentUserId}?page=1&limit=10000`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
            });

            if (!res.ok) {
                const bodyText = await res.text();
                let errorDetails = `HTTP error! status: ${res.status}`;
                try {
                    const errorJson = JSON.parse(bodyText);
                    errorDetails += `, Details: ${JSON.stringify(errorJson)}`;
                } catch {
                    errorDetails += `, Message: ${bodyText || res.statusText}`;
                }
                throw new Error(errorDetails);
            }
            const data = await res.json();
            const sorted = (Array.isArray(data.details) ? data.details : []).sort(
                (a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0)
            );
            setAllLeads(sorted);
        } catch (err) {
            console.error("Failed to fetch leads:", err);
            setError(`Failed to fetch leads: ${err.message}`);
            setAllLeads([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, currentToken]);

    const fetchLostLeads = useCallback(async () => {
        if (!currentUserId || !currentToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${ENDPOINTS.LOST_DETAILS}/${currentUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
            });
            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData || res.statusText}`);
            }
            const data = await res.json();
            const sortedLost = (Array.isArray(data.data) ? data.data : [])
                .sort((a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0));
            setLostLeads(sortedLost);
        } catch (err) {
            console.error("Failed to fetch lost leads:", err);
            setError(`Failed to fetch lost leads: ${err.message}`);
            setLostLeads([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, currentToken]);

    const fetchAssignedLeads = useCallback(async () => {
        if (!currentUserId || !currentToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${ENDPOINTS.ASSIGN_TO_ME}/${currentUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, Message: ${errorData || response.statusText}`);
            }

            const resJson = await response.json();

            const assignedEntries = resJson?.data?.assignedEntries || [];
            const leadsAssigned = resJson?.data?.leadsAssigned || [];

            // Flatten assignedEntries with lead details for frontend
            const mergedLeads = assignedEntries.map(entry => {
                const leadDetails = leadsAssigned.find(lead => lead.ilead_id === entry.ilead_id) || {};
                return {
                    ...entry,
                    ...leadDetails, // merge lead details to top level
                    statusDisplay: leadDetails?.lead_status?.clead_name || 'Unknown',
                    potentialDisplay: leadDetails?.lead_potential?.clead_name || 'Unknown',
                };
            });

            setAssignedLeads(mergedLeads);

        } catch (err) {
            console.error("Failed to fetch assigned leads:", err);
            setError(`Failed to fetch assigned leads: ${err.message}`);
            setAssignedLeads([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, currentToken]);

    // FIXED: Fetch data based on selected filter
    useEffect(() => {
        if (!currentUserId || !currentToken) return;
        
        setCurrentPage(1); // Reset to first page when filter changes
        
        if (selectedFilter === 'assignedToMe') {
            fetchAssignedLeads();
        } else if (selectedFilter === 'lost') {
            fetchLostLeads();
        } else {
            fetchLeads();
        }
    }, [selectedFilter, currentUserId, currentToken, refreshTrigger, fetchLeads, fetchAssignedLeads, fetchLostLeads]);

    // Update URL when currentPage changes
    useEffect(() => {
        navigate(`?page=${currentPage}`, { replace: true });
    }, [currentPage, navigate]);

    const handleSort = useCallback((key) => {
        setSortConfig(prevSortConfig => {
            let direction = 'ascending';
            if (prevSortConfig.key === key && prevSortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            return { key, direction };
        });
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // FIXED: Simplified filter apply
const handleFilterApply = () => {
  // Close modal
  setShowFilterModal(false);
  // Reset to page 1 for new filter set
  setCurrentPage(1);
  // This triggers useMemo recalculation on dataToDisplay because filtering states changed
};


   const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedPotential('');
    setSelectedStatus('');
    setSelectedSource('');
    setSelectedIndustry('');
    setSelectedService('');
    setSearchTerm(''); // Also reset search
    setCurrentPage(1);
};

// Add this useEffect to clear modal filters when switching to assignedToMe or lost
useEffect(() => {
    if (selectedFilter === 'assignedToMe' || selectedFilter === 'lost') {
        setSelectedPotential('');
        setSelectedStatus('');
        setSelectedSource('');
        setSelectedIndustry('');
        setSelectedService('');
    }
}, [selectedFilter]);

    const goToDetail = (id) => {
        // Pass current page state to detail page
        navigate(`/leaddetailview/${id}`, { 
            state: { 
                returnPage: currentPage,
                activeTab: selectedFilter 
            } 
        });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return ' ↕';
    };

    const handleImportSubmit = async () => {
        if (!selectedFile) {
            setImportError("Please select a file to import");
            return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        setImportLoading(true);
        setImportError(null);
        setImportSuccess(false);
        try {
            const response = await fetch(ENDPOINTS.EXCEL_IMPORT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: formData,
            });
            const responseData = await response.json();
            if (!response.ok) {
                let errorMessage = "Import failed";
                if (responseData.Message) {
                    if (typeof responseData.Message === 'object' && responseData.Message.Message) {
                        errorMessage = responseData.Message.Message;
                    } else if (typeof responseData.Message === 'string') {
                        errorMessage = responseData.Message;
                    }
                } else if (responseData.detail) {
                    errorMessage = responseData.detail;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.errors) {
                    if (Array.isArray(responseData.errors)) {
                        errorMessage = responseData.errors.join('\n');
                    } else if (typeof responseData.errors === 'object') {
                        errorMessage = Object.entries(responseData.errors)
                            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('\n');
                    } else {
                        errorMessage = responseData.errors;
                    }
                } else {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            setImportSuccess(true);
            setTimeout(() => {
                fetchLeads();
                setShowImportModal(false);
                setSelectedFile(null);
                window.dispatchEvent(new Event('leadDataUpdated'));
            }, 1500);
        } catch (err) {
            console.error("Import error:", err);
            let userErrorMessage = err.message;
            if (err.message.includes("Industry") && err.message.includes("not found")) {
                const allowedIndustriesMatch = err.message.match(/Allowed: (.+)$/);
                if (allowedIndustriesMatch) {
                    userErrorMessage = `Invalid industry. Allowed industries are: ${allowedIndustriesMatch[1]}`;
                }
            }
            setImportError(userErrorMessage);
        } finally {
            setImportLoading(false);
        }
    };

    // Bulk assignment functions
    const toggleLeadSelection = (leadId) => {
        setSelectedLeads(prev => {
            if (prev.includes(leadId)) {
                return prev.filter(id => id !== leadId);
            } else {
                return [...prev, leadId];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === displayedData.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(displayedData.map(lead => lead.ilead_id));
        }
    };

    const handleBulkAssign = async () => {
        const assignedToUserId = parseInt(selectedUser);
        
        if (!assignedToUserId || isNaN(assignedToUserId) || selectedLeads.length === 0) {
            setAssignError("Please select a valid user to assign leads to");
            return;
        }
        
        setAssignLoading(true);
        setAssignError(null);
        
        try {
            const response = await fetch(ENDPOINTS.BULK_ASSIGN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: JSON.stringify({
                    leadIds: selectedLeads,
                    assignedTo: assignedToUserId
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setAssignSuccess(true);
                setTimeout(() => {
                    setShowAssignModal(false);
                    setSelectedLeads([]);
                    setSelectedUser(''); 
                    setShowBulkActions(false);
                    if (selectedFilter === 'assignedToMe') fetchAssignedLeads();
                    else if (selectedFilter === 'lost') fetchLostLeads();
                    else fetchLeads();
                }, 1500);
            } else {
                setAssignError(data.Message || "Failed to assign leads");
            }
        } catch (error) {
            console.error("Assignment error:", error);
            setAssignError("An error occurred during assignment");
        } finally {
            setAssignLoading(false);
        }
    };

    useEffect(() => {
        setSelectedLeads([]);
        setShowBulkActions(false);
    }, [selectedFilter, currentPage]);

    useEffect(() => {
        setShowBulkActions(selectedLeads.length > 0);
    }, [selectedLeads]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
    }

    return (
        <div className="max-w-full mx-auto p-4 rounded-2xl space-y-6 min-h-screen">
            <ProfileHeader />
            
            {/* Bulk Actions Bar */}
            {showBulkActions && (
                <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-medium text-blue-800 mr-4">
                            {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 flex items-center"
                        >
                            <Users size={16} className="mr-2" />
                            Assign Selected
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedLeads([])}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Clear Selection
                    </button>
                </div>
            )}


            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search leads..."
                    className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => {
                            if (selectedFilter === 'assignedToMe') fetchAssignedLeads();
                            else if (selectedFilter === 'lost') fetchLostLeads();
                            else fetchLeads();
                        }}
                        title="Refresh"
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className={`p-2 rounded-full ${
                            showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                    {[
                        'all',
                        'leads',
                        ...(websiteActive ? ['websiteLeads'] : []),
                        'assignedToMe',
                        'lost'
                    ].map((filterKey) => (
                        <button
                            key={filterKey}
                            onClick={() => {
    setSelectedFilter(filterKey);
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setSelectedPotential('');
    setSelectedStatus('');
    setSelectedSource('');
    setSelectedIndustry(''); 
    setSelectedService('');
    
    // Clear any location state when changing filters
    navigate(location.pathname, { replace: true });
}}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                selectedFilter === filterKey
                                    ? (filterKey === 'lost' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white')
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {filterKey === 'all'
                                ? 'All Leads'
                                : filterKey === 'leads'
                                    ? 'Leads'
                                    : filterKey === 'websiteLeads'
                                        ? <> Website Leads <FaCrown className="inline ml-1 text-yellow-600" size={18} /></>
                                        : filterKey === 'lost'
                                            ? 'Lost'
                                            : 'Assigned to Me'}
                        </button>
                    ))}
                </div>

                {roleID && (
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className='bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition whitespace-nowrap'
                    >
                        Import Leads
                    </button>  
                )}
            </div>

            {selectedFilter === 'lost' && (
                <div className="flex flex-wrap gap-4 mt-5 mb-5 items-center">
                    <label className="flex items-center space-x-2 text-gray-700">
                        <input
                            type="checkbox"
                            checked={showLostLeads}
                            onChange={(e) => setShowLostLeads(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-red-600 transition duration-150 ease-in-out"
                        />
                        <span>Show Lost Leads</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-700">
                        <input
                            type="checkbox"
                            checked={showLostDeals}
                            onChange={(e) => setShowLostDeals(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-red-600 transition duration-150 ease-in-out"
                        />
                        <span>Show Lost Customers</span>
                    </label>
                </div>
            )}

            <LeadFilterModal
                showModal={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={handleFilterApply}
                onReset={handleResetFilters}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                selectedPotential={selectedPotential}
                setSelectedPotential={setSelectedPotential}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                selectedSource={selectedSource}
                setSelectedSource={setSelectedSource}
                potentials={potentials}
                statuses={statuses}
                sources={sources}
                industries={industries}
                setIndustries={setIndustries}
                selectedIndustry={selectedIndustry}
                setSelectedIndustry={setSelectedIndustry}
                services={services}
                setServices={setServices}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
            />

            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-lg font-medium text-gray-800">Assign Selected Leads</h2>
                        
                        <p className="text-sm text-gray-600">
                            Assign {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} to:
                        </p>
                        
                        {assignError && (
                            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                                {assignError}
                            </div>
                        )}
                        
                        {assignSuccess && (
                            <div className="text-green-600 text-sm p-2 bg-green-50 rounded-md">
                                Leads assigned successfully!
                            </div>
                        )}
                        
                        <label className="block text-sm text-gray-700">
                            Select User
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                                disabled={assignLoading || assignSuccess}
                            >
                                <option value="">Select a user</option>
                                {usersList.length > 0 ? (
                                    usersList.map(user => (
                                        <option key={user.iUser_id} value={user.iUser_id}>
                                            {user.cFull_name || `User ${user.iUser_id}`}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No users available</option>
                                )}
                            </select>
                        </label>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedUser('');
                                    setAssignError(null);
                                    setAssignSuccess(false);
                                }}
                                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                                disabled={assignLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleBulkAssign}
                                disabled={!selectedUser || assignLoading || assignSuccess}
                                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {assignLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Assigning...
                                    </span>
                                ) : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 " onClick={() => setShowImportModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e)=>e.stopPropagation()} >
                        <h2 className="text-lg font-medium text-gray-800">Import Leads</h2>

                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                            <p className="font-medium">Import Instructions:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                                <li>Use the template below to ensure proper formatting</li>
                                <li>Required fields: Name, Email or Phone</li>
                                <li>Supported file types: .xlsx, .xls, .csv</li>
                                <li>Max file size: 5MB</li>
                            </ul>
                        </div>

                        <div className="flex justify-center mb-4">
                            <a
                                href="../../../public/files/import_leads.xls"
                                download="Leads_Import_Template.xls"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                Download Import Template
                            </a>
                        </div>

                        {importError && (
                            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                                <div className="font-medium mb-1">Import Error:</div>
                                <div>{importError}</div>
                            </div>
                        )}

                        {importSuccess && (
                            <div className="text-green-600 text-sm p-2 bg-green-50 rounded-md">
                                Leads imported successfully!
                            </div>
                        )}

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                            <input 
                                type="file" 
                                id="file-upload"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="hidden"
                            />
                            <label 
                                htmlFor="file-upload" 
                                className="cursor-pointer flex flex-col items-center justify-center"
                            >
                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                <span className="text-sm text-gray-600">
                                    {selectedFile ? selectedFile.name : "Click to select Excel file"}
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setSelectedFile(null);
                                    setImportError(null);
                                    setImportSuccess(false);
                                }}
                                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleImportSubmit}
                                disabled={!selectedFile || importLoading}
                                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Importing...
                                    </span>
                                ) : "Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {displayedData.length === 0 ? (
                <div className="text-center text-gray-500 text-sm sm:text-base py-8">
                    No {selectedFilter === 'assignedToMe' ? 'assigned leads' : selectedFilter === 'lost' ? 'lost Customers' : 'leads'} found.
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <>
                        <div className="flex justify-end my-4">
                            <LeadCountSelector
                                leadsCount={dataToDisplay.length}
                                onSelect={handleSelectCount}
                                selectedCount={leadsToShow}
                            />
                        </div>  
                        <div className="overflow-x-auto rounded-2xl shadow-md border bg-white border-gray-200">
                            <div className={`min-w-[600px] grid gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium ${selectedFilter === 'assignedToMe' ? 'grid-cols-10' : 'grid-cols-7'}`}>
                                {/* Select All checkbox */}
                               <div className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedLeads.length === displayedData.length && displayedData.length > 0}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                        </div>
                                <div className="cursor-pointer flex items-center" onClick={() => handleSort('clead_name')}>
                                    Name {getSortIndicator('clead_name')}
                                </div>
                                <div className="cursor-pointer flex items-center" onClick={() => handleSort('corganization')}>
                                    Org {getSortIndicator('corganization')}
                                </div>
                                <div className="min-w-[120px] cursor-pointer flex items-center" onClick={() => handleSort('cemail')}>
                                    Email {getSortIndicator('cemail')}
                                </div>
                                <div className="cursor-pointer flex items-center" onClick={() => handleSort('iphone_no')}>
                                    Phone {getSortIndicator('iphone_no')}
                                </div>
                                {selectedFilter === 'assignedToMe' && (
                                    <>
                                        <div className="cursor-pointer flex items-center" onClick={() => handleSort('iassigned_by_name')}>
                                            Assigned by {getSortIndicator('iassigned_by_name')}
                                        </div>
                                        <div className="cursor-pointer flex items-center" onClick={() => handleSort('dcreate_dt')}>
                                            Created at {getSortIndicator('dcreate_dt')}
                                        </div>
                                        <div className="cursor-pointer flex items-center" onClick={() => handleSort('dupdate_dt')}>
                                            Updated at {getSortIndicator('dupdate_dt')}
                                        </div>
                                    </>
                                )}
                                <div className="cursor-pointer flex items-center" onClick={() => handleSort('dmodified_dt')}>
                                    Modified {getSortIndicator('dmodified_dt')}
                                </div>
                                {selectedFilter === 'assignedToMe' ? (
                                    <div className="cursor-pointer flex items-center" onClick={() => handleSort('statusDisplay')}>
                                        Status {getSortIndicator('statusDisplay')}
                                    </div>
                                ) : (
                                    <div className="cursor-pointer flex items-center" onClick={() => handleSort('lead_status')}>
                                        Status {getSortIndicator('lead_status')}
                                    </div>
                                )}
                            </div>
                            {displayedData.map((item) => {
                                const isItemCurrentlyLost = !(item.bactive === true || item.bactive === 'true');
                                const isConverted = item.bisConverted === true || item.bisConverted === 'true';

                                let statusText;
                                let statusBgColor;

                                if (selectedFilter === 'assignedToMe') {
                                    statusText = item.statusDisplay;
                                    statusBgColor = item.statusColor;
                                } else if (selectedFilter === 'lost') {
                                    statusText = item.lead_status?.clead_name
                                        ? `${item.lead_status.clead_name} (Lost)`
                                        : isConverted
                                        ? 'Deal Lost'
                                        : 'Lead Lost';
                                    statusBgColor = getStatusColor('lost');
                                } else {
                                    if (isItemCurrentlyLost) {
                                        statusText = item.lead_status?.clead_name
                                            ? `${item.lead_status.clead_name} (Lost)`
                                            : isConverted
                                            ? 'Deal Lost'
                                            : 'Lead Lost';
                                        statusBgColor = getStatusColor('lost');
                                    } else if (isConverted) {
                                        statusText = 'Deal';
                                        statusBgColor = getStatusColor('deal');
                                    } else if (item.website_lead === true || item.website_lead === 'true' || item.website_lead === 1) {
                                        statusText = 'Website Lead';
                                        statusBgColor = getStatusColor('website lead');
                                    } else {
                                        statusText = item.lead_status?.clead_name || 'Lead';
                                        statusBgColor = getStatusColor(item.lead_status?.clead_name || 'lead');
                                    }
                                }

                                return (
                                    <div
                                        key={item.ilead_id || `assigned-${item.cemail}-${item.iphone_no}-${item.dcreate_dt || Date.now()}`}
                                        className={`min-w-[600px] grid gap-4 px-4 py-3 border-t hover:bg-gray-100 cursor-pointer text-sm text-gray-700 ${selectedFilter === 'assignedToMe' ? 'grid-cols-10' : 'grid-cols-7'}`}
                                    >
                                        {/* Checkbox for selection */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.includes(item.ilead_id)}
                                                onChange={() => toggleLeadSelection(item.ilead_id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                        </div>
                                        
                                        <div onClick={() => goToDetail(item.ilead_id)}>{item.clead_name || '-'}</div>
                                        <div onClick={() => goToDetail(item.ilead_id)}>{item.corganization || item.c_organization || '-'}</div>
                                        <div className="relative group overflow-visible" onClick={() => goToDetail(item.ilead_id)}>
                                            <span className="block truncate">
                                                {item.cemail || item.c_email || '-'}
                                            </span>
                                            {(item.cemail || item.c_email) && (
                                                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg p-2 rounded-md text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max pointer-events-none group-hover:pointer-events-auto">
                                                    {item.cemail || item.c_email}
                                                </div>
                                            )}
                                        </div>
                                        <div onClick={() => goToDetail(item.ilead_id)}>{item.iphone_no || item.c_phone || '-'}</div>
                                        {selectedFilter === 'assignedToMe' && (
                                            <>
                                                <div onClick={() => goToDetail(item.ilead_id)}>{item.iassigned_by_name || '-'}</div>
                                                <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dcreate_dt)}</div>
                                                <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dupdate_dt || item.dmodified_dt)}</div>
                                            </>
                                        )}
                                        <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dmodified_dt || item.d_modified_date)}</div>
                                        <div onClick={() => goToDetail(item.ilead_id)}>
                                            <span className={`px-3 py-1 rounded-full text-xs ${statusBgColor}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                         </>
                    )}

                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {displayedData.map((item) => {
                                const isItemCurrentlyLost = !(item.bactive === true || item.bactive === 'true');
                                const isConverted = item.bisConverted === true || item.bisConverted === 'true';

                                let statusText;
                                let statusBgColor;

                                if (selectedFilter === 'assignedToMe') {
                                    statusText = item.statusDisplay;
                                    statusBgColor = item.statusColor;
                                } else if (selectedFilter === 'lost') {
                                    statusText = item.lead_status?.clead_name
                                        ? `${item.lead_status.clead_name} (Lost)`
                                        : isConverted
                                        ? 'Deal Lost'
                                        : 'Lead Lost';
                                    statusBgColor = getStatusColor('lost');
                                } else {
                                    if (isItemCurrentlyLost) {
                                        if (isConverted) {
                                            statusText = 'Deal Lost';
                                        } else {
                                            statusText = `${item.lead_status?.clead_name || 'Lead'} (Lost)`;
                                        }
                                        statusBgColor = getStatusColor('lost');
                                    } else {
                                        if (isConverted) {
                                            statusText = 'Deal';
                                            statusBgColor = getStatusColor('deal');
                                        } else if (item.website_lead === true || item.website_lead === 'true' || item.website_lead === 1) {
                                            statusText = 'Website Lead';
                                            statusBgColor = getStatusColor('website lead');
                                        } else {
                                            statusText = item.lead_status?.clead_name || 'Lead';
                                            statusBgColor = getStatusColor(item.lead_status?.clead_name || 'lead');
                                        }
                                    }
                                }

                                return (
                                    <div
                                        key={item.ilead_id || `assigned-${item.cemail}-${item.iphone_no}-${item.dcreate_dt || Date.now()}`}
                                        className="relative bg-white rounded-xl shadow-lg p-10 border border-gray-200 hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                                    >
                                        {/* Checkbox for selection */}
                                        <div className="absolute top-3 right-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.includes(item.ilead_id)}
                                            onChange={() => toggleLeadSelection(item.ilead_id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-3 w-3 mt-[-2px] text-blue-600 rounded"
                                        />
                                        </div>

                                        
                                        {(item.website_lead === true || item.website_lead === 'true' || item.website_lead === 1) && (
                                            <div className="absolute top-3 left-10 text-blue-600" title="Website Lead">
                                                <FaGlobe size={18} />
                                            </div>
                                        )}
                                        <div onClick={() => goToDetail(item.ilead_id)}>
                                            <div className="flex w-full justify-between items-center space-x-10">
                                                <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
                                                    {item.clead_name || '-'}
                                                </h3>
                                                <h3 className="font-semibold text-sm text-black bg-yellow-200 px-3 py-1 rounded-full truncate">
                                                    {item.lead_potential?.clead_name || item.lead_potential || '-'}
                                                </h3>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-2 truncate">
                                                {item.corganization || item.c_organization || '-'}
                                            </p>
                                            <div className="text-gray-500 text-xs space-y-1 mb-3">
                                                {(item.cemail || item.c_email) && (
                                                    <p className="flex items-center">
                                                        <FaEnvelope className="mr-2 text-blue-500" /> {item.cemail || item.c_email}
                                                    </p>
                                                )}
                                                {(item.iphone_no || item.c_phone) && (
                                                    <p className="flex items-center">
                                                        <FaPhone className="mr-2 text-green-500" /> {item.iphone_no || item.c_phone}
                                                    </p>
                                                )}
                                                {selectedFilter === 'assignedToMe' && item.iassigned_by_name && (
                                                    <p className="flex items-center">
                                                        <FaGlobe className="mr-2 text-purple-500" /> Assigned by: {item.iassigned_by_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBgColor}`}>
                                                {statusText}
                                            </span>
                                            <span className="text-gray-500 text-xs">
                                                Modified: {formatDate(item.dmodified_dt || item.d_modified_date)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {totalPages > 1 && showPagination && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Previous
                    </button>
                    <span className="text-gray-700">
                    Page {currentPage} of {totalPages}
                    </span>
                    <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Next
                    </button>
                </div>
            )}

        </div>
    );
};

export default LeadCardViewPage;

// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { FaEnvelope, FaPhone, FaGlobe, FaCrown, FaUser } from 'react-icons/fa';
// import { LayoutGrid, List, Filter, RotateCw, Users } from 'lucide-react';
// import ProfileHeader from '../../Components/common/ProfileHeader';
// import Loader from '../../Components/common/Loader';
// import LeadFilterModal from './LeadViewComponents/LeadFilterModal'; 
// import LeadCountSelector from './LeadViewComponents/LeadCountSelector';
// import { ENDPOINTS } from '../../api/constraints';
// import { jwtDecode } from 'jwt-decode';

// const LeadCardViewPage = () => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [allLeads, setAllLeads] = useState([]);
//     const [assignedLeads, setAssignedLeads] = useState([]);
//     const [lostLeads, setLostLeads] = useState([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [viewMode, setViewMode] = useState('grid');
//     const [selectedFilter, setSelectedFilter] = useState(location.state?.activeTab || 'all');
//     const [fromDate, setFromDate] = useState('');
//     const [toDate, setToDate] = useState('');
//     const [showFilterModal, setShowFilterModal] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [currentUserId, setCurrentUserId] = useState(null);
//     const [currentToken, setCurrentToken] = useState(null);
//     const [sortConfig, setSortConfig] = useState({ key: 'dmodified_dt', direction: 'descending' });
//     const leadsPerPage = 12;
//     const [showLostLeads, setShowLostLeads] = useState(true);
//     const [showLostDeals, setShowLostDeals] = useState(true);
//     const [showImportModal, setShowImportModal] = useState(false);
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [importLoading, setImportLoading] = useState(false);
//     const [importError, setImportError] = useState(null);
//     const [importSuccess, setImportSuccess] = useState(false);
//     const [roleID, setRoleID] = useState();
//     const [websiteActive, setWebsiteActive] = useState(false);
//     const [refreshTrigger, setRefreshTrigger] = useState(0);
//     const [potentials, setPotentials] = useState([]);
//     const [statuses, setStatuses] = useState([]);
//     const [sources, setSources] = useState([]);
//     const [leads, setLeads] = useState([]);               
//     const [displayedData, setDisplayedData] = useState([]);    
  
//     // New states for bulk assignment
//     const [selectedLeads, setSelectedLeads] = useState([]);
//     const [showBulkActions, setShowBulkActions] = useState(false);
//     const [showAssignModal, setShowAssignModal] = useState(false);
//     const [usersList, setUsersList] = useState([]);
//     const [selectedUser, setSelectedUser] = useState('');
//     const [assignLoading, setAssignLoading] = useState(false);
//     const [assignError, setAssignError] = useState(null);
//     const [assignSuccess, setAssignSuccess] = useState(false);
//     const [industries, setIndustries] = useState([]);
//     const [services, setServices] = useState([]);
//     const [selectedIndustry, setSelectedIndustry] = useState('');
//     const [selectedService, setSelectedService] = useState('');
//     const [selectedPotential, setSelectedPotential] = useState('');
//     const [selectedStatus, setSelectedStatus] = useState('');
//     const [selectedSource, setSelectedSource] = useState('');
//     const [leadsToShow, setLeadsToShow] = useState(null);
//     const [showPagination, setShowPagination] = useState(true);
//     const params = new URLSearchParams(location.search);
//     const pageFromUrl = Number(params.get("page")) || 1;
//     const [currentPage, setCurrentPage] = useState(pageFromUrl);

//     const filteredData = useMemo(() => {
//     let result = allLeads;
//     if (selectedFilter === 'lost') {
//         result = lostLeads;
//     } else if (selectedFilter === 'assignedToMe') {
//         result = assignedLeads;
//     }
//     return result;
//     }, [allLeads, lostLeads, assignedLeads, selectedFilter]);
    
//     const token = localStorage.getItem("token"); 

//     useEffect(() => {
//         // Change this function to async
//         const fetchMasterData = async () => {
//             const headers = { Authorization: `Bearer ${token}` };
//             try {
//                 // Fetch potentials
//                 const potentialsRes = await fetch(ENDPOINTS.MASTER_POTENTIAL_GET, { headers });
//                 const potentialsData = await potentialsRes.json();
//                 if (potentialsData?.data) {
//                     setPotentials(potentialsData.data.filter(p => p.bactive));
//                 }

//                 // Fetch sources
//                 const sourcesRes = await fetch(ENDPOINTS.MASTER_SOURCE_GET, { headers });
//                 const sourcesData = await sourcesRes.json();
//                 if (sourcesData?.data) {
//                     setSources(sourcesData.data.filter(s => s.is_active));
//                 }

//                 // Fetch statuses
//                 const statusesRes = await fetch(ENDPOINTS.MASTER_STATUS_GET, { headers });
//                 const statusesData = await statusesRes.json();
//                 if (statusesData?.response) {
//                     setStatuses(statusesData.response.filter(s => s.bactive).sort((a, b) => (a.orderId || 0) - (b.orderId || 0)));
//                 }

//                 // Fetch industries
//                 const industriesRes = await fetch(ENDPOINTS.MASTER_INDUSTRY_GET, { headers });
//                 const industriesData = await industriesRes.json();
//                 if (industriesData?.response?.industry) {
//                     setIndustries(industriesData.response.industry.filter(i => i.bactive));
//                 }

//                 // Fetch services
//                 const servicesRes = await fetch(ENDPOINTS.MASTER_SERVICE_GET, { headers });
//                 const servicesData = await servicesRes.json();
//                 if (servicesData?.data) {
//                     setServices(servicesData.data.filter(s => s.bactive));
//                 }

//             } catch (err) {
//                 console.error("Failed to fetch master data:", err);
//             }
//         };

//         if (token) {
//             fetchMasterData();
//         }
//     }, [token]);

//     const handleSelectCount = (count) => {
//         setLeadsToShow(count);
//         setShowPagination(false);
//     };

//     const resetToDefaultView = () => {
//         setLeadsToShow(null);
//         setShowPagination(true);
//     };

//     useEffect(() => {
//     let newData;
//     if (leadsToShow !== null) {
//         newData = filteredData.slice(0, leadsToShow);
//     } else {
//         const startIndex = (currentPage - 1) * leadsPerPage;
//         const endIndex = startIndex + leadsPerPage;
//         newData = filteredData.slice(startIndex, endIndex);
//     }
//     setDisplayedData(newData);
// }, [filteredData, leadsToShow, currentPage, leadsPerPage]);

//     useEffect(() => {
//     }, [leads]);

//     useEffect(() => {
//         const handleRefreshEvent = () => {
//             setRefreshTrigger(prev => prev + 1);
//         };
//         window.addEventListener('leadDataUpdated', handleRefreshEvent);
//         return () => {
//             window.removeEventListener('leadDataUpdated', handleRefreshEvent);
//         };
//     }, []);

//     useEffect(() => {
//         const storedUserData = localStorage.getItem('user');
//         if (storedUserData) {
//             try {
//                 const parsedData = JSON.parse(storedUserData);
//                 const webiteAccess = parsedData?.website_access === true;
//                 setWebsiteActive(webiteAccess);
//                 localStorage.setItem('website_access', webiteAccess);
//             } catch (error) {
//                 console.error('Error parsing user_data:', error);
//             }
//         } else {
//             const webiteAccess = localStorage.getItem('website_access') === 'true';
//             setWebsiteActive(webiteAccess);
//         }
//     }, []);

//     useEffect(() => {
//         if (location.state?.activeTab) {
//             setSelectedFilter(location.state.activeTab);
//         }
//     }, [location.state]);

//     useEffect(() => {
//         let extractedUserId = null;
//         let extractedRoleID = null;
//         let tokenFromStorage = null;
//         try {
//             tokenFromStorage = localStorage.getItem('token');
//             if (tokenFromStorage) {
//                 const decodedToken = jwtDecode(tokenFromStorage);
//                 extractedUserId = decodedToken.user_id;
//                 extractedRoleID = decodedToken.role_id;
//                 if (!extractedUserId) {
//                     throw new Error("User ID (user_id) not found in decoded token payload.");
//                 }
//             } else {
//                 console.error("Authentication token not found in local storage. Please log in.");
//                 setError("Authentication required. Please log in.");
//                 setLoading(false);
//                 return;
//             }
//         } catch (e) {
//             console.error("Error retrieving or decoding token in LeadCardViewPage:", e);
//             setError(`Authentication error: ${e.message}`);
//             setLoading(false);
//             return;
//         }

//         if (extractedUserId && tokenFromStorage) {
//             setCurrentUserId(extractedUserId);
//             setRoleID(extractedRoleID);
//             setCurrentToken(tokenFromStorage);
//         } else {
//             setError("Failed to obtain valid user ID or authentication token.");
//             setLoading(false);
//         }
//     }, []);

// // Fetch users for assignment
//     useEffect(() => {
//         if (!currentToken) return;
        
//         const fetchUsers = async () => {
//             try {
//                 const response = await fetch(ENDPOINTS.GET_USERS, {
//                     headers: {
//                         'Authorization': `Bearer ${currentToken}`,
//                     },
//                 });
                
//                 if (response.ok) {
//                     const data = await response.json();
//                     // console.log("Users data:", data);
                    
//                     // Handle different response structures
//                     let usersArray = [];
                    
//                     if (Array.isArray(data)) {
//                         usersArray = data;
//                     } else if (data.data && Array.isArray(data.data)) {
//                         usersArray = data.data;
//                     } else if (data.response && Array.isArray(data.response)) {
//                         usersArray = data.response;
//                     } else {
//                         console.error("Unexpected response structure:", data);
//                     }
                    
//                     // Filter out any invalid users and ensure iuser_id exists
//                     const validUsers = usersArray.filter(user => 
//                         user && user.iUser_id !== undefined && user.iUser_id !== null
//                     );
                    
//                     setUsersList(validUsers);
//                 } else {
//                     console.error("Failed to fetch users for assignment");
//                     setUsersList([]);
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch users:", error);
//                 setUsersList([]);
//             }
//         };
        
//         fetchUsers();
//     }, [currentToken]);

//     const formatDate = (dateStr) =>
//         dateStr
//             ? new Date(dateStr).toLocaleDateString('en-GB', {
//                 day: '2-digit',
//                 month: 'numeric',
//                 year: 'numeric',
//             })
//             : '-';

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'hot':
//                 return 'bg-red-700 text-white';
//             case 'warm':
//                 return 'bg-yellow-500 text-white';
//             case 'cold':
//                 return 'bg-blue-700 text-white';
//             case 'new':
//                 return 'bg-sky-600 text-white';
//             case 'contacted':
//                 return 'bg-green-500 text-white';
//             case 'interested':
//                 return 'bg-purple-600 text-white';
//             case 'lost':
//             case 'closed lost':
//                 return 'bg-red-700 text-white';
//             case 'pending':
//                 return 'bg-orange-500 text-white';
//             case 'website lead':
//                 return 'bg-blue-100 text-blue-700';
//             case 'lead':
//                 return 'bg-indigo-100 text-indigo-700';
//             default:
//                 return 'bg-gray-300 text-gray-700';
//         }
//     };

//     const isWithinDateRange = (date) => {
//         if (!date) return true;
//         const d = new Date(date);
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
//         return (!from || d >= from) && (!to || d <= to);
//     };

//     const applyFilters = useCallback((data, isAssigned = false) => {
//         return data.filter((item) => {
//             const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
//             const matchesSearch =
//                 match(item.clead_name) ||
//                 match(item.corganization || item.c_organization) ||
//                 match(item.cemail || item.c_email) ||
//                 match(item.iphone_no || item.c_phone) ||
//                 (isAssigned && match(item.iassigned_by_name)) ||
//                 (isAssigned && match(item.statusDisplay));

//             let dateToFilter = item.dmodified_dt || item.d_modified_date;
//             if (isAssigned) {
//                 dateToFilter = item.dupdate_dt || item.dmodified_dt || item.dcreate_dt;
//             }
//             const matchesDate = isWithinDateRange(dateToFilter);

//             const isConverted = item.bisConverted === true || item.bisConverted === 'true';
//             const isActive = item.bactive === true || item.bactive === 'true';
//             const isWebsite = item.website_lead === true || item.website_lead === 'true';

//             if (selectedFilter === 'all') {
//                 return matchesSearch && matchesDate;
//             } else if (selectedFilter === 'leads') {
//                 return matchesSearch && matchesDate && isActive && !isConverted && !isWebsite;
//             } else if (selectedFilter === 'websiteLeads') {
//                 return matchesSearch && matchesDate && isWebsite && isActive;
//             } else if (selectedFilter === 'lost') {
//                 if (isActive === false) {
//                     const isLeadLost = !isConverted && showLostLeads;
//                     const isDealLost = isConverted && showLostDeals;
//                     return matchesSearch && matchesDate && (isLeadLost || isDealLost);
//                 }
//                 return false;
//             } else if (selectedFilter === 'assignedToMe') {
//                 return matchesSearch && matchesDate && isActive;
//             }
//             return matchesSearch && matchesDate;
//         });
//     }, [searchTerm, fromDate, toDate, selectedFilter, showLostLeads, showLostDeals]);

//     const fetchLeads = useCallback(async () => {
//         if (!currentUserId || !currentToken) {
//             setLoading(false);
//             return;
//         }
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetch(`${ENDPOINTS.LEAD}${currentUserId}?page=1&limit=10000`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${currentToken}`,
//                 },
//             });

//             if (!res.ok) {
//                 const bodyText = await res.text();
//                 let errorDetails = `HTTP error! status: ${res.status}`;
//                 try {
//                     const errorJson = JSON.parse(bodyText);
//                     errorDetails += `, Details: ${JSON.stringify(errorJson)}`;
//                 } catch {
//                     errorDetails += `, Message: ${bodyText || res.statusText}`;
//                 }
//                 throw new Error(errorDetails);
//             }
//             const data = await res.json();
//             const sorted = (Array.isArray(data.details) ? data.details : []).sort(
//                 (a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0)
//             );
//             setAllLeads(sorted);
//         } catch (err) {
//             console.error("Failed to fetch leads:", err);
//             setError(`Failed to fetch leads: ${err.message}`);
//             setAllLeads([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentUserId, currentToken]);

//     const fetchLostLeads = useCallback(async () => {
//         if (!currentUserId || !currentToken) {
//             setLoading(false);
//             return;
//         }
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetch(`${ENDPOINTS.LOST_DETAILS}/${currentUserId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${currentToken}`,
//                 },
//             });
//             if (!res.ok) {
//                 const errorData = await res.text();
//                 throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData || res.statusText}`);
//             }
//             const data = await res.json();
//             const sortedLost = (Array.isArray(data.data) ? data.data : [])
//                 .sort((a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0));
//             setLostLeads(sortedLost);
//         } catch (err) {
//             console.error("Failed to fetch lost leads:", err);
//             setError(`Failed to fetch lost leads: ${err.message}`);
//             setLostLeads([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentUserId, currentToken]);

//     const fetchAssignedLeads = useCallback(async () => {
//         if (!currentUserId || !currentToken) {
//             setLoading(false);
//             return;
//         }

//         setLoading(true);
//         setError(null);

//         try {
//             const response = await fetch(`${ENDPOINTS.ASSIGN_TO_ME}/${currentUserId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${currentToken}`,
//                 },
//             });

//             if (!response.ok) {
//                 const errorData = await response.text();
//                 throw new Error(`HTTP error! status: ${response.status}, Message: ${errorData || response.statusText}`);
//             }

//             const resJson = await response.json();

//             const assignedEntries = resJson?.data?.assignedEntries || [];
//             const leadsAssigned = resJson?.data?.leadsAssigned || [];

//             // Flatten assignedEntries with lead details for frontend
//             const mergedLeads = assignedEntries.map(entry => {
//                 const leadDetails = leadsAssigned.find(lead => lead.ilead_id === entry.ilead_id) || {};
//                 return {
//                     ...entry,
//                     ...leadDetails, // merge lead details to top level
//                     statusDisplay: leadDetails?.lead_status?.clead_name || 'Unknown',
//                     potentialDisplay: leadDetails?.lead_potential?.clead_name || 'Unknown',
//                 };
//             });

//             setAssignedLeads(mergedLeads);

//         } catch (err) {
//             console.error("Failed to fetch assigned leads:", err);
//             setError(`Failed to fetch assigned leads: ${err.message}`);
//             setAssignedLeads([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentUserId, currentToken]);

//     useEffect(() => {
//     if (!currentUserId || !currentToken) return;
//     if (selectedFilter !== 'lost') {
//         setShowLostLeads(true);
//         setShowLostDeals(true);
//     }
//     if (selectedFilter === 'assignedToMe') {
//         fetchAssignedLeads();
//     } else if (selectedFilter === 'lost') {
//         fetchLostLeads();
//     } else {
//         fetchLeads();
//     }
//   }, [selectedFilter, currentUserId, currentToken, fetchLeads, fetchAssignedLeads, fetchLostLeads, refreshTrigger]);
    

//     useEffect(() => {
//         navigate(`?page=${currentPage}`, { replace: true });
//     }, [currentPage, navigate]); 

//     useEffect(() => {
//         setCurrentPage(pageFromUrl);
//     }, [pageFromUrl]);

//     const handleSort = useCallback((key) => {
//         setSortConfig(prevSortConfig => {
//             let direction = 'ascending';
//             if (prevSortConfig.key === key && prevSortConfig.direction === 'ascending') {
//                 direction = 'descending';
//             }
//             return { key, direction };
//         });
//     }, []);

//     const dataToDisplay = useMemo(() => {
//         let data = [];
//         if (selectedFilter === 'assignedToMe') {
//             data = applyFilters(assignedLeads, true);
//         } else if (selectedFilter === 'lost') {
//             data = applyFilters(lostLeads, false);
//         } else {
//             data = applyFilters(allLeads, false);
//         }
//         return data;
//     }, [selectedFilter, assignedLeads, lostLeads, allLeads, applyFilters]);

//     const sortedData = useMemo(() => {
//         let sortableItems = [...dataToDisplay];
//         if (sortConfig.key) {
//             sortableItems.sort((a, b) => {
//                 const getStringValue = (item, keys) => {
//                     for (const key of keys) {
//                         if (item && item[key] !== undefined && item[key] !== null) {
//                             return String(item[key]).toLowerCase();
//                         }
//                     }
//                     return '';
//                 };
//                 const getDateValue = (item, keys) => {
//                     for (const key of keys) {
//                         if (item && item[key]) {
//                             const date = new Date(item[key]);
//                             return isNaN(date.getTime()) ? new Date(0) : date;
//                         }
//                     }
//                     return new Date(0);
//                 };

//                 let aValue, bValue;
//                 switch (sortConfig.key) {
//                     case 'clead_name':
//                         aValue = getStringValue(a, ['clead_name']);
//                         bValue = getStringValue(b, ['clead_name']);
//                         break;
//                     case 'corganization':
//                         aValue = getStringValue(a, ['corganization', 'c_organization']);
//                         bValue = getStringValue(b, ['corganization', 'c_organization']);
//                         break;
//                     case 'cemail':
//                         aValue = getStringValue(a, ['cemail', 'c_email']);
//                         bValue = getStringValue(b, ['cemail', 'c_email']);
//                         break;
//                     case 'iphone_no':
//                         aValue = getStringValue(a, ['iphone_no', 'c_phone']);
//                         bValue = getStringValue(b, ['iphone_no', 'c_phone']);
//                         break;
//                     case 'iassigned_by_name':
//                         aValue = getStringValue(a, ['iassigned_by_name']);
//                         bValue = getStringValue(b, ['iassigned_by_name']);
//                         break;
//                     case 'dcreate_dt':
//                         aValue = getDateValue(a, ['dcreate_dt', 'd_created_date']);
//                         bValue = getDateValue(b, ['dcreate_dt', 'd_created_date']);
//                         break;
//                     case 'dupdate_dt':
//                         aValue = getDateValue(a, ['dupdate_dt', 'dmodified_dt', 'd_modified_date']);
//                         bValue = getDateValue(b, ['dupdate_dt', 'dmodified_dt', 'd_modified_date']);
//                         break;
//                     case 'dmodified_dt':
//                         aValue = getDateValue(a, ['dmodified_dt', 'd_modified_date']);
//                         bValue = getDateValue(b, ['dmodified_dt', 'd_modified_date']);
//                         break;
//                     case 'statusDisplay':
//                         aValue = getStringValue(a, ['statusDisplay']);
//                         bValue = getStringValue(b, ['statusDisplay']);
//                         break;
//                     case 'lead_status':
//                         aValue = getStringValue(a.lead_status, ['clead_name']);
//                         bValue = getStringValue(b.lead_status, ['clead_name']);
//                         break;
//                     default:
//                         aValue = String(a[sortConfig.key] || '').toLowerCase();
//                         bValue = String(b[sortConfig.key] || '').toLowerCase();
//                 }
//                 if (aValue < bValue) {
//                     return sortConfig.direction === 'ascending' ? -1 : 1;
//                 }
//                 if (aValue > bValue) {
//                     return sortConfig.direction === 'ascending' ? 1 : -1;
//                 }
//                 return 0;
//             });
//         }
//         return sortableItems;
//     }, [dataToDisplay, sortConfig]);

//     // const totalPages = Math.ceil(sortedData.length / leadsPerPage);
//     const totalPages = leadsToShow ? 1 : Math.ceil(filteredData.length / leadsPerPage);
//     const calculateDisplayedData = (filteredData, leadsToShow, currentPage, leadsPerPage) => {
//         if (leadsToShow !== null) {
//             return filteredData.slice(0, leadsToShow);
//         } else {
//             const startIndex = (currentPage - 1) * leadsPerPage;
//             const endIndex = startIndex + leadsPerPage;
//             return filteredData.slice(startIndex, endIndex);
//         }
//     };

//     useEffect(() => {
//         const newDisplayedData = calculateDisplayedData(filteredData, leadsToShow, currentPage, leadsPerPage);
//         setDisplayedData(newDisplayedData);
//     }, [filteredData, leadsToShow, currentPage, leadsPerPage]);
//     const handleSearchChange = (e) => {
//         setSearchTerm(e.target.value);
//         setCurrentPage(1);
//     };

//     const handleFilterApply = () => {
//             // console.log("1st lead object:", allLeads[0]); 
//         let filtered = [...allLeads];

//         // Filter by Potential
//         if (selectedPotential) {
//             filtered = filtered.filter(lead => lead.lead_potential?.clead_name === selectedPotential);
//             // console.log("Filtered by potential:", filtered);
//         }

//         // Filter by Status
//         if (selectedStatus) {
//             filtered = filtered.filter(lead => lead.lead_status?.clead_name === selectedStatus);
//             // console.log("Filtered by status:", filtered);
//         }
//         // Filter by Source
//         if (selectedSource) {
//             filtered = filtered.filter(lead => lead.lead_source_id === Number(selectedSource));
//             // console.log("Filtered by source:", filtered);
//         }

//         // Filter by Industry
//         if (selectedIndustry) {
//             filtered = filtered.filter(lead => lead.cindustry_id === Number(selectedIndustry));
//             // console.log("Filtered by industry:", filtered);
//         }
//         // Filter by Service
//         if (selectedService) {
//             filtered = filtered.filter(lead => lead.iservice_id === Number(selectedService));
//             // console.log("Filtered by service:", filtered);
//         }

//         // Filter Lost Leads/Deals
//         if (selectedFilter === 'lost') {
//             if (!showLostLeads) {
//                 filtered = filtered.filter(
//                     lead => lead.bisConverted === true || lead.bactive === true
//                 );
//             }
//             if (!showLostDeals) {
//                 filtered = filtered.filter(
//                     lead => lead.bisConverted !== true
//                 );
//             }
//         }
//         // Filter by date
//         if (fromDate) {
//             const fromDateObj = new Date(fromDate);
//             fromDateObj.setHours(0, 0, 0, 0);

//             filtered = filtered.filter(
//                 lead => new Date(lead.dcreated_dt) >= fromDateObj
//             );
//         }

//         if (toDate) {
//             const toDateObj = new Date(toDate);
//             toDateObj.setHours(23, 59, 59, 999);
            
//             filtered = filtered.filter(
//                 lead => new Date(lead.dcreated_dt) <= toDateObj
//             );
//         }

//         setDisplayedData(filtered);
//         setShowFilterModal(false); 
//     };

//     const handleResetFilters = () => {
//         setFromDate('');
//         setToDate('');
//         setSelectedPotential('');
//         setSelectedStatus('');
//         setSelectedSource('');
//         setSelectedIndustry('');
//         setSelectedService('');
//         setDisplayedData(leads);
//     };

//     const goToDetail = (id) => {
//         navigate(`/leaddetailview/${id}?page=${currentPage}`);
//     };

//     // const goToDetail = (id) => {
//     //     navigate(`/leaddetailview/${id}`);
//     // };

//     const getSortIndicator = (key) => {
//         if (sortConfig.key === key) {
//             return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
//         }
//         return ' ↕';
//     };

//     const handleImportSubmit = async () => {
//         if (!selectedFile) {
//             setImportError("Please select a file to import");
//             return;
//         }
//         const formData = new FormData();
//         formData.append('file', selectedFile);
//         setImportLoading(true);
//         setImportError(null);
//         setImportSuccess(false);
//         try {
//             const response = await fetch(ENDPOINTS.EXCEL_IMPORT, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${currentToken}`,
//                 },
//                 body: formData,
//             });
//             const responseData = await response.json();
//             if (!response.ok) {
//                 let errorMessage = "Import failed";
//                 if (responseData.Message) {
//                     if (typeof responseData.Message === 'object' && responseData.Message.Message) {
//                         errorMessage = responseData.Message.Message;
//                     } else if (typeof responseData.Message === 'string') {
//                         errorMessage = responseData.Message;
//                     }
//                 } else if (responseData.detail) {
//                     errorMessage = responseData.detail;
//                 } else if (responseData.message) {
//                     errorMessage = responseData.message;
//                 } else if (responseData.errors) {
//                     if (Array.isArray(responseData.errors)) {
//                         errorMessage = responseData.errors.join('\n');
//                     } else if (typeof responseData.errors === 'object') {
//                         errorMessage = Object.entries(responseData.errors)
//                             .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
//                             .join('\n');
//                     } else {
//                         errorMessage = responseData.errors;
//                     }
//                 } else {
//                     errorMessage = `Server error: ${response.status}`;
//                 }
//                 throw new Error(errorMessage);
//             }
//             setImportSuccess(true);
//             setTimeout(() => {
//                 fetchLeads();
//                 setShowImportModal(false);
//                 setSelectedFile(null);
//                 window.dispatchEvent(new Event('leadDataUpdated'));
//             }, 1500);
//         } catch (err) {
//             console.error("Import error:", err);
//             let userErrorMessage = err.message;
//             if (err.message.includes("Industry") && err.message.includes("not found")) {
//                 const allowedIndustriesMatch = err.message.match(/Allowed: (.+)$/);
//                 if (allowedIndustriesMatch) {
//                     userErrorMessage = `Invalid industry. Allowed industries are: ${allowedIndustriesMatch[1]}`;
//                 }
//             }
//             setImportError(userErrorMessage);
//         } finally {
//             setImportLoading(false);
//         }
//     };

//     // Bulk assignment functions
//     const toggleLeadSelection = (leadId) => {
//         setSelectedLeads(prev => {
//             if (prev.includes(leadId)) {
//                 return prev.filter(id => id !== leadId);
//             } else {
//                 return [...prev, leadId];
//             }
//         });
//     };

//     const toggleSelectAll = () => {
//         if (selectedLeads.length === displayedData.length) {
//             setSelectedLeads([]);
//         } else {
//             setSelectedLeads(displayedData.map(lead => lead.ilead_id));
//         }
//     };

// const handleBulkAssign = async () => {
//     const assignedToUserId = parseInt(selectedUser);
    
//     if (!assignedToUserId || isNaN(assignedToUserId) || selectedLeads.length === 0) {
//         setAssignError("Please select a valid user to assign leads to");
//         return;
//     }
    
//     setAssignLoading(true);
//     setAssignError(null);
    
//     try {
//         const response = await fetch(ENDPOINTS.BULK_ASSIGN, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${currentToken}`,
//             },
//             body: JSON.stringify({
//                 leadIds: selectedLeads,
//                 assignedTo: assignedToUserId
//             }),
//         });
        
//         const data = await response.json();
        
//         if (response.ok) {
//             setAssignSuccess(true);
//             setTimeout(() => {
//                 setShowAssignModal(false);
//                 setSelectedLeads([]);
//                 setSelectedUser(''); 
//                 setShowBulkActions(false);
//                 if (selectedFilter === 'assignedToMe') fetchAssignedLeads();
//                 else if (selectedFilter === 'lost') fetchLostLeads();
//                 else fetchLeads();
//             }, 1500);
//         } else {
//             setAssignError(data.Message || "Failed to assign leads");
//         }
//     } catch (error) {
//         console.error("Assignment error:", error);
//         setAssignError("An error occurred during assignment");
//     } finally {
//         setAssignLoading(false);
//         useEffect(() => {
//         setSelectedLeads([]);
//         setShowBulkActions(false);
//     }, [selectedFilter, currentPage]);

//     useEffect(() => {
//         setShowBulkActions(selectedLeads.length > 0);
//     }, [selectedLeads]);
//     }
// };
//     useEffect(() => {
//         setSelectedLeads([]);
//         setShowBulkActions(false);
//     }, [selectedFilter, currentPage]);

//     useEffect(() => {
//         setShowBulkActions(selectedLeads.length > 0);
//     }, [selectedLeads]);

//     if (loading) {
//         return <Loader />;
//     }

//     if (error) {
//         return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
//     }

//     return (
//         <div className="max-w-full mx-auto p-4 rounded-2xl space-y-6 min-h-screen">
//             <ProfileHeader />
            
//             {/* Bulk Actions Bar */}
//             {showBulkActions && (
//                 <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
//                     <div className="flex items-center">
//                         <span className="font-medium text-blue-800 mr-4">
//                             {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
//                         </span>
//                         <button
//                             onClick={() => setShowAssignModal(true)}
//                             className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 flex items-center"
//                         >
//                             <Users size={16} className="mr-2" />
//                             Assign Selected
//                         </button>
//                     </div>
//                     <button
//                         onClick={() => setSelectedLeads([])}
//                         className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                     >
//                         Clear Selection
//                     </button>
//                 </div>
//             )}

//             <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
//                 <input
//                     type="text"
//                     value={searchTerm}
//                     onChange={handleSearchChange}
//                     placeholder="Search leads..."
//                     className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//                 />
//                 <div className="flex gap-2 flex-wrap">
//                     <button
//                         onClick={() => {
//                             if (selectedFilter === 'assignedToMe') fetchAssignedLeads();
//                             else if (selectedFilter === 'lost') fetchLostLeads();
//                             else fetchLeads();
//                         }}
//                         title="Refresh"
//                         className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
//                     >
//                         <RotateCw size={18} />
//                     </button>
//                     <button
//                         onClick={() => setViewMode('grid')}
//                         className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//                     >
//                         <LayoutGrid size={18} />
//                     </button>
//                     <button
//                         onClick={() => setViewMode('list')}
//                         className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//                     >
//                         <List size={18} />
//                     </button>
//                     <button
//                         onClick={() => setShowFilterModal(true)}
//                         className={`p-2 rounded-full ${
//                             showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
//                         }`}
//                     >
//                         <Filter size={18} />
//                     </button>
//                 </div>
//             </div>

//             <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
//                 <div className="flex flex-wrap gap-2">
//                     {[
//                         'all',
//                         'leads',
//                         ...(websiteActive ? ['websiteLeads'] : []),
//                         'assignedToMe',
//                         'lost'
//                     ].map((filterKey) => (
//                         <button
//                             key={filterKey}
//                             onClick={() => {
//                                 setSelectedFilter(filterKey);
//                                 setSearchTerm('');
//                                 setFromDate('');
//                                 setToDate('');
//                                 setCurrentPage(1);
//                                 setSelectedPotential('');
//                                 setSelectedStatus('');
//                                 setSelectedSource('');
//                                 setSelectedIndustry(''); 
//                                 setSelectedService('');
//                             }}
//                             className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                                 selectedFilter === filterKey
//                                     ? (filterKey === 'lost' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white')
//                                     : 'bg-gray-50 text-gray-700 hover:bg-gray-300'
//                             }`}
//                         >
//                             {filterKey === 'all'
//                                 ? 'All Leads'
//                                 : filterKey === 'leads'
//                                     ? 'Leads'
//                                     : filterKey === 'websiteLeads'
//                                         ? <> Website Leads <FaCrown className="inline ml-1 text-yellow-600" size={18} /></>
//                                         : filterKey === 'lost'
//                                             ? 'Lost'
//                                             : 'Assigned to Me'}
//                         </button>
//                     ))}
//                 </div>

//                 {roleID && (
//                     <button 
//                         onClick={() => setShowImportModal(true)}
//                         className='bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition whitespace-nowrap'
//                     >
//                         Import Leads
//                     </button>  
//                 )}
//             </div>

//             {selectedFilter === 'lost' && (
//                 <div className="flex flex-wrap gap-4 mt-5 mb-5 items-center">
//                     <label className="flex items-center space-x-2 text-gray-700">
//                         <input
//                             type="checkbox"
//                             checked={showLostLeads}
//                             onChange={(e) => setShowLostLeads(e.target.checked)}
//                             className="form-checkbox h-4 w-4 text-red-600 transition duration-150 ease-in-out"
//                         />
//                         <span>Show Lost Leads</span>
//                     </label>
//                     <label className="flex items-center space-x-2 text-gray-700">
//                         <input
//                             type="checkbox"
//                             checked={showLostDeals}
//                             onChange={(e) => setShowLostDeals(e.target.checked)}
//                             className="form-checkbox h-4 w-4 text-red-600 transition duration-150 ease-in-out"
//                         />
//                         <span>Show Lost Customers</span>
//                     </label>
//                 </div>
//             )}

//             <LeadFilterModal
//                 showModal={showFilterModal}
//                 onClose={() => setShowFilterModal(false)}
//                 onApply={handleFilterApply}
//                 onReset={handleResetFilters}
//                 fromDate={fromDate}
//                 setFromDate={setFromDate}
//                 toDate={toDate}
//                 setToDate={setToDate}
//                 selectedPotential={selectedPotential}
//                 setSelectedPotential={setSelectedPotential}
//                 selectedStatus={selectedStatus}
//                 setSelectedStatus={setSelectedStatus}
//                 selectedSource={selectedSource}
//                 setSelectedSource={setSelectedSource}
//                 potentials={potentials}
//                 statuses={statuses}
//                 sources={sources}
//                 industries={industries}
//                 setIndustries={setIndustries}
//                 selectedIndustry={selectedIndustry}
//                 setSelectedIndustry={setSelectedIndustry}
//                 services={services}
//                 setServices={setServices}
//                 selectedService={selectedService}
//                 setSelectedService={setSelectedService}
//             />

//             {showAssignModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
//                         <h2 className="text-lg font-medium text-gray-800">Assign Selected Leads</h2>
                        
//                         <p className="text-sm text-gray-600">
//                             Assign {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} to:
//                         </p>
                        
//                         {assignError && (
//                             <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
//                                 {assignError}
//                             </div>
//                         )}
                        
//                         {assignSuccess && (
//                             <div className="text-green-600 text-sm p-2 bg-green-50 rounded-md">
//                                 Leads assigned successfully!
//                             </div>
//                         )}
                        
//                         <label className="block text-sm text-gray-700">
//                             Select User
//                             <select
//                                 value={selectedUser}
//                                 onChange={(e) => setSelectedUser(e.target.value)}
//                                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                                 disabled={assignLoading || assignSuccess}
//                             >
//                                 <option value="">Select a user</option>
//                                 {usersList.length > 0 ? (
//                                     usersList.map(user => (
//                                         <option key={user.iUser_id} value={user.iUser_id}>
//                                             {user.cFull_name || `User ${user.iUser_id}`}
//                                         </option>
//                                     ))
//                                 ) : (
//                                     <option value="" disabled>No users available</option>
//                                 )}
//                             </select>
//                         </label>
                        
//                         <div className="flex justify-end gap-2 pt-4">
//                             <button
//                                 onClick={() => {
//                                     setShowAssignModal(false);
//                                     setSelectedUser('');
//                                     setAssignError(null);
//                                     setAssignSuccess(false);
//                                 }}
//                                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//                                 disabled={assignLoading}
//                             >
//                                 Cancel
//                             </button>
//                             <button 
//                                 onClick={handleBulkAssign}
//                                 disabled={!selectedUser || assignLoading || assignSuccess}
//                                 className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                                 {assignLoading ? (
//                                     <span className="flex items-center">
//                                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                         </svg>
//                                         Assigning...
//                                     </span>
//                                 ) : "Assign"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {showImportModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 " onClick={() => setShowImportModal(false)}>
//                     <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e)=>e.stopPropagation()} >
//                         <h2 className="text-lg font-medium text-gray-800">Import Leads</h2>

//                         <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
//                             <p className="font-medium">Import Instructions:</p>
//                             <ul className="list-disc pl-5 space-y-1 mt-1">
//                                 <li>Use the template below to ensure proper formatting</li>
//                                 <li>Required fields: Name, Email or Phone</li>
//                                 <li>Supported file types: .xlsx, .xls, .csv</li>
//                                 <li>Max file size: 5MB</li>
//                             </ul>
//                         </div>

//                         <div className="flex justify-center mb-4">
//                             <a
//                                 href="../../../public/files/import_leads.xls"
//                                 download="Leads_Import_Template.xls"
//                                 className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
//                             >
//                                 <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
//                                 </svg>
//                                 Download Import Template
//                             </a>
//                         </div>

//                         {importError && (
//                             <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
//                                 <div className="font-medium mb-1">Import Error:</div>
//                                 <div>{importError}</div>
//                             </div>
//                         )}

//                         {importSuccess && (
//                             <div className="text-green-600 text-sm p-2 bg-green-50 rounded-md">
//                                 Leads imported successfully!
//                             </div>
//                         )}

//                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
//                             <input 
//                                 type="file" 
//                                 id="file-upload"
//                                 accept=".xlsx,.xls,.csv"
//                                 onChange={(e) => setSelectedFile(e.target.files[0])}
//                                 className="hidden"
//                             />
//                             <label 
//                                 htmlFor="file-upload" 
//                                 className="cursor-pointer flex flex-col items-center justify-center"
//                             >
//                                 <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
//                                 </svg>
//                                 <span className="text-sm text-gray-600">
//                                     {selectedFile ? selectedFile.name : "Click to select Excel file"}
//                                 </span>
//                             </label>
//                         </div>

//                         <div className="flex justify-end gap-2 pt-4">
//                             <button
//                                 onClick={() => {
//                                     setShowImportModal(false);
//                                     setSelectedFile(null);
//                                     setImportError(null);
//                                     setImportSuccess(false);
//                                 }}
//                                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//                             >
//                                 Cancel
//                             </button>
//                             <button 
//                                 onClick={handleImportSubmit}
//                                 disabled={!selectedFile || importLoading}
//                                 className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                                 {importLoading ? (
//                                     <span className="flex items-center">
//                                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                         </svg>
//                                         Importing...
//                                     </span>
//                                 ) : "Import"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {displayedData.length === 0 ? (
//                 <div className="text-center text-gray-500 text-sm sm:text-base py-8">
//                     No {selectedFilter === 'assignedToMe' ? 'assigned leads' : selectedFilter === 'lost' ? 'lost Customers' : 'leads'} found.
//                 </div>
//             ) : (
//                 <>
//                     {viewMode === 'list' && (
//                         <>
//                         <div className="flex justify-end my-4">
//             <LeadCountSelector
//                 leadsCount={filteredData.length}
//                 onSelect={handleSelectCount}
//                 selectedCount={leadsToShow}
//             />
//         </div>  
//                         <div className="overflow-x-auto rounded-2xl shadow-md border bg-white border-gray-200">
//                             <div className={`min-w-[600px] grid gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium ${selectedFilter === 'assignedToMe' ? 'grid-cols-10' : 'grid-cols-7'}`}>
//                                 {/* Select All checkbox */}
//                                <div className="inline-flex items-center">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedLeads.length === displayedData.length && displayedData.length > 0}
//                                     onChange={toggleSelectAll}
//                                     className="h-4 w-4 text-blue-600 rounded"
//                                 />
//                         </div>
//                                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('clead_name')}>
//                                     Name {getSortIndicator('clead_name')}
//                                 </div>
//                                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('corganization')}>
//                                     Org {getSortIndicator('corganization')}
//                                 </div>
//                                 <div className="min-w-[120px] cursor-pointer flex items-center" onClick={() => handleSort('cemail')}>
//                                     Email {getSortIndicator('cemail')}
//                                 </div>
//                                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('iphone_no')}>
//                                     Phone {getSortIndicator('iphone_no')}
//                                 </div>
//                                 {selectedFilter === 'assignedToMe' && (
//                                     <>
//                                         <div className="cursor-pointer flex items-center" onClick={() => handleSort('iassigned_by_name')}>
//                                             Assigned by {getSortIndicator('iassigned_by_name')}
//                                         </div>
//                                         <div className="cursor-pointer flex items-center" onClick={() => handleSort('dcreate_dt')}>
//                                             Created at {getSortIndicator('dcreate_dt')}
//                                         </div>
//                                         <div className="cursor-pointer flex items-center" onClick={() => handleSort('dupdate_dt')}>
//                                             Updated at {getSortIndicator('dupdate_dt')}
//                                         </div>
//                                     </>
//                                 )}
//                                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('dmodified_dt')}>
//                                     Modified {getSortIndicator('dmodified_dt')}
//                                 </div>
//                                 {selectedFilter === 'assignedToMe' ? (
//                                     <div className="cursor-pointer flex items-center" onClick={() => handleSort('statusDisplay')}>
//                                         Status {getSortIndicator('statusDisplay')}
//                                     </div>
//                                 ) : (
//                                     <div className="cursor-pointer flex items-center" onClick={() => handleSort('lead_status')}>
//                                         Status {getSortIndicator('lead_status')}
//                                     </div>
//                                 )}
//                             </div>
//                             {displayedData.map((item) => {
//                                 const isItemCurrentlyLost = !(item.bactive === true || item.bactive === 'true');
//                                 const isConverted = item.bisConverted === true || item.bisConverted === 'true';

//                                 let statusText;
//                                 let statusBgColor;

//                                 if (selectedFilter === 'assignedToMe') {
//                                     statusText = item.statusDisplay;
//                                     statusBgColor = item.statusColor;
//                                 } else if (selectedFilter === 'lost') {
//                                     statusText = item.lead_status?.clead_name
//                                         ? `${item.lead_status.clead_name} (Lost)`
//                                         : isConverted
//                                         ? 'Deal Lost'
//                                         : 'Lead Lost';
//                                     statusBgColor = getStatusColor('lost');
//                                 } else {
//                                     if (isItemCurrentlyLost) {
//                                         statusText = item.lead_status?.clead_name
//                                             ? `${item.lead_status.clead_name} (Lost)`
//                                             : isConverted
//                                             ? 'Deal Lost'
//                                             : 'Lead Lost';
//                                         statusBgColor = getStatusColor('lost');
//                                     } else if (isConverted) {
//                                         statusText = 'Deal';
//                                         statusBgColor = getStatusColor('deal');
//                                     } else if (item.website_lead === true || item.website_lead === 'true') {
//                                         statusText = 'Website Lead';
//                                         statusBgColor = getStatusColor('website lead');
//                                     } else {
//                                         statusText = item.lead_status?.clead_name || 'Lead';
//                                         statusBgColor = getStatusColor(item.lead_status?.clead_name || 'lead');
//                                     }
//                                 }

//                                 return (
//                                     <div
//                                         key={item.ilead_id || `assigned-${item.cemail}-${item.iphone_no}-${item.dcreate_dt || Date.now()}`}
//                                         className={`min-w-[600px] grid gap-4 px-4 py-3 border-t hover:bg-gray-100 cursor-pointer text-sm text-gray-700 ${selectedFilter === 'assignedToMe' ? 'grid-cols-10' : 'grid-cols-7'}`}
//                                     >
//                                         {/* Checkbox for selection */}
//                                         <div className="flex items-center">
//                                             <input
//                                                 type="checkbox"
//                                                 checked={selectedLeads.includes(item.ilead_id)}
//                                                 onChange={() => toggleLeadSelection(item.ilead_id)}
//                                                 onClick={(e) => e.stopPropagation()}
//                                                 className="h-4 w-4 text-blue-600 rounded"
//                                             />
//                                         </div>
                                        
//                                         <div onClick={() => goToDetail(item.ilead_id)}>{item.clead_name || '-'}</div>
//                                         <div onClick={() => goToDetail(item.ilead_id)}>{item.corganization || item.c_organization || '-'}</div>
//                                         <div className="relative group overflow-visible" onClick={() => goToDetail(item.ilead_id)}>
//                                             <span className="block truncate">
//                                                 {item.cemail || item.c_email || '-'}
//                                             </span>
//                                             {(item.cemail || item.c_email) && (
//                                                 <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg p-2 rounded-md text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max pointer-events-none group-hover:pointer-events-auto">
//                                                     {item.cemail || item.c_email}
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div onClick={() => goToDetail(item.ilead_id)}>{item.iphone_no || item.c_phone || '-'}</div>
//                                         {selectedFilter === 'assignedToMe' && (
//                                             <>
//                                                 <div onClick={() => goToDetail(item.ilead_id)}>{item.iassigned_by_name || '-'}</div>
//                                                 <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dcreate_dt)}</div>
//                                                 <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dupdate_dt || item.dmodified_dt)}</div>
//                                             </>
//                                         )}
//                                         <div onClick={() => goToDetail(item.ilead_id)}>{formatDate(item.dmodified_dt || item.d_modified_date)}</div>
//                                         <div onClick={() => goToDetail(item.ilead_id)}>
//                                             <span className={`px-3 py-1 rounded-full text-xs ${statusBgColor}`}>
//                                                 {statusText}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                          </>
//                     )}

//                     {viewMode === 'grid' && (
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
//                             {displayedData.map((item) => {
//                                 const isItemCurrentlyLost = !(item.bactive === true || item.bactive === 'true');
//                                 const isConverted = item.bisConverted === true || item.bisConverted === 'true';

//                                 let statusText;
//                                 let statusBgColor;

//                                 if (selectedFilter === 'assignedToMe') {
//                                     statusText = item.statusDisplay;
//                                     statusBgColor = item.statusColor;
//                                 } else if (selectedFilter === 'lost') {
//                                     statusText = item.lead_status?.clead_name
//                                         ? `${item.lead_status.clead_name} (Lost)`
//                                         : isConverted
//                                         ? 'Deal Lost'
//                                         : 'Lead Lost';
//                                     statusBgColor = getStatusColor('lost');
//                                 } else {
//                                     if (isItemCurrentlyLost) {
//                                         if (isConverted) {
//                                             statusText = 'Deal Lost';
//                                         } else {
//                                             statusText = `${item.lead_status?.clead_name || 'Lead'} (Lost)`;
//                                         }
//                                         statusBgColor = getStatusColor('lost');
//                                     } else {
//                                         if (isConverted) {
//                                             statusText = 'Deal';
//                                             statusBgColor = getStatusColor('deal');
//                                         } else if (item.website_lead === true || item.website_lead === 'true') {
//                                             statusText = 'Website Lead';
//                                             statusBgColor = getStatusColor('website lead');
//                                         } else {
//                                             statusText = item.lead_status?.clead_name || 'Lead';
//                                             statusBgColor = getStatusColor(item.lead_status?.clead_name || 'lead');
//                                         }
//                                     }
//                                 }

//                                 return (
//                                     <div
//                                         key={item.ilead_id || `assigned-${item.cemail}-${item.iphone_no}-${item.dcreate_dt || Date.now()}`}
//                                         className="relative bg-white rounded-xl shadow-lg p-10 border border-gray-200 hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
//                                     >
//                                         {/* Checkbox for selection */}
//                                         <div className="absolute top-3 right-3">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedLeads.includes(item.ilead_id)}
//                                             onChange={() => toggleLeadSelection(item.ilead_id)}
//                                             onClick={(e) => e.stopPropagation()}
//                                             className="h-3 w-3 mt-[-2px] text-blue-600 rounded"
//                                         />
//                                         </div>

                                        
//                                         {(item.website_lead === true || item.website_lead === 'true') && (
//                                             <div className="absolute top-3 left-10 text-blue-600" title="Website Lead">
//                                                 <FaGlobe size={18} />
//                                             </div>
//                                         )}
//                                         <div onClick={() => goToDetail(item.ilead_id)}>
//                                             <div className="flex w-full justify-between items-center space-x-10">
//                                                 <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
//                                                     {item.clead_name || '-'}
//                                                 </h3>
//                                                 <h3 className="font-semibold text-sm text-black bg-yellow-200 px-3 py-1 rounded-full truncate">
//                                                     {item.lead_potential?.clead_name || item.lead_potential || '-'}
//                                                 </h3>
//                                             </div>
//                                             <p className="text-gray-600 text-sm mb-2 truncate">
//                                                 {item.corganization || item.c_organization || '-'}
//                                             </p>
//                                             <div className="text-gray-500 text-xs space-y-1 mb-3">
//                                                 {(item.cemail || item.c_email) && (
//                                                     <p className="flex items-center">
//                                                         <FaEnvelope className="mr-2 text-blue-500" /> {item.cemail || item.c_email}
//                                                     </p>
//                                                 )}
//                                                 {(item.iphone_no || item.c_phone) && (
//                                                     <p className="flex items-center">
//                                                         <FaPhone className="mr-2 text-green-500" /> {item.iphone_no || item.c_phone}
//                                                     </p>
//                                                 )}
//                                                 {selectedFilter === 'assignedToMe' && item.iassigned_by_name && (
//                                                     <p className="flex items-center">
//                                                         <FaGlobe className="mr-2 text-purple-500" /> Assigned by: {item.iassigned_by_name}
//                                                     </p>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
//                                             <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBgColor}`}>
//                                                 {statusText}
//                                             </span>
//                                             <span className="text-gray-500 text-xs">
//                                                 Modified: {formatDate(item.dmodified_dt || item.d_modified_date)}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </>
//             )}

//             {totalPages > 1 && (
//                 <div className="flex justify-center items-center space-x-2 mt-6">
//                     <button
//                     onClick={() =>
//                         setCurrentPage((prev) => Math.max(prev - 1, 1))
//                     }
//                     disabled={currentPage === 1}
//                     className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                     Previous
//                     </button>
//                     <span className="text-gray-700">
//                     Page {currentPage} of {totalPages}
//                     </span>
//                     <button
//                     onClick={() =>
//                         setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                     }
//                     disabled={currentPage === totalPages}
//                     className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                     Next
//                     </button>
//                 </div>
//                 )}

//         </div>
//     );
// };

// export default LeadCardViewPage;
