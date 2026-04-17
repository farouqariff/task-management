import { useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import {
  CalenderIcon,
  ChatIcon,
  ListIcon,
  MoreDotIcon,
  PlusIcon,
} from "../icons";

type TaskStatus = "todo" | "in-progress" | "completed";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  tag?: { label: string; color: "blue" | "orange" };
  date: string;
  comments: number;
  avatar: string;
  done: boolean;
};

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Finish user onboarding",
    status: "todo",
    tag: { label: "Marketing", color: "blue" },
    date: "Tomorrow",
    comments: 1,
    avatar: "/images/user/user-01.jpg",
    done: false,
  },
  {
    id: "2",
    title: "Solve the Dribble prioritization issue with the team",
    status: "todo",
    tag: { label: "Marketing", color: "blue" },
    date: "Tomorrow",
    comments: 2,
    avatar: "/images/user/user-02.jpg",
    done: false,
  },
  {
    id: "3",
    title: "Finish user onboarding",
    status: "todo",
    tag: { label: "Marketing", color: "blue" },
    date: "Feb 12, 2024",
    comments: 1,
    avatar: "/images/user/user-03.jpg",
    done: true,
  },
  {
    id: "4",
    title: "Work in Progress (WIP) Dashboard",
    status: "in-progress",
    tag: { label: "Template", color: "orange" },
    date: "Jan 8, 2027",
    comments: 2,
    avatar: "/images/user/user-04.jpg",
    done: false,
  },
  {
    id: "5",
    title: "Product Update - Q4 2024",
    status: "in-progress",
    date: "Jan 8, 2027",
    comments: 2,
    avatar: "/images/user/user-05.jpg",
    done: false,
  },
  {
    id: "6",
    title: "Kanban Flow Manager",
    status: "in-progress",
    date: "Jan 8, 2027",
    comments: 2,
    avatar: "/images/user/user-06.jpg",
    done: true,
  },
  {
    id: "7",
    title: "Make internal feedback",
    status: "in-progress",
    date: "Jan 8, 2027",
    comments: 2,
    avatar: "/images/user/user-07.jpg",
    done: false,
  },
  {
    id: "8",
    title: "Do some projects on React Native with Flutter",
    status: "completed",
    tag: { label: "Marketing", color: "blue" },
    date: "Feb 12, 2027",
    comments: 1,
    avatar: "/images/user/user-08.jpg",
    done: false,
  },
  {
    id: "9",
    title: "Design marketing assets",
    status: "completed",
    tag: { label: "Marketing", color: "blue" },
    date: "Feb 12, 2027",
    comments: 1,
    avatar: "/images/user/user-09.jpg",
    done: false,
  },
  {
    id: "10",
    title: "Kanban Flow Manager",
    status: "completed",
    tag: { label: "Marketing", color: "blue" },
    date: "Feb 12, 2027",
    comments: 1,
    avatar: "/images/user/user-10.jpg",
    done: false,
  },
  {
    id: "11",
    title: "Change license and remove products",
    status: "completed",
    tag: { label: "Marketing", color: "blue" },
    date: "Feb 12, 2027",
    comments: 1,
    avatar: "/images/user/user-11.jpg",
    done: false,
  },
];

type TabKey = "all" | "todo" | "in-progress" | "completed";

const tabConfig: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Tasks" },
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const tagClasses: Record<"blue" | "orange", string> = {
  blue: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  orange:
    "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400",
};

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
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

  const toggleDone = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const visibleStatuses: TaskStatus[] =
    activeTab === "all"
      ? ["todo", "in-progress", "completed"]
      : [activeTab as TaskStatus];

  const sectionMeta: Record<TaskStatus, { title: string; count: number }> = {
    todo: { title: "Todo", count: counts.todo },
    "in-progress": { title: "In-Progress", count: counts["in-progress"] },
    completed: { title: "Completed", count: counts.completed },
  };

  return (
    <div>
      <PageMeta
        title="Task List | Tally"
        description="Task list view for Tally task management"
      />
      <PageBreadcrumb pageTitle="Task List" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:p-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            {tabConfig.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-medium ${
                      isActive
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                        : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4.5h12M4 8h8M6 11.5h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Filter & Short
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">
              Add New Task
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {visibleStatuses.map((status) => {
            const meta = sectionMeta[status];
            const items = tasks.filter((t) => t.status === status);
            return (
              <section key={status}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                      {meta.title}
                    </h3>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gray-100 px-1.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {meta.count}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <MoreDotIcon className="h-5 w-5" />
                  </button>
                </div>

                <ul className="flex flex-col gap-3">
                  {items.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <ListIcon className="h-5 w-5" />
                      </button>
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleDone(task.id)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                            task.done
                              ? "border-brand-500 bg-brand-500"
                              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                          }`}
                        >
                          {task.done && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 3L4.5 8.5L2 6"
                                stroke="white"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                      </label>
                      <span
                        className={`flex-1 text-sm ${
                          task.done
                            ? "text-gray-400 line-through dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.tag && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${tagClasses[task.tag.color]}`}
                        >
                          {task.tag.label}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <CalenderIcon className="h-4 w-4" />
                        {task.date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <ChatIcon className="h-4 w-4" />
                        {task.comments}
                      </span>
                      <img
                        src={task.avatar}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
