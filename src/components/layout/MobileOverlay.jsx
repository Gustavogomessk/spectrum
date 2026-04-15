export default function MobileOverlay({ visivel, onFechar }) {
  return (
    <div
      className={`overlay-mobile ${visivel ? "visivel" : ""}`}
      onClick={onFechar}
      onKeyDown={() => {}}
      role="presentation"
    />
  )
}
