import { AlertCircle } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center mb-4">
        <AlertCircle size={20} className="text-text-muted" />
      </div>
      <h3 className="text-text-secondary font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-text-muted text-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
