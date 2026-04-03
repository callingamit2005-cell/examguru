import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// NOTE: StrictMode removed — it double-invokes useEffects causing duplicate API calls
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
