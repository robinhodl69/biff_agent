const styles = {
  green:  { text: "text-primary",    dot: "bg-primary" },
  yellow: { text: "text-warning",    dot: "bg-warning" },
  red:    { text: "text-error",      dot: "bg-error" },
  muted:  { text: "text-text-muted", dot: "bg-text-muted" },
};

export default function Tag({ children, color = "muted", pulse = false }) {
  const { text, dot } = styles[color] ?? styles.muted;
  return (
    <span className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-widest ${text}`}>
      <span className={`w-1.5 h-1.5 shrink-0 ${dot} ${pulse ? "animate-cursor" : ""}`} />
      {children}
    </span>
  );
}
