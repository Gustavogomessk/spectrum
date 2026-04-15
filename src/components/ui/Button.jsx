export default function Button({ children, tipo = "primario", ...props }) {
  return (
    <button className={`btn btn-${tipo}`} {...props}>
      {children}
    </button>
  )
}