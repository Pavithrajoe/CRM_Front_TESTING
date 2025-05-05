// src/api/constants.js

// Load the base API URL from the .env file
export const BASE_URL = import.meta.env.VITE_API_URL;

// Define all API endpoints relative to BASE_URL
export const ENDPOINTS = {
  LOGIN: `${BASE_URL}/login`,
  //REGISTER: `${BASE_URL}/register`,
  //GET_USER: `${BASE_URL}/user`,
  //UPDATE_PROFILE: `${BASE_URL}/user/update`,
  //LOGOUT: `${BASE_URL}/logout`,
  // Add more endpoints here as needed
};
