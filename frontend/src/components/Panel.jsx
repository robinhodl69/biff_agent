import Label from "./Label";

export default function Panel({ label, action, children, className = "" }) {
  const hasHeader = label || action;
  return (
    <div className={`border border-border-dim ${className}`}>
      {hasHeader && (
        <div className="border-b border-border-dim px-4 py-2.5 flex items-center justify-center relative">
          {label && <Label>{label}</Label>}
          {action && <div className="absolute right-4">{action}</div>}
        </div>
      )}
      <div className="p-6 flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
