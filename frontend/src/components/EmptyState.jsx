import Label from "./Label";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <Label>{title}</Label>
      {description && (
        <p className="text-text-muted text-xs max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
