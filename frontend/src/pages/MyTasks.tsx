import { useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import { CalenderIcon, ChatIcon, HorizontaLDots, PlusIcon } from "../icons";

type TaskStatus = "todo" | "in-progress" | "completed";

interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  completed: boolean;
  tag?: string;
  tagColor?: "primary" | "info" | "success" | "warning" | "error";
  dueDate: string;
  comments: number;
  assignee: string;
}

const initialTasks: TaskItem[] = [
  {
    id: "t1",
    title: "Finish user onboarding",
    status: "todo",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Tomorrow",
    comments: 1,
    assignee: "/images/user/user-01.jpg",
  },
  {
    id: "t2",
    title: "Solve the Dribble prioritization issue with the team",
    status: "todo",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Tomorrow",
    comments: 2,
    assignee: "/images/user/user-02.jpg",
  },
  {
    id: "t3",
    title: "Finish user onboarding",
    status: "todo",
    completed: true,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Feb 12, 2024",
    comments: 1,
    assignee: "/images/user/user-03.jpg",
  },
  {
    id: "t4",
    title: "Work in Progress (WIP) Dashboard",
    status: "in-progress",
    completed: false,
    tag: "Template",
    tagColor: "info",
    dueDate: "Jan 8, 2027",
    comments: 2,
    assignee: "/images/user/user-04.jpg",
  },
  {
    id: "t5",
    title: "Product Update - Q4 2024",
    status: "in-progress",
    completed: false,
    dueDate: "Jan 8, 2027",
    comments: 2,
    assignee: "/images/user/user-05.jpg",
  },
  {
    id: "t6",
    title: "Kanban Flow Manager",
    status: "in-progress",
    completed: true,
    dueDate: "Jan 8, 2027",
    comments: 2,
    assignee: "/images/user/user-06.jpg",
  },
  {
    id: "t7",
    title: "Make internal feedback",
    status: "in-progress",
    completed: false,
    dueDate: "Jan 8, 2027",
    comments: 2,
    assignee: "/images/user/user-07.jpg",
  },
  {
    id: "t8",
    title: "Do some projects on React Native with Flutter",
    status: "completed",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Feb 12, 2027",
    comments: 1,
    assignee: "/images/user/user-08.jpg",
  },
  {
    id: "t9",
    title: "Design marketing assets",
    status: "completed",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Feb 12, 2027",
    comments: 1,
    assignee: "/images/user/user-09.jpg",
  },
  {
    id: "t10",
    title: "Kanban Flow Manager",
    status: "completed",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Feb 12, 2027",
    comments: 1,
    assignee: "/images/user/user-10.jpg",
  },
  {
    id: "t11",
    title: "Change license and remove products",
    status: "completed",
    completed: false,
    tag: "Marketing",
    tagColor: "primary",
    dueDate: "Feb 12, 2027",
    comments: 1,
    assignee: "/images/user/user-11.jpg",
  },
];

type TabKey = "all" | "todo" | "in-progress" | "completed";

const tabs: { key: TabKey; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "completed", label: "Completed" },
];

const DragHandleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-400"
  >
    <path
      d="M3 5h10M3 8h10M3 11h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const FilterIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface TaskRowProps {
  task: TaskItem;
  onToggle: (id: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onToggle }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Drag task"
      >
        <DragHandleIcon />
      </button>

      <label className="flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="peer sr-only"
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
            task.completed
              ? "border-brand-500 bg-brand-500"
              : "border-gray-300 bg-transparent dark:border-gray-600"
          }`}
        >
          {task.completed && (
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
          task.completed
            ? "text-gray-400 line-through dark:text-gray-500"
            : "text-gray-800 dark:text-white/90"
        }`}
      >
        {task.title}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-4">
        {task.tag && (
          <Badge size="sm" color={task.tagColor ?? "primary"}>
            {task.tag}
          </Badge>
        )}

        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalenderIcon className="h-4 w-4" />
          {task.dueDate}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <ChatIcon className="h-4 w-4" />
          {task.comments}
        </span>

        <div className="h-7 w-7 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-900">
          <img
            src={task.assignee}
            alt="Assignee"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  count: number;
  countColor: "warning" | "info" | "success" | "light";
  tasks: TaskItem[];
  onToggle: (id: string) => void;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <Badge size="sm" color={countColor}>
            {count}
          </Badge>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Section options"
        >
          <HorizontaLDots className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
};

export default function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    if (activeTab === "all") return tasks;
    return tasks.filter((t) => t.status === activeTab);
  }, [tasks, activeTab]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const todoTasks = visibleTasks.filter((t) => t.status === "todo");
  const inProgressTasks = visibleTasks.filter(
    (t) => t.status === "in-progress",
  );
  const completedTasks = visibleTasks.filter((t) => t.status === "completed");

  return (
    <>
      <PageMeta
        title="React.js Task List | TailAdmin - React.js Admin Dashboard Template"
        description="Task list page built on TailAdmin for the Tally task management app"
      />
      <PageBreadcrumb pageTitle="Task List" />

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

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              <FilterIcon />
              Filter & Short
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Add New Task
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-8">
          <TaskSection
            title="To Do"
            count={counts.todo}
            countColor="light"
            tasks={todoTasks}
            onToggle={toggleTask}
          />
          <TaskSection
            title="In-Progress"
            count={counts["in-progress"]}
            countColor="warning"
            tasks={inProgressTasks}
            onToggle={toggleTask}
          />
          <TaskSection
            title="Completed"
            count={counts.completed}
            countColor="success"
            tasks={completedTasks}
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
