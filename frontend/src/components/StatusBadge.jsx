import Tag from "./Tag";

export default function StatusBadge({ isRunning, isPaused }) {
  if (isRunning === undefined) return <Tag color="muted">Connecting</Tag>;
  if (isPaused)                return <Tag color="yellow" pulse>Paused</Tag>;
  if (isRunning)               return <Tag color="green" pulse>Active</Tag>;
  return                              <Tag color="red">Offline</Tag>;
}
