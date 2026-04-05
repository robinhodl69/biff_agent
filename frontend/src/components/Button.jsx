export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = "",
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-widest transition-colors duration-150 cursor-pointer btn-glow";

  const variants = {
    primary: "text-primary border border-primary/40 hover:border-primary",
    secondary: "text-text-muted border border-border-dim hover:text-primary hover:border-primary/30",
    ghost: "text-text-muted hover:text-primary",
    danger: "text-error border border-error/40 hover:border-error hover:bg-error/5",
    minimal: "text-primary hover:text-primary/70",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm",
    none: "p-0 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />}
      <span>[ {children} ]</span>
    </button>
  );
}
