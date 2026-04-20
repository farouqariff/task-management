import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import {
  AddIcon,
  CalenderIcon,
  LoadingIcon,
  PencilIcon,
  TrashBinIcon,
  TaskToDoIcon,
  TaskCompletedIcon,
} from "../../icons";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import {
  tasksApi,
  projectsApi,
  usersApi,
  type TaskItem,
  type ProjectMemberItem,
  type UserItem,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

type TabKey = "todo" | "completed" | "team-members";

const tabs: { key: TabKey; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "completed", label: "Completed" },
  { key: "team-members", label: "Team Members" },
];

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${parseInt(day)}/${parseInt(month)}/${year}`;
}

interface TaskRowProps {
  task: TaskItem;
  canEdit: boolean;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, canEdit, onEdit, onToggle, onDelete }) => {
  const completed = task.status === "completed";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
      <label className={`flex items-center ${canEdit ? "cursor-pointer" : "cursor-default"}`}>
        <input
          type="checkbox"
          checked={completed}
          onChange={() => { if (canEdit) onToggle(task); }}
          className="peer sr-only"
          disabled={!canEdit}
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

        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="text-gray-400 transition-colors hover:text-brand-500"
            title="Edit task"
          >
            <PencilIcon className="size-5" />
          </button>
        )}

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
};

interface TaskSectionProps {
  title: string;
  count: number;
  countColor: "warning" | "info" | "success" | "light";
  tasks: TaskItem[];
  canEdit: (task: TaskItem) => boolean;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  count,
  countColor,
  tasks,
  canEdit,
  onEdit,
  onToggle,
  onDelete,
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
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            canEdit={canEdit(task)}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
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
  const newMemberDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Project-level manage permission (admin or project leader)
  const canManage =
    currentUser?.is_admin ||
    members.some((m) => m.user_id === currentUser?.id && m.role === "leader");

  // Task-level manage permission: admin, project leader, or task creator
  const canManageTask = (task: TaskItem) =>
    canManage || task.created_by === currentUser?.id;

  // Show edit button: managers can edit any task; members can only edit tasks they're assigned to
  const canEditTask = (task: TaskItem) =>
    canManageTask(task) ||
    task.assignees.some((a) => a.user_id === currentUser?.id);

  // Add task state
  const [taskName, setTaskName] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("low");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<ProjectMemberItem[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high">("low");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskAssignees, setEditTaskAssignees] = useState<{ user_id: number; user_email: string }[]>([]);
  const [editTaskMemberSearch, setEditTaskMemberSearch] = useState("");
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [editTaskSaving, setEditTaskSaving] = useState(false);

  // Delete member state
  const [deletingMember, setDeletingMember] = useState<ProjectMemberItem | null>(null);
  const [deleteMemberError, setDeleteMemberError] = useState("");
  const [deleteMemberLoading, setDeleteMemberLoading] = useState(false);

  const fetchTasks = async () => {
    const result = await tasksApi.list(projectId);
    if (result.data) setTasks(result.data);
  };

  useEffect(() => {
    Promise.all([
      tasksApi.list(projectId),
      projectsApi.getMembers(projectId),
    ]).then(([tasksResult, membersResult]) => {
      if (tasksResult.data) setTasks(tasksResult.data);
      if (membersResult.data) setMembers(membersResult.data);
      setLoading(false);
    });
  }, [projectId]);

  // Members filtered for "Add Task" assignee search
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return [];
    return members.filter(
      (m) =>
        m.user_email.toLowerCase().includes(memberSearch.toLowerCase()) &&
        !selectedAssignees.some((s) => s.user_id === m.user_id),
    );
  }, [members, memberSearch, selectedAssignees]);

  // Members filtered for "Edit Task" assignee search
  const editFilteredMembers = useMemo(() => {
    if (!editTaskMemberSearch.trim()) return [];
    return members.filter(
      (m) =>
        m.user_email.toLowerCase().includes(editTaskMemberSearch.toLowerCase()) &&
        !editTaskAssignees.some((a) => a.user_id === m.user_id),
    );
  }, [members, editTaskMemberSearch, editTaskAssignees]);

  const memberTaskCounts = useMemo(() => {
    const counts: Record<number, { todo: number; completed: number }> = {};
    for (const m of members) {
      counts[m.user_id] = { todo: 0, completed: 0 };
    }
    for (const task of tasks) {
      for (const assignee of task.assignees) {
        if (counts[assignee.user_id]) {
          if (task.status === "todo") counts[assignee.user_id].todo++;
          else if (task.status === "completed") counts[assignee.user_id].completed++;
        }
      }
    }
    return counts;
  }, [tasks, members]);

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
    if (newMemberDebounceRef.current) clearTimeout(newMemberDebounceRef.current);
    if (!value.trim()) {
      setNewMemberResults([]);
      setShowNewMemberDropdown(false);
      return;
    }
    newMemberDebounceRef.current = setTimeout(async () => {
      const result = await usersApi.search(value);
      if (result.data) {
        const filtered = result.data.filter(
          (u) => !u.is_admin && !members.some((m) => m.user_id === u.id),
        );
        setNewMemberResults(filtered);
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
    const result = await projectsApi.addMember(projectId, newMemberId, "member");
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
      selectedAssignees.map((a) => tasksApi.addAssignee(result.data!.id, a.user_id)),
    );
    setSaving(false);
    handleModalClose();
    fetchTasks();
  };

  const openEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditTaskAssignees(task.assignees.map((a) => ({ user_id: a.user_id, user_email: a.user_email })));
    setEditTaskMemberSearch("");
    setEditTaskError(null);
  };

  const closeEditTask = () => {
    setEditingTask(null);
    setEditTaskAssignees([]);
    setEditTaskMemberSearch("");
    setEditTaskError(null);
  };

  const handleEditTaskSave = async () => {
    if (!editingTask) return;
    if (!editTaskName.trim()) {
      setEditTaskError("Task name is required.");
      return;
    }
    setEditTaskSaving(true);
    setEditTaskError(null);

    const isManager = canManageTask(editingTask);

    const updatePayload = isManager
      ? { name: editTaskName.trim(), priority: editTaskPriority, due_date: editTaskDueDate || null }
      : { priority: editTaskPriority };

    const result = await tasksApi.update(editingTask.id, updatePayload);
    if (result.error) {
      setEditTaskError(result.error);
      setEditTaskSaving(false);
      return;
    }

    if (isManager) {
      const originalIds = new Set(editingTask.assignees.map((a) => a.user_id));
      const newIds = new Set(editTaskAssignees.map((a) => a.user_id));
      const toAdd = editTaskAssignees.filter((a) => !originalIds.has(a.user_id));
      const toRemove = editingTask.assignees.filter((a) => !newIds.has(a.user_id));
      await Promise.all([
        ...toAdd.map((a) => tasksApi.addAssignee(editingTask.id, a.user_id)),
        ...toRemove.map((a) => tasksApi.removeAssignee(editingTask.id, a.user_id)),
      ]);
    }

    setEditTaskSaving(false);
    closeEditTask();
    fetchTasks();
  };

  const openDeleteMember = (m: ProjectMemberItem) => {
    setDeletingMember(m);
    setDeleteMemberError("");
  };

  const closeDeleteMember = () => {
    setDeletingMember(null);
    setDeleteMemberError("");
  };

  const handleDeleteMemberConfirm = async () => {
    if (!deletingMember) return;
    setDeleteMemberLoading(true);
    setDeleteMemberError("");
    const result = await projectsApi.removeMember(projectId, deletingMember.user_id);
    setDeleteMemberLoading(false);
    if (result.error) {
      setDeleteMemberError(result.error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== deletingMember.user_id));
    closeDeleteMember();
  };

  const toggleTask = async (task: TaskItem) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    await tasksApi.update(task.id, { status: newStatus });
  };

  const handleDeleteTask = async (task: TaskItem) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await tasksApi.delete(task.id);
  };

  const counts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    if (activeTab === "team-members") return [];
    return tasks
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
      });
  }, [tasks, activeTab]);

  // Whether the task being edited allows full management (name, due_date, assignees)
  const editingTaskIsManager = editingTask ? canManageTask(editingTask) : false;

  return (
    <>
      <PageMeta
        title="Project | Tally Task Management"
        description="Project detail page"
      />
      <PageBreadcrumb pageTitle="Project Tasks" />

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
                    {members.map((m) => {
                      const tc = memberTaskCounts[m.user_id] ?? { todo: 0, completed: 0 };
                      return (
                        <div
                          key={m.user_id}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                            {m.user_email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
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
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <TaskToDoIcon className="size-5 text-warning-500" />
                              {tc.todo}
                            </span>
                            <span className="flex items-center gap-1">
                              <TaskCompletedIcon className="size-5 text-success-500" />
                              {tc.completed}
                            </span>
                          </div>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openDeleteMember(m)}
                              className="text-gray-400 transition-colors hover:text-error-500"
                              title="Remove member"
                            >
                              <TrashBinIcon className="size-5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                  canEdit={canEditTask}
                  onEdit={openEditTask}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
                />
                <TaskSection
                  title="Completed"
                  count={counts.completed}
                  countColor="success"
                  tasks={visibleTasks.filter((t) => t.status === "completed")}
                  canEdit={canEditTask}
                  onEdit={openEditTask}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
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
              {editingTaskIsManager && (
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter task name"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                  />
                </div>
              )}
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
              {editingTaskIsManager && (
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
              )}
              {editingTaskIsManager && (
                <div className="sm:col-span-2 relative">
                  <Label>Assign to</Label>
                  {editTaskAssignees.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {editTaskAssignees.map((a) => (
                        <span
                          key={a.user_id}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                        >
                          {a.user_email}
                          <button
                            type="button"
                            onClick={() =>
                              setEditTaskAssignees((prev) =>
                                prev.filter((x) => x.user_id !== a.user_id),
                              )
                            }
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
                    value={editTaskMemberSearch}
                    onChange={(e) => setEditTaskMemberSearch(e.target.value)}
                  />
                  {editTaskMemberSearch.trim() && editFilteredMembers.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {editFilteredMembers.map((m) => (
                        <li
                          key={m.user_id}
                          onClick={() => {
                            setEditTaskAssignees((prev) => [
                              ...prev,
                              { user_id: m.user_id, user_email: m.user_email },
                            ]);
                            setEditTaskMemberSearch("");
                          }}
                          className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {m.user_email}
                        </li>
                      ))}
                    </ul>
                  )}
                  {editTaskMemberSearch.trim() && editFilteredMembers.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No members found.
                    </div>
                  )}
                </div>
              )}
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

      {/* Delete Member Modal */}
      <Modal
        isOpen={deletingMember !== null}
        onClose={closeDeleteMember}
        className="max-w-[507px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 text-center dark:bg-gray-900 sm:p-10">
          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g className="fill-error-50 dark:fill-error-500/15">
                <circle cx="48" cy="24" r="20" />
                <circle cx="48" cy="72" r="20" />
                <circle cx="24" cy="48" r="20" />
                <circle cx="72" cy="48" r="20" />
                <circle cx="31" cy="31" r="20" />
                <circle cx="65" cy="31" r="20" />
                <circle cx="31" cy="65" r="20" />
                <circle cx="65" cy="65" r="20" />
              </g>
              <path
                d="M37 37L59 59M59 37L37 59"
                className="stroke-error-500"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h4 className="mb-3 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Danger Alert!
          </h4>
          <p className="mx-auto mb-6 max-w-[380px] text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to remove{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {deletingMember?.user_full_name}
            </span>{" "}
            from this project? This action cannot be undone.
          </p>
          {deleteMemberError && (
            <p className="mb-4 text-sm text-error-500">{deleteMemberError}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeDeleteMember}
              disabled={deleteMemberLoading}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDeleteMemberConfirm}
              disabled={deleteMemberLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMemberLoading ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
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
              <Button size="sm" variant="outline" onClick={handleMemberModalClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddMember} disabled={newMemberSaving}>
                {newMemberSaving ? "Adding..." : "Add"}
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
