import { useState } from "react";

export default function TaskForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    try {
      await onCreate({ title: trimmed, description: description || null });
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Add task</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ width: "100%", padding: 6, marginBottom: 6 }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        style={{ width: "100%", padding: 6, marginBottom: 6 }}
      />
      {error && <p style={{ color: "crimson", margin: "4px 0" }}>{error}</p>}
      <button type="submit" disabled={busy} style={{ padding: "6px 12px" }}>
        {busy ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
