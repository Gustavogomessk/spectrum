export default function AppIcon({ icon: Icon, label, size = 18, className, ...props }) {
  if (!Icon) return null
  return <Icon aria-hidden={label ? undefined : true} aria-label={label} size={size} className={className} {...props} />
}

