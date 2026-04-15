import { useNeuroInclude } from "../context/NeuroIncludeContext"
import AppShell from "./AppShell"
import LoginPage from "./LoginPage"

export default function App() {
  const { usuario } = useNeuroInclude()
  return usuario ? <AppShell /> : <LoginPage />
}
