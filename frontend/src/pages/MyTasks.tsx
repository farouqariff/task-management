import { useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import {
  AddIcon,
  CalenderIcon,
  PencilIcon,
  TrashBinIcon,
} from "../icons";
import Button from "../components/ui/button/Button";

type TabKey = "todo" | "completed";

const tabs: { key: TabKey; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "completed", label: "Completed" },
];

interface MockAssignee {
  user_id: number;
  user_email: string;
}

interface MockTask {
  id: string;
  name: string;
  status: TabKey;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assignees: MockAssignee[];
}

const initialTasks: MockTask[] = [
  {
    id: "t1",
    name: "Finish user onboarding flow",
    status: "todo",
    priority: "high",
    due_date: "2026-04-25T00:00:00",
    assignees: [
      { user_id: 1, user_email: "alice@example.com" },
      { user_id: 2, user_email: "bob@example.com" },
    ],
  },
  {
    id: "t2",
    name: "Fix navigation bug on mobile",
    status: "todo",
    priority: "medium",
    due_date: "2026-04-28T00:00:00",
    assignees: [{ user_id: 3, user_email: "carol@example.com" }],
  },
  {
    id: "t3",
    name: "Write unit tests for auth module",
    status: "todo",
    priority: "low",
    due_date: "2026-05-02T00:00:00",
    assignees: [],
  },
  {
    id: "t4",
    name: "Update API documentation",
    status: "todo",
    priority: "medium",
    due_date: null,
    assignees: [{ user_id: 1, user_email: "alice@example.com" }],
  },
  {
    id: "t5",
    name: "Design marketing assets for Q2",
    status: "completed",
    priority: "high",
    due_date: "2026-04-10T00:00:00",
    assignees: [
      { user_id: 2, user_email: "bob@example.com" },
      { user_id: 4, user_email: "dave@example.com" },
    ],
  },
  {
    id: "t6",
    name: "Set up CI/CD pipeline",
    status: "completed",
    priority: "high",
    due_date: "2026-04-08T00:00:00",
    assignees: [{ user_id: 3, user_email: "carol@example.com" }],
  },
  {
    id: "t7",
    name: "Migrate database to new schema",
    status: "completed",
    priority: "medium",
    due_date: "2026-04-05T00:00:00",
    assignees: [],
  },
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${parseInt(day)}/${parseInt(month)}/${year}`;
}

interface TaskRowProps {
  task: MockTask;
  onToggle: (task: MockTask) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onToggle }) => {
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

        <div className="flex -space-x-2">
          {task.assignees.map((a) => (
            <div
              key={a.user_id}
              title={a.user_email}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700 ring-2 ring-white dark:bg-brand-500/20 dark:text-brand-400 dark:ring-gray-900"
            >
              {a.user_email[0].toUpperCase()}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="text-gray-400 transition-colors hover:text-brand-500"
          title="Edit task"
        >
          <PencilIcon className="size-5" />
        </button>

        <button
          type="button"
          className="text-gray-400 transition-colors hover:text-error-500"
          title="Delete task"
        >
          <TrashBinIcon className="size-5" />
        </button>
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  count: number;
  countColor: "warning" | "info" | "success" | "light";
  tasks: MockTask[];
  onToggle: (task: MockTask) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  count,
  countColor,
  tasks,
  onToggle,
}) => {
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
          <TaskRow key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
};

export default function MyTasks() {
  const [tasks, setTasks] = useState<MockTask[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TabKey>("todo");

  const counts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.status === activeTab),
    [tasks, activeTab],
  );

  const toggleTask = (task: MockTask) => {
    const newStatus: TabKey = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
  };

  return (
    <>
      <PageMeta
        title="My Tasks | Tally Task Management"
        description="My tasks page"
      />
      <PageBreadcrumb pageTitle="My Tasks" />

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
          >
            Add New Task
          </Button>
        </div>

        <div className="mt-6 space-y-8">
          <TaskSection
            title={activeTab === "todo" ? "To Do" : "Completed"}
            count={counts[activeTab]}
            countColor={activeTab === "todo" ? "light" : "success"}
            tasks={visibleTasks}
            onToggle={toggleTask}
          />
          {visibleTasks.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No tasks in this category yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
