import Label from "./Label";

export default function Divider({ label, className = "" }) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-border-dim" />
        <Label>{label}</Label>
        <div className="flex-1 h-px bg-border-dim" />
      </div>
    );
  }
  return <div className={`h-px bg-border-dim ${className}`} />;
}
