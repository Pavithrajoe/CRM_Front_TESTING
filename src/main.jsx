
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import store from "./Redux/store.js";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "./index.css";
import { TabProvider } from "./context/TabContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <TabProvider>
        <Provider store={store}>
      <App />
        </Provider>
      </TabProvider>
    </BrowserRouter>
  /* </React.StrictMode> */
);
