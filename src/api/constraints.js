// src/api/constants.js

// Load the base API URL from the .env file
export const BASE_URL = import.meta.env.VITE_API_URL;

console.log("Base URL:", BASE_URL);

// Define all API endpoints relative to BASE_URL
export const ENDPOINTS = {
  LOGIN: `${BASE_URL}/login`,
  PLAN_TYPE: `${BASE_URL}/pricing-plans`,
  RESELLER: `${BASE_URL}/reseller`,
  LEAD_STATUS: `${BASE_URL}/lead-status`,
  LEAD: `${BASE_URL}/lead`,
  USERS: `${BASE_URL}/users`,
  FOLLOW_UP: `${BASE_URL}/follow-ups`,
  // Add more endpoints here as needed
};


// ../api/constraints.js
// export const ENDPOINTS = {
//   LOGIN: 'https://your-api-url.com/api/login',
// };
