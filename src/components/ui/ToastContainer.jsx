import AppIcon from "./AppIcon"
import { CheckCircle2, Info, XCircle } from "lucide-react"

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {toasts.map((t) => {
        const icones = { sucesso: CheckCircle2, erro: XCircle, info: Info }
        const Icon = icones[t.tipo] || Info
        return (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span aria-hidden="true">
              <AppIcon icon={Icon} size={18} />
            </span>
            <span>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
