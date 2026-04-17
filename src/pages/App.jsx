import { useSpectrum } from "../context/SpectrumContext"
import AppShell from "./AppShell"
import LoginPage from "./LoginPage"
import ToastContainer from "../components/ui/ToastContainer"

export default function App() {
  const { usuario, toasts } = useSpectrum()
  return (
    <>
      {usuario ? <AppShell /> : <LoginPage />}
      <ToastContainer toasts={toasts} />
    </>
  )
}
