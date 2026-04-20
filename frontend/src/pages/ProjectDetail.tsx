import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import { AddIcon, CalenderIcon, HorizontaLDots } from "../icons";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import DatePicker from "../components/form/date-picker";
import {
  tasksApi,
  projectsApi,
  usersApi,
  type TaskItem,
  type ProjectMemberItem,
  type UserItem,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

type TabKey = "todo" | "completed" | "team-members";

const tabs: { key: TabKey; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "completed", label: "Completed" },
  { key: "team-members", label: "Team Members" },
];

interface TaskRowProps {
  task: TaskItem;
  onToggle: (task: TaskItem) => void;
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
            {new Date(task.due_date).toLocaleDateString()}
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
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  count: number;
  countColor: "warning" | "info" | "success" | "light";
  tasks: TaskItem[];
  onToggle: (task: TaskItem) => void;
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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { user: currentUser } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("todo");
  const { isOpen, openModal, closeModal } = useModal();
  const {
    isOpen: isMemberOpen,
    openModal: openMemberModal,
    closeModal: closeMemberModal,
  } = useModal();

  const [newMemberSearch, setNewMemberSearch] = useState("");
  const [newMemberId, setNewMemberId] = useState<number | null>(null);
  const [newMemberResults, setNewMemberResults] = useState<UserItem[]>([]);
  const [showNewMemberDropdown, setShowNewMemberDropdown] = useState(false);
  const [newMemberError, setNewMemberError] = useState<string | null>(null);
  const [newMemberSaving, setNewMemberSaving] = useState(false);
  const newMemberDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const canManage =
    currentUser?.is_admin ||
    members.some((m) => m.user_id === currentUser?.id && m.role === "leader");

