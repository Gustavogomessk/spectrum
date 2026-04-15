export default function Input({ label, ...props }) {
  return (
    <div>
      <label className="campo-label">{label}</label>
      <input className="campo" {...props} />
    </div>
  )
}