// src/api/constants.js

// Load the base API URL from the .env file
export const BASE_URL = import.meta.env.VITE_API_URL;

//console.log("Base URL:", BASE_URL);

// Define all API endpoints relative to BASE_URL
export const ENDPOINTS = {  
  BASE_URL_IS: BASE_URL,
  LOGIN: `${BASE_URL}/login`,
  PLAN_TYPE: `${BASE_URL}/pricing-plans`,
  RESELLER: `${BASE_URL}/reseller`,
  LEAD_STATUS: `${BASE_URL}/lead-status`,
  LEAD_STATUS_ACTION : `${BASE_URL}/lead-status/action-logs`,
  LEAD: `${BASE_URL}/lead`,
  USERS: `${BASE_URL}/users`,
  FOLLOW_UP: `${BASE_URL}/calender-event`,
  DASHBOARD_USER: `${BASE_URL}/lead/dashboard`,
  CREATE_EVENT: `${BASE_URL}/calender-event`,
  DASHBOARD_MANAGER: `${BASE_URL}/lead/manager`,
  REMINDERS: `${BASE_URL}/reminder/get-reminder`,
  LEAD_STATUS_UPDATE: `${BASE_URL}/lead`,
  CONVERT_TO_DEAL: `${BASE_URL}/lead/convert-to-deal`,
  USER_REMINDER:`${BASE_URL}/reminder/user-reminder`,
  USER_CREATION: `${BASE_URL}/users`,
  GET_USERS: `${BASE_URL}/users`,
  CONVERT_TO_LOST: `${BASE_URL}/lead`,
  EXPORT_LEADS: `${BASE_URL}/lead/download`,
  LOST_LEADS: `${BASE_URL}/reports/lost-leads`,
  STAGE_LEADS: `${BASE_URL}/reports/sales-stage-leads`,
  COMPANY_GET: `${BASE_URL}/lead/company-dashboard/`,
  USER_GET: `${BASE_URL}/users`,
  NOTIFICATIONS: `${BASE_URL}/notifications`,
  TERRITORY_LEADS: `${BASE_URL}/reports/territory-leads`,
  FEEDBACK: `${BASE_URL}/reports/feedback`,
  FORGOT_PASSWORD: `${BASE_URL}/forgot-password`,
  UPDATE_PASSWORD: `${BASE_URL}/update-password`,
  GET_DEALS: `${BASE_URL}/lead/deals`,
  DEMO_MAIL: `${BASE_URL}/sentmail`,
  TEAM_KPI: `${BASE_URL}/lead/manager`,
  GET_SETTINGS: `${BASE_URL}/general-setting/info`,
  GET_PARAMS_TARGET: `${BASE_URL}/user-target/get-user-target`,
  GET_ASSIGN: `${BASE_URL}/assigned-to`,
  GET_METRICS_TARGET: `${BASE_URL}/user-target`,
  GET_USER_HISTORY: `${BASE_URL}/user-target/user-activity-history`,
  UPDATE_PASSWORD: `${BASE_URL}/update-password`,
  LEAD_CONVERSION: `${BASE_URL}/reports/get-conversion-time`,
  ACTIVITY_HISTORY: `${BASE_URL}/user-target/user-activity-data`,
  GENERAL_SETTINGS_UPDATE: `${BASE_URL}/general-setting/edit`,
  USER_ACHIEVEMENTS: `${BASE_URL}/user-target/user-achievements`,
  USER_POST: `${BASE_URL}/user-target`,
  PROSPECTS_LOST_LEADS:`${BASE_URL}/reports/prospects-lost-leads/`,
  //sales pipline analysis api 
   SALES_PIPLINE_ANALYSIS:`${BASE_URL}/reports/sales-pipline-report/`,
   //first response for the lead
   FIRST_RESPONSE_FOR_LEAD:`${BASE_URL}/reports/first-response-time/`,
   //company leads 
      COMPANY_LEADS:`${BASE_URL}/reports/company-all-leads/`,
   //lead owner first response 
   LEAD_OWNER_FIRST_RES:`${BASE_URL}/reports/lead-owner-efficiency/`,
   MANAGER_REMINDER: `${BASE_URL}/lead/manager`,












  // Add more endpoints here as needed
};


// ../api/constraints.js
// export const ENDPOINTS = {
//   LOGIN: 'https://your-api-url.com/api/login',
// };
