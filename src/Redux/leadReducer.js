const initialState = {
  allLeads: [],
  loading: false,
  error: null,
  totalCount: 0,  // Optional, from API if available
  // Remove currentPage and totalPages
};

export const leadReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'FETCH_LEADS_REQUEST':
      return { ...state, loading: true, error: null };

    case 'FETCH_LEADS_SUCCESS':
      return {
        ...state,
        loading: false,
        allLeads: action.payload.leads,
        totalCount: action.payload.totalCount || action.payload.leads.length,
      };

    case 'FETCH_LEADS_FAIL':
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};
