export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {toasts.map((t) => {
        const icones = { sucesso: "✅", erro: "❌", info: "💡" }
        return (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span aria-hidden="true">{icones[t.tipo] || "💡"}</span>
            <span>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
