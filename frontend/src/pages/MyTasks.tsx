import { memo, useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import {
  AddIcon,
  CalenderIcon,
  LoadingIcon,
  PencilIcon,
  TrashBinIcon,
} from "../icons";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import DatePicker from "../components/form/date-picker";
import { tasksApi, usersApi, type TaskItem } from "../services/api";

type TabKey = "todo" | "completed";

const tabs: { key: TabKey; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "completed", label: "Completed" },
];

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${parseInt(day)}/${parseInt(month)}/${year}`;
}

interface TaskRowProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskRow = memo(function TaskRow({ task, onEdit, onToggle, onDelete }: TaskRowProps) {
  const completed = task.status === "completed";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
      <label className="flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(task)}
          className="peer sr-only"
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
            completed
              ? "border-brand-500 bg-brand-500"
              : "border-gray-300 bg-transparent dark:border-gray-600"
          }`}
        >
          {completed && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 6.5L4.75 8.75L9.5 4"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </label>

      <p
        className={`flex-1 min-w-[180px] text-sm ${
          completed
            ? "text-gray-400 line-through dark:text-gray-500"
            : "text-gray-800 dark:text-white/90"
        }`}
      >
        {task.name}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-4">
        <Badge
          size="sm"
          color={
            task.priority === "high"
              ? "error"
              : task.priority === "medium"
                ? "warning"
                : "info"
          }
        >
          {task.priority}
        </Badge>

        {task.due_date && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CalenderIcon className="h-4 w-4" />
            {formatDate(task.due_date)}
          </span>
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="text-gray-400 transition-colors hover:text-brand-500"
          title="Edit task"
        >
          <PencilIcon className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          className="text-gray-400 transition-colors hover:text-error-500"
          title="Delete task"
        >
          <TrashBinIcon className="size-5" />
        </button>
      </div>
    </div>
  );
});

