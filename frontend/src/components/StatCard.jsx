export function StatCard({ label, value, icon, trend, className = "" }) {
  return (
    <div
      className={`bg-bg-surface border border-border-subtle rounded-xl p-4 card-hover ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-brand/60">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-text-primary font-mono text-xl font-semibold tabular">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium ${trend > 0 ? "text-success" : "text-error"}`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}
