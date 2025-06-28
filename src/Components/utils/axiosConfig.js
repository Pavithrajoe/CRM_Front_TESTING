import axios from "axios";
import { BASE_URL } from "../../api/constraints";
axios.defaults.baseURL = `${BASE_URL}`;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // This is the standard header format. Your backend expects 'Authorization' header with 'Bearer ' prefix.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling for 401 (Unauthorized) might mean token expired or invalid
    if (error.response && error.response.status === 401) {
      console.error(
        "Authentication error: Token expired or invalid. Please re-login."
      );
      localStorage.removeItem("token");
      // Redirect to login page if you have one, e.g.:
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; // Crucial: export the configured instance
//       post: 'label-master',