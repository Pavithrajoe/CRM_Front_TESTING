// vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // This is the most common fix for unwanted double/quadruple renders 
      // in development mode when Strict Mode is already disabled.
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src", 
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173, 
  },
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": "/src", 
//     },
//   },

  
//    server: {
//     host: '0.0.0.0',
//     port: 5173, 
//   },
// });


