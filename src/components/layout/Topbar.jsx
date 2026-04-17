import AppIcon from "../ui/AppIcon"
import { Menu } from "lucide-react"

export default function Topbar({ titulo, onMenu, menuAberto, children }) {
  return (
    <div className="topbar">
      <button
        type="button"
        className="btn-menu"
        id="btn-menu"
        onClick={onMenu}
        aria-label="Abrir menu"
        aria-expanded={menuAberto}
      >
        <AppIcon icon={Menu} size={18} />
      </button>
      <h1 className="topbar-titulo" aria-live="polite">
        {titulo}
      </h1>
      <div className="topbar-acoes">{children}</div>
    </div>
  )
}
