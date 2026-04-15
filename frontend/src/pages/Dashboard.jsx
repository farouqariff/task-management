import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";

export default function Dashboard() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function createTask(payload) {
    const res = await api.post("/tasks", payload);
    setTasks((prev) => [...prev, res.data]);
  }

  async function updateTask(id, patch) {
    const res = await api.put(`/tasks/${id}`, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
  }

  async function deleteTask(id) {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const counts = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { pending: 0, in_progress: 0, completed: 0 }
  );

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        padding: "0 1rem",
        fontFamily: "sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Tasks</h1>
          <small style={{ color: "#777" }}>
            {isAdmin ? "Admin view — showing all users' tasks" : "Your tasks"}
          </small>
        </div>
        <button onClick={handleLogout} style={{ padding: "6px 12px" }}>
          Logout
        </button>
      </header>

      <TaskForm onCreate={createTask} />

      <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Filter:{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 4 }}>
            <option value="all">All ({tasks.length})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="in_progress">In progress ({counts.in_progress})</option>
            <option value="completed">Completed ({counts.completed})</option>
          </select>
        </label>
        <button onClick={loadTasks} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {loading && tasks.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <TaskList
          tasks={filtered}
          isAdmin={isAdmin}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
