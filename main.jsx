import React from "react"
import ReactDOM from "react-dom/client"
import { NeuroIncludeProvider } from "./src/context/NeuroIncludeContext"
import App from "./src/pages/App"
import "./src/styles/global.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NeuroIncludeProvider>
      <App />
    </NeuroIncludeProvider>
  </React.StrictMode>,
)
