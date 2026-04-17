import { useSpectrum } from "../context/SpectrumContext"
import AppShell from "./AppShell"
import LoginPage from "./LoginPage"

export default function App() {
  const { usuario } = useSpectrum()
  return usuario ? <AppShell /> : <LoginPage />
}
