export default function StatusBadge({ isRunning, isPaused }) {
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium border border-warning/20">
        <span className="relative w-1.5 h-1.5 bg-warning rounded-full">
          <span className="absolute inset-0 bg-warning rounded-full animate-ping" />
        </span>
        Paused
      </span>
    );
  }
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-medium border border-success/20">
        <span className="relative w-1.5 h-1.5 bg-success rounded-full">
          <span className="absolute inset-0 bg-success rounded-full animate-ping" />
        </span>
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error/10 text-error rounded-full text-xs font-medium border border-error/20">
      <span className="w-1.5 h-1.5 bg-error rounded-full" />
      Error
    </span>
  );
}
