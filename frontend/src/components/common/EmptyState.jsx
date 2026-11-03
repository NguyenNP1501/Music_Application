export default function EmptyState({ children = "Chưa có dữ liệu." }) {
  return <div className="empty-state">{children}</div>;
}
