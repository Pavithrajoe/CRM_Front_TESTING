import { ENDPOINTS} from '../api/constraints';

// // GET Business Types
// export const fetchBusinessTypes = async () => {
//   const response = await fetch(ENDPOINTS.BUSINESS_TYPES);
//   if (!response.ok) throw new Error('Failed to fetch business types');
//   return response.json();
// };

// GET Plan Types 
export const fetchPlanTypes = async () => {
    const response = await fetch("http://192.168.0.107:3000/api/pricing-plans"); 
    if (!response.ok) throw new Error("Failed to fetch plan types");
    return response.json();
  };
  

// POST Signup
export const submitSignup = async (payload) => {
  const response = await fetch(ENDPOINTS.SIGNUP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Signup failed');
  return data;
};