interface TaskSectionProps {
  title: string;
  count: number;
  countColor: "warning" | "info" | "success" | "light";
  tasks: TaskItem[];
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskSection = memo(function TaskSection({
  title,
  count,
  countColor,
  tasks,
  onEdit,
  onToggle,
  onDelete,
}: TaskSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <Badge size="sm" color={countColor}>
          {count}
        </Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
});

export default function MyTasks() {
  const [loading, setLoading] = useState(true);
  const [personalProjectId, setPersonalProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("todo");
  const { isOpen, openModal, closeModal } = useModal();

  // Create task state
  const [taskName, setTaskName] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("low");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high">("low");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [editTaskSaving, setEditTaskSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const projectResult = await usersApi.getPersonalProject();
      if (!projectResult.data) {
        setLoading(false);
        return;
      }
      const pid = projectResult.data.id;
      setPersonalProjectId(pid);
      const tasksResult = await tasksApi.list(pid);
      if (tasksResult.data) setTasks(tasksResult.data);
      setLoading(false);
    }
    load();
  }, []);

  const handleModalClose = () => {
    setTaskName("");
    setTaskPriority("low");
    setTaskDueDate("");
    setTaskError(null);
    closeModal();
  };

  const handleCreateTask = async () => {
    setTaskError(null);
    if (!taskName.trim()) {
      setTaskError("Task name is required.");
      return;
    }
    if (!personalProjectId) return;
    setSaving(true);
    const result = await tasksApi.create({
      name: taskName.trim(),
      priority: taskPriority,
      project_id: personalProjectId,
      ...(taskDueDate ? { due_date: taskDueDate } : {}),
    });
    if (result.error) {
      setTaskError(result.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    handleModalClose();
    if (result.data) setTasks((prev) => [result.data!, ...prev]);
  };

  const openEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditTaskError(null);
  }, []);

  const closeEditTask = () => {
    setEditingTask(null);
    setEditTaskError(null);
  };

  const handleEditTaskSave = async () => {
    if (!editingTask || !personalProjectId) return;
    if (!editTaskName.trim()) {
      setEditTaskError("Task name is required.");
      return;
    }
    setEditTaskSaving(true);
    setEditTaskError(null);
    const result = await tasksApi.update(editingTask.id, {
      name: editTaskName.trim(),
      priority: editTaskPriority,
      due_date: editTaskDueDate || null,
    });
    if (result.error) {
      setEditTaskError(result.error);
      setEditTaskSaving(false);
      return;
    }
    setEditTaskSaving(false);
    closeEditTask();
    if (result.data) setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? result.data! : t)));
  };

  const toggleTask = useCallback(async (task: TaskItem) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    await tasksApi.update(task.id, { status: newStatus });
  }, []);

  const handleDeleteTask = useCallback(async (task: TaskItem) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await tasksApi.delete(task.id);
  }, []);

  const counts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === activeTab)
        .sort((a, b) => {
          const aDate = a.due_date ? a.due_date.split("T")[0] : null;
          const bDate = b.due_date ? b.due_date.split("T")[0] : null;
          if (aDate !== bDate) {
            if (!aDate) return 1;
            if (!bDate) return -1;
            return aDate < bDate ? -1 : 1;
          }
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        }),
    [tasks, activeTab],
  );

  return (
    <>
      <PageMeta
        title="My Tasks | Tally"
        description="My tasks page"
      />
      <PageBreadcrumb pageTitle="My Tasks" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-gray-900 shadow-theme-xs ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                        isActive
                          ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                          : "bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {counts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              size="sm"
              variant="primary"
              endIcon={<AddIcon className="size-5" />}
              onClick={openModal}
            >
              Add New Task
            </Button>
          </div>

          <div className="mt-6 space-y-8">
            <TaskSection
              title="To Do"
              count={counts.todo}
              countColor="light"
              tasks={visibleTasks.filter((t) => t.status === "todo")}
              onEdit={openEditTask}
              onToggle={toggleTask}
              onDelete={handleDeleteTask}
            />
            <TaskSection
              title="Completed"
              count={counts.completed}
              countColor="success"
              tasks={visibleTasks.filter((t) => t.status === "completed")}
              onEdit={openEditTask}
              onToggle={toggleTask}
              onDelete={handleDeleteTask}
            />
            {visibleTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No tasks in this category yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <Modal
        isOpen={editingTask !== null}
        onClose={closeEditTask}
        className="max-w-[584px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit Task
          </h4>
          <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Enter task name"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                />
              </div>
              <div>
                <Label>Select Priority</Label>
                <Select
                  key={editingTask?.id}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                  defaultValue={editTaskPriority}
                  placeholder="Select an option"
                  onChange={(value) =>
                    setEditTaskPriority(value as "low" | "medium" | "high")
                  }
                  className="dark:bg-dark-900"
                />
              </div>
              <div>
                <DatePicker
                  key={editingTask?.id}
                  id="edit-date-picker"
                  label="Due date"
                  placeholder="Select a date"
                  defaultDate={editTaskDueDate || undefined}
                  onChange={(_dates, dateStr) => setEditTaskDueDate(dateStr)}
                />
              </div>
            </div>
            {editTaskError && (
              <p className="mt-3 text-sm text-red-500">{editTaskError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeEditTask}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditTaskSave} disabled={editTaskSaving}>
                {editTaskSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        className="max-w-[584px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            New Task
          </h4>
          <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Enter task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
              <div>
                <Label>Select Priority</Label>
                <Select
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                  placeholder="Select an option"
                  onChange={(value) =>
                    setTaskPriority(value as "low" | "medium" | "high")
                  }
                  className="dark:bg-dark-900"
                />
              </div>
              <div>
                <DatePicker
                  id="date-picker"
                  label="Due date"
                  placeholder="Select a date"
                  minDate="today"
                  onChange={(_dates, dateStr) => setTaskDueDate(dateStr)}
                />
              </div>
            </div>
            {taskError && (
              <p className="mt-3 text-sm text-red-500">{taskError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateTask} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
