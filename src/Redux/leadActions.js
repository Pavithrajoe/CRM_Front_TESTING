import { ENDPOINTS } from '../api/constraints';
import { jwtDecode } from 'jwt-decode';

export const fetchLeads = () => async (dispatch) => {
    dispatch({ type: 'FETCH_LEADS_REQUEST' });
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;
        if (!userId) throw new Error('User ID not found in token');

        // Use large limit to get all leads
        const res = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=10000`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) throw new Error('Failed to fetch leads');
        const data = await res.json();

        const leads = Array.isArray(data.details) ? data.details : [];
        const sortedLeads = leads.sort(
            (a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0)
        );

        console.log("sortedLeads",data)


        dispatch({
            type: 'FETCH_LEADS_SUCCESS',
            payload: {
                leads: sortedLeads,
                totalCount: sortedLeads.length,
            },
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        dispatch({ type: 'FETCH_LEADS_FAIL', payload: error.message });
    }
};


// If your API requires pagination but you want all data, use a large limit
export const fetchLeadsWithLargeLimit = () => async (dispatch) => {
    dispatch({ type: 'FETCH_LEADS_REQUEST' });
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;

        if (!userId) {
            throw new Error('User ID not found in token');
        }

        // Use a very large limit to get all leads in one request
        const res = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=10000`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!res.ok) throw new Error('Failed to fetch leads');
        
        const data = await res.json();
        
        // Get leads from data.details
        const leads = Array.isArray(data.details) ? data.details : [];
        
        // Sort by modified date
        const sortedLeads = leads.sort(
            (a, b) => new Date(b.dmodified_dt || 0) - new Date(a.dmodified_dt || 0)
        );

        // console.log('All leads fetched with large limit:', sortedLeads.length);

        dispatch({ 
            type: 'FETCH_LEADS_SUCCESS', 
            payload: { 
                leads: sortedLeads,
                totalCount: sortedLeads.length
            }
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        dispatch({ type: 'FETCH_LEADS_FAIL', payload: error.message });
    }
};

export const setCurrentPage = (page) => ({
    type: 'SET_CURRENT_PAGE',
    payload: page
});

export const setLeadsPerPage = (leadsPerPage) => ({
    type: 'SET_LEADS_PER_PAGE',
    payload: leadsPerPage
});