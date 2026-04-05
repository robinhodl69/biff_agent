export function StatCard({ label, value, icon, trend, className = "" }) {
  return (
    <div className={`border-l border-primary/40 pl-4 py-1 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-[10px] uppercase tracking-widest">
          {label}
        </span>
        {icon && <span className="text-text-muted opacity-50">{icon}</span>}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-primary text-xl font-medium tabular-nums">
          {value}
        </span>
        {trend && (
          <span className={`text-[10px] mb-0.5 ${trend > 0 ? "text-primary" : "text-error"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
