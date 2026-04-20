import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable, { Column } from "../../components/tables/DataTable/DataTable";
import {
  projectsApi,
  usersApi,
  type ProjectItem,
  type UserItem,
} from "../../services/api";
import { LoadingIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useAuth } from "../../context/AuthContext";

const columns: Column<ProjectItem>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    accessor: (row) => row.name,
    render: (row) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.name}
      </span>
    ),
  },
  {
    key: "is_completed",
    header: "Completed",
    sortable: true,
    accessor: (row) => (row.is_completed ? "Yes" : "No"),
    render: (row) =>
      row.is_completed ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          No
        </span>
      ),
  },
];

const searchProject = (row: ProjectItem) => row.name;

export default function Projects() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();

  const [projectName, setProjectName] = useState("");
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderResults, setLeaderResults] = useState<UserItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsCompleted, setEditIsCompleted] = useState(false);
  const [editLeaderId, setEditLeaderId] = useState<number | null>(null);
  const [editLeaderSearch, setEditLeaderSearch] = useState("");
  const [editLeaderResults, setEditLeaderResults] = useState<UserItem[]>([]);
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = async () => {
    const result = await projectsApi.list();
    if (result.data) setProjects(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLeaderSearch = (value: string) => {
    setLeaderSearch(value);
    setLeaderId(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setLeaderResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await usersApi.search(value);
      if (result.data) {
        setLeaderResults(result.data);
        setShowDropdown(true);
      }
    }, 300);
  };

  const handleSelectLeader = (user: UserItem) => {
    setLeaderId(user.id);
    setLeaderSearch(user.email);
    setLeaderResults([]);
    setShowDropdown(false);
  };

  const handleEditLeaderSearch = (value: string) => {
    setEditLeaderSearch(value);
    setEditLeaderId(null);
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
    if (!value.trim()) {
      setEditLeaderResults([]);
      setEditShowDropdown(false);
      return;
    }
    editDebounceRef.current = setTimeout(async () => {
      const result = await usersApi.search(value);
      if (result.data) {
        setEditLeaderResults(result.data);
        setEditShowDropdown(true);
      }
    }, 300);
  };

  const handleSelectEditLeader = (user: UserItem) => {
    setEditLeaderId(user.id);
    setEditLeaderSearch(user.email);
    setEditLeaderResults([]);
    setEditShowDropdown(false);
  };

  const openEditModal = (row: ProjectItem) => {
    setEditingProject(row);
    setEditName(row.name);
    setEditIsCompleted(row.is_completed);
    const currentLeader = row.members.find((m) => m.role === "leader");
    setEditLeaderId(currentLeader?.user_id ?? null);
    setEditLeaderSearch(currentLeader?.user_email ?? "");
    setEditLeaderResults([]);
    setEditShowDropdown(false);
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setEditLeaderSearch("");
    setEditLeaderResults([]);
    setEditShowDropdown(false);
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingProject) return;
    setEditSaving(true);
    setEditError("");
    const result = await projectsApi.update(editingProject.id, {
      name: editName,
      is_completed: editIsCompleted,
      ...(editLeaderId !== null ? { leader_id: editLeaderId } : {}),
    });
    setEditSaving(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    if (result.data) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? result.data! : p))
      );
    }
    closeEditModal();
  };

  const openDeleteModal = (row: ProjectItem) => {
    setDeletingProject(row);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeletingProject(null);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    setDeleteError("");
    const result = await projectsApi.delete(deletingProject.id);
    setDeleteLoading(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
    closeDeleteModal();
  };

  const handleCreateProject = async () => {
    setProjectError(null);
    if (!leaderId) {
      setProjectError("Please select a leader.");
      return;
    }
    const result = await projectsApi.create(projectName, leaderId);
    if (result.error) {
      setProjectError(result.error);
      return;
    }
    setProjectName("");
    setLeaderId(null);
    setLeaderSearch("");
    closeModal();
    fetchProjects();
  };

  return (
    <>
      <PageMeta
        title="Projects | Tally Task Management"
        description="Projects directory — search, sort, and manage projects."
      />
      <PageBreadcrumb pageTitle="Projects" />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : (
        <DataTable<ProjectItem>
          data={projects}
          columns={columns}
          searchable={searchProject}
          onView={(row) => navigate(`/project/${row.id}`)}
          onEdit={openEditModal}
          canEdit={(row) =>
            currentUser?.is_admin ||
            row.created_by === currentUser?.id ||
            row.members.some(
              (m) => m.user_id === currentUser?.id && m.role === "leader"
            )
          }
          onDelete={openDeleteModal}
          canDelete={(row) =>
            currentUser?.is_admin || row.created_by === currentUser?.id
          }
          addButtonLabel="Add New Project"
          onAdd={openModal}
        />
      )}

      <Modal
        isOpen={editingProject !== null}
        onClose={closeEditModal}
        className="max-w-[584px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit Project
          </h4>
          <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5">
              <div>
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Enter project name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Label>Select Leader</Label>
                <Input
                  type="text"
                  placeholder="Search by email"
                  value={editLeaderSearch}
                  onChange={(e) => handleEditLeaderSearch(e.target.value)}
                />
                {editShowDropdown && editLeaderResults.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {editLeaderResults.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => handleSelectEditLeader(u)}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {u.email}
                      </li>
                    ))}
                  </ul>
                )}
                {editShowDropdown && editLeaderResults.length === 0 && editLeaderSearch.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No leaders found.
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="edit-is-completed"
                  type="checkbox"
                  checked={editIsCompleted}
                  onChange={(e) => setEditIsCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500"
                />
                <label
                  htmlFor="edit-is-completed"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Mark as completed
                </label>
              </div>
            </div>
            {editError && (
              <p className="mt-3 text-sm text-red-500">{editError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={deletingProject !== null}
        onClose={closeDeleteModal}
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
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {deletingProject?.name}
            </span>
            ? This action cannot be undone.
          </p>
          {deleteError && (
            <p className="mb-4 text-sm text-error-500">{deleteError}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[584px] m-4">
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            New Project
          </h4>
          <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 relative">
                <Label>Select Leader</Label>
                <Input
                  type="text"
                  placeholder="Search by email"
                  value={leaderSearch}
                  onChange={(e) => handleLeaderSearch(e.target.value)}
                />
                {showDropdown && leaderResults.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {leaderResults.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => handleSelectLeader(u)}
                        className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {u.email}
                      </li>
                    ))}
                  </ul>
                )}
                {showDropdown &&
                  leaderResults.length === 0 &&
                  leaderSearch.trim() && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No leaders found.
                    </div>
                  )}
              </div>
            </div>
            {projectError && (
              <p className="mt-3 text-sm text-red-500">{projectError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateProject}>
                Save
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
