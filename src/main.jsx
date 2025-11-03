import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { TabProvider } from "./context/TabContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <TabProvider>
      <App />
    </TabProvider>
  </BrowserRouter>
);
