import TaskItem from "./TaskItem.jsx";

export default function TaskList({ tasks, isAdmin, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    return <p style={{ color: "#777", fontStyle: "italic" }}>No tasks yet.</p>;
  }

  return (
    <ul style={{ padding: 0, margin: 0 }}>
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          isAdmin={isAdmin}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
