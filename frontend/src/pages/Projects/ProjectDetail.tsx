import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import {
  AddIcon,
  CalenderIcon,
  LoadingIcon,
  MoreDotIcon,
  PencilIcon,
  TrashBinIcon,
  TaskToDoIcon,
  TaskCompletedIcon,
} from "../../icons";
import Button from "../../components/ui/button/Button";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { useModal } from "../../hooks/useModal";
import {
  tasksApi,
  projectsApi,
  type ProjectItem,
  type TaskItem,
  type ProjectMemberItem,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateTaskModal from "../../components/projects/CreateTaskModal";
import EditTaskModal from "../../components/projects/EditTaskModal";
import CreateMemberModal from "../../components/projects/CreateMemberModal";
import DeleteMemberModal from "../../components/projects/DeleteMemberModal";
import CompletedWarningModal from "../../components/projects/CompletedWarningModal";

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
  canToggle: boolean;
  canManage: boolean;
  isProjectCompleted: boolean;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskRow = memo(function TaskRow({
  task,
  canToggle,
  canManage,
  isProjectCompleted,
  onEdit,
  onToggle,
  onDelete,
}: TaskRowProps) {
  const completed = task.status === "completed";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
      <label
        className={`flex items-center ${canToggle && !isProjectCompleted ? "cursor-pointer" : "cursor-default"}`}
      >
        <input
          type="checkbox"
          checked={completed}
          onChange={() => {
            if (canToggle) onToggle(task);
          }}
          className="peer sr-only"
          disabled={!canToggle || isProjectCompleted}
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
            completed
              ? "border-brand-500 bg-brand-500"
              : canToggle
                ? "border-gray-300 bg-transparent dark:border-gray-600"
                : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
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
          onClick={() => onEdit(task)}
          disabled={isProjectCompleted}
          className={`transition-colors hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 ${canManage ? "text-gray-400" : "invisible"}`}
          title="Edit task"
        >
          <PencilIcon className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          disabled={isProjectCompleted}
          className={`transition-colors hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 ${canManage ? "text-gray-400" : "invisible"}`}
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
  canToggle: (task: TaskItem) => boolean;
  canManage: (task: TaskItem) => boolean;
  isProjectCompleted: boolean;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

const TaskSection = memo(function TaskSection({
  title,
  count,
  countColor,
  tasks,
  canToggle,
  canManage,
  isProjectCompleted,
  onEdit,
  onToggle,
  onDelete,
}: TaskSectionProps) {
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
            canToggle={canToggle(task)}
            canManage={canManage(task)}
            isProjectCompleted={isProjectCompleted}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
});

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();

  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("todo");
  const { isOpen, openModal, closeModal } = useModal();
  const {
    isOpen: isMemberOpen,
    openModal: openMemberModal,
    closeModal: closeMemberModal,
  } = useModal();

  const isAdmin = currentUser?.is_admin ?? false;
  const isCompleted = project?.is_completed ?? false;
  const canManageProject = project?.permissions?.can_edit ?? false;
  // Admins can always see the dropdown (including uncomplete); leaders only when not yet completed
  const showCompleteDropdown = isAdmin || (canManageProject && !isCompleted);

  const canManageTask = (task: TaskItem) => task.permissions?.can_manage ?? false;
  const canEditTask = (task: TaskItem) => task.permissions?.can_update_status ?? false;

  // Edit task state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const openEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
  }, []);

  const closeEditTask = () => {
    setEditingTask(null);
  };

  // Delete member state
  const [deletingMember, setDeletingMember] =
    useState<ProjectMemberItem | null>(null);
  const [deleteMemberError, setDeleteMemberError] = useState("");
  const [deleteMemberLoading, setDeleteMemberLoading] = useState(false);

  const fetchTasks = async () => {
    const result = await tasksApi.list(projectId);
    if (result.data) setTasks(result.data);
  };

  const guardCompletedProject = async (): Promise<boolean> => {
    if (currentUser?.is_admin) return true;
    const result = await projectsApi.get(projectId);
    if (result.data?.is_completed) {
      navigate("/error-403");
      return false;
    }
    return true;
  };

  useEffect(() => {
    Promise.all([
      tasksApi.list(projectId),
      projectsApi.getMembers(projectId),
      projectsApi.get(projectId),
    ]).then(([tasksResult, membersResult, projectResult]) => {
      if (tasksResult.error || membersResult.error || projectResult.error) {
        setFetchError(
          tasksResult.error ||
            membersResult.error ||
            projectResult.error ||
            "Failed to load",
        );
      } else {
        if (projectResult.data?.is_completed && !currentUser?.is_admin) {
          navigate("/error-403");
          return;
        }
        if (tasksResult.data) setTasks(tasksResult.data);
        if (membersResult.data) setMembers(membersResult.data);
        if (projectResult.data) setProject(projectResult.data);
      }
      setLoading(false);
    });
  }, [projectId]);

  const memberTaskCounts = useMemo(() => {
    const counts: Record<number, { todo: number; completed: number }> = {};
    for (const m of members) {
      counts[m.user_id] = { todo: 0, completed: 0 };
    }
    for (const task of tasks) {
      for (const assignee of task.assignees) {
        if (counts[assignee.user_id]) {
          if (task.status === "todo") counts[assignee.user_id].todo++;
          else if (task.status === "completed")
            counts[assignee.user_id].completed++;
        }
      }
    }
    return counts;
  }, [tasks, members]);

  const handleMemberAdded = () => {
    projectsApi.getMembers(projectId).then((r) => {
      if (r.data) setMembers(r.data);
    });
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
    if (!(await guardCompletedProject())) return;
    if (!deletingMember) return;
    setDeleteMemberLoading(true);
    setDeleteMemberError("");
    const result = await projectsApi.removeMember(
      projectId,
      deletingMember.user_id,
    );
    setDeleteMemberLoading(false);
    if (result.error) {
      setDeleteMemberError(result.error);
      return;
    }
    setMembers((prev) =>
      prev.filter((m) => m.user_id !== deletingMember.user_id),
    );
    closeDeleteMember();
  };

  const toggleTask = useCallback(async (task: TaskItem) => {
    if (!(await guardCompletedProject())) return;
    const newStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    await tasksApi.update(task.id, { status: newStatus });
  }, []);

  const handleDeleteTask = useCallback(async (task: TaskItem) => {
    if (!(await guardCompletedProject())) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await tasksApi.delete(task.id);
  }, []);

  const handleMarkComplete = async () => {
    setCompleteLoading(true);
    setCompleteError(null);
    const result = await projectsApi.update(projectId, { is_completed: true });
    setCompleteLoading(false);
    if (result.error) {
      setCompleteError(result.error);
      return;
    }
    window.dispatchEvent(new CustomEvent("project-completed"));
    navigate("/tasks");
  };

  const handleMarkNotComplete = async () => {
    setIsDropdownOpen(false);
    const result = await projectsApi.update(projectId, { is_completed: false });
    if (result.data) {
      setProject((prev) => (prev ? { ...prev, is_completed: false } : prev));
    }
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

  return (
    <>
      <PageMeta title="Project | Tally" description="Project detail page" />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : fetchError ? (
        <div className="py-12 text-center text-sm text-red-500">
          {fetchError}
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

            <div className="flex items-center gap-2">
              {activeTab === "team-members" ? (
                canManageProject && (
                  <Button
                    size="sm"
                    variant="primary"
                    endIcon={<AddIcon className="size-5" />}
                    onClick={isCompleted ? undefined : openMemberModal}
                    disabled={isCompleted}
                  >
                    Add New Member
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  endIcon={<AddIcon className="size-5" />}
                  onClick={isCompleted ? undefined : openModal}
                  disabled={isCompleted}
                >
                  Add New Task
                </Button>
              )}
              {showCompleteDropdown && (
                <div className="relative inline-block">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                  </button>
                  <Dropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    className="w-48 p-2"
                  >
                    {!isCompleted ? (
                      <DropdownItem
                        onItemClick={() => {
                          setIsDropdownOpen(false);
                          setIsCompleteModalOpen(true);
                        }}
                        className="flex w-full rounded-lg font-normal text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        Mark as Completed
                      </DropdownItem>
                    ) : (
                      <DropdownItem
                        onItemClick={handleMarkNotComplete}
                        className="flex w-full rounded-lg font-normal text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        Mark as Not Completed
                      </DropdownItem>
                    )}
                  </Dropdown>
                </div>
              )}
            </div>
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
                      const tc = memberTaskCounts[m.user_id] ?? {
                        todo: 0,
                        completed: 0,
                      };
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
                          {canManageProject && (
                            <button
                              type="button"
                              onClick={() => openDeleteMember(m)}
                              disabled={isCompleted}
                              className="text-gray-400 transition-colors hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
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
                  canToggle={canEditTask}
                  canManage={canManageTask}
                  isProjectCompleted={isCompleted}
                  onEdit={openEditTask}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
                />
                <TaskSection
                  title="Completed"
                  count={counts.completed}
                  countColor="success"
                  tasks={visibleTasks.filter((t) => t.status === "completed")}
                  canToggle={canEditTask}
                  canManage={canManageTask}
                  isProjectCompleted={isCompleted}
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

      <DeleteMemberModal
        member={deletingMember}
        onClose={closeDeleteMember}
        onConfirm={handleDeleteMemberConfirm}
        error={deleteMemberError}
        loading={deleteMemberLoading}
      />

      <CreateMemberModal
        isOpen={isMemberOpen}
        onClose={closeMemberModal}
        projectId={projectId}
        members={members}
        onMemberAdded={handleMemberAdded}
        guardCompletedProject={guardCompletedProject}
      />

      <CreateTaskModal
        isOpen={isOpen}
        onClose={closeModal}
        projectId={projectId}
        members={members}
        onTaskCreated={fetchTasks}
        guardCompletedProject={guardCompletedProject}
      />

      <EditTaskModal
        task={editingTask}
        isManager={editingTask ? canManageTask(editingTask) : false}
        onClose={closeEditTask}
        members={members}
        onTaskSaved={fetchTasks}
        guardCompletedProject={guardCompletedProject}
      />

      <CompletedWarningModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setCompleteError(null);
        }}
        onConfirm={handleMarkComplete}
        error={completeError}
        loading={completeLoading}
      />
    </>
  );
}
