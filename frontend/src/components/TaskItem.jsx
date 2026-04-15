import { useState } from "react";

const STATUSES = ["pending", "in_progress", "completed"];

export default function TaskItem({ task, isAdmin, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }
    setBusy(true);
    try {
      await onUpdate(task.id, { title: trimmed, description });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(newStatus) {
    if (newStatus === task.status) return;
    setBusy(true);
    try {
      await onUpdate(task.id, { status: newStatus });
    } catch (err) {
      setError(err.response?.data?.error || "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setBusy(true);
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
      setBusy(false);
    }
  }

  function cancelEdit() {
    setTitle(task.title);
    setDescription(task.description || "");
    setError("");
    setEditing(false);
  }

  const statusColor = {
    pending: "#888",
    in_progress: "#0a7",
    completed: "#06c",
  }[task.status];

  return (
    <li
      style={{
        border: "1px solid #ddd",
        borderRadius: 4,
        padding: 12,
        marginBottom: 8,
        listStyle: "none",
        background: "#fafafa",
      }}
    >
      {editing ? (
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 6, marginBottom: 6 }}
            placeholder="Title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: 6, marginBottom: 6 }}
            placeholder="Description"
            rows={2}
          />
          <button onClick={save} disabled={busy} style={{ marginRight: 6 }}>
            {busy ? "Saving..." : "Save"}
          </button>
          <button onClick={cancelEdit} disabled={busy}>
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 16 }}>{task.title}</strong>
            <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>
              {task.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          {task.description && (
            <p style={{ margin: "6px 0", color: "#444" }}>{task.description}</p>
          )}
          {isAdmin && task.user_email && (
            <p style={{ margin: "4px 0", fontSize: 12, color: "#777" }}>
              owner: {task.user_email}
            </p>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={task.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={busy}
              style={{ padding: 4 }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <button onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
            <button onClick={remove} disabled={busy} style={{ color: "crimson" }}>
              Delete
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color: "crimson", marginTop: 6 }}>{error}</p>}
    </li>
  );
}
