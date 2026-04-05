export default function Label({ children, as: Tag = "span", className = "" }) {
  return (
    <Tag className={`text-[10px] uppercase tracking-widest text-text-muted ${className}`}>
      {children}
    </Tag>
  );
}
