import React from "react"
import ReactDOM from "react-dom/client"
import { SpectrumProvider } from "./src/context/SpectrumContext"
import App from "./src/pages/App"
import "./src/styles/global.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SpectrumProvider>
      <App />
    </SpectrumProvider>
  </React.StrictMode>,
)