  const [taskName, setTaskName] = useState("");
  const [taskStatus, setTaskStatus] = useState<"todo" | "completed">("todo");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "low",
  );
  const [taskDueDate, setTaskDueDate] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<
    ProjectMemberItem[]
  >([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    const result = await tasksApi.list(projectId);
    if (result.data) setTasks(result.data);
  };

  useEffect(() => {
    tasksApi.list(projectId).then((result) => {
      if (result.data) setTasks(result.data);
    });
    projectsApi.getMembers(projectId).then((result) => {
      if (result.data) setMembers(result.data);
    });
  }, [projectId]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return [];
    return members.filter(
      (m) =>
        m.user_email.toLowerCase().includes(memberSearch.toLowerCase()) &&
        !selectedAssignees.some((s) => s.user_id === m.user_id),
    );
  }, [members, memberSearch, selectedAssignees]);

  const handleSelectMember = (member: ProjectMemberItem) => {
    setSelectedAssignees((prev) => [...prev, member]);
    setMemberSearch("");
  };

  const handleRemoveMember = (userId: number) => {
    setSelectedAssignees((prev) => prev.filter((m) => m.user_id !== userId));
  };

  const handleNewMemberSearch = (value: string) => {
    setNewMemberSearch(value);
    setNewMemberId(null);
    if (newMemberDebounceRef.current)
      clearTimeout(newMemberDebounceRef.current);
    if (!value.trim()) {
      setNewMemberResults([]);
      setShowNewMemberDropdown(false);
      return;
    }
    newMemberDebounceRef.current = setTimeout(async () => {
      const result = await usersApi.search(value);
      if (result.data) {
        setNewMemberResults(result.data);
        setShowNewMemberDropdown(true);
      }
    }, 300);
  };

  const handleSelectNewMember = (user: UserItem) => {
    setNewMemberId(user.id);
    setNewMemberSearch(user.email);
    setNewMemberResults([]);
    setShowNewMemberDropdown(false);
  };

  const handleAddMember = async () => {
    setNewMemberError(null);
    if (!newMemberId) {
      setNewMemberError("Please select a user.");
      return;
    }
    setNewMemberSaving(true);
    const result = await projectsApi.addMember(
      projectId,
      newMemberId,
      "member",
    );
    if (result.error) {
      setNewMemberError(result.error);
      setNewMemberSaving(false);
      return;
    }
    setNewMemberSaving(false);
    handleMemberModalClose();
    projectsApi.getMembers(projectId).then((r) => {
      if (r.data) setMembers(r.data);
    });
  };

  const handleMemberModalClose = () => {
    setNewMemberSearch("");
    setNewMemberId(null);
    setNewMemberResults([]);
    setShowNewMemberDropdown(false);
    setNewMemberError(null);
    closeMemberModal();
  };

  const handleModalClose = () => {
    setTaskName("");
    setTaskStatus("todo");
    setTaskPriority("low");
    setTaskDueDate("");
    setSelectedAssignees([]);
    setMemberSearch("");
    setTaskError(null);
    closeModal();
  };

  const handleCreateTask = async () => {
    setTaskError(null);
    if (!taskName.trim()) {
      setTaskError("Task name is required.");
      return;
    }
    setSaving(true);
    const result = await tasksApi.create({
      name: taskName.trim(),
      status: taskStatus,
      priority: taskPriority,
      project_id: projectId,
      ...(taskDueDate ? { due_date: taskDueDate } : {}),
    });
    if (result.error) {
      setTaskError(result.error);
      setSaving(false);
      return;
    }
    await Promise.all(
      selectedAssignees.map((a) =>
        tasksApi.addAssignee(result.data!.id, a.user_id),
      ),
    );
    setSaving(false);
    handleModalClose();
    fetchTasks();
  };

  const toggleTask = async (task: TaskItem) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    await tasksApi.update(task.id, { status: newStatus });
  };

  const counts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(
    () =>
      activeTab === "team-members"
        ? []
        : tasks.filter((t) => t.status === activeTab),
    [tasks, activeTab],
  );

  return (
    <>
      <PageMeta
        title="Project | Tally Task Management"
        description="Project detail page"
      />
      <PageBreadcrumb pageTitle="Project Tasks" />

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
                  {tab.key !== "team-members" && (
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                        isActive
                          ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                          : "bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {counts[tab.key as "todo" | "completed"]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "team-members" ? (
            canManage && (
              <Button
                size="sm"
                variant="primary"
                endIcon={<AddIcon className="size-5" />}
                onClick={openMemberModal}
              >
                Add Member
              </Button>
            )
          ) : (
            <Button
              size="sm"
              variant="primary"
              endIcon={<AddIcon className="size-5" />}
              onClick={openModal}
            >
              Add New Task
            </Button>
          )}
        </div>

        <div className="mt-6 space-y-8">
          {activeTab === "team-members" ? (
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No members yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                        {m.user_email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {m.user_full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {m.user_email}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        color={m.role === "leader" ? "primary" : "light"}
                      >
                        {m.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <TaskSection
                title="To Do"
                count={counts.todo}
                countColor="light"
                tasks={visibleTasks.filter((t) => t.status === "todo")}
                onToggle={toggleTask}
              />
              <TaskSection
                title="Completed"
                count={counts.completed}
                countColor="success"
                tasks={visibleTasks.filter((t) => t.status === "completed")}
                onToggle={toggleTask}
              />
              {visibleTasks.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks in this category yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isMemberOpen}
        onClose={handleMemberModalClose}
        className="max-w-[484px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Add Member
          </h4>
          <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5">
              <div className="relative">
                <Label>Search User</Label>
                <Input
                  type="text"
                  placeholder="Search by email"
                  value={newMemberSearch}
                  onChange={(e) => handleNewMemberSearch(e.target.value)}
                />
                {showNewMemberDropdown && newMemberResults.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {newMemberResults.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => handleSelectNewMember(u)}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {u.email}
                      </li>
                    ))}
                  </ul>
                )}
                {showNewMemberDropdown &&
                  newMemberResults.length === 0 &&
                  newMemberSearch.trim() && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No users found.
                    </div>
                  )}
              </div>
            </div>
            {newMemberError && (
              <p className="mt-3 text-sm text-red-500">{newMemberError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleMemberModalClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddMember}
                disabled={newMemberSaving}
              >
                {newMemberSaving ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

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
                <Label>Select Status</Label>
                <Select
                  options={[
                    { value: "todo", label: "To Do" },
                    { value: "completed", label: "Completed" },
                  ]}
                  placeholder="Select an option"
                  onChange={(value) =>
                    setTaskStatus(value as "todo" | "completed")
                  }
                  className="dark:bg-dark-900"
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
              <div className="sm:col-span-2">
                <DatePicker
                  id="date-picker"
                  label="Due date"
                  placeholder="Select a date"
                  onChange={(_dates, dateStr) => setTaskDueDate(dateStr)}
                />
              </div>
              <div className="sm:col-span-2 relative">
                <Label>Assign to</Label>
                {selectedAssignees.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedAssignees.map((a) => (
                      <span
                        key={a.user_id}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {a.user_email}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(a.user_id)}
                          className="ml-1 leading-none text-brand-500 hover:text-brand-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  type="text"
                  placeholder="Search by email"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {memberSearch.trim() && filteredMembers.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMembers.map((m) => (
                      <li
                        key={m.user_id}
                        onClick={() => handleSelectMember(m)}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {m.user_email}
                      </li>
                    ))}
                  </ul>
                )}
                {memberSearch.trim() && filteredMembers.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No members found.
                  </div>
                )}
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
