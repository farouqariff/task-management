import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import DataTable, { Column } from "../../components/tables/DataTable/DataTable";
import { projectsApi, type ProjectItem } from "../../services/api";
import { LoadingIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import DeleteProjectModal from "../../components/projects/DeleteProjectModal";
import CreateProjectModal from "../../components/projects/CreateProjectModal";
import EditProjectModal from "../../components/projects/EditProjectModal";

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
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = async () => {
    const result = await projectsApi.list();
    if (result.error) setFetchError(result.error);
    else if (result.data) setProjects(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
    setDeletingProject(null);
  };

  const handleCreateProject = async (projectName: string, leaderId: number) => {
    await projectsApi.create(projectName, leaderId);
    fetchProjects();
  };

  const handleEditSave = (updated: ProjectItem) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <>
      <PageMeta
        title="Projects | Tally"
        description="Projects directory — search, sort, and manage projects."
      />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : fetchError ? (
        <div className="py-12 text-center text-sm text-red-500">
          {fetchError}
        </div>
      ) : (
        <DataTable<ProjectItem>
          data={projects}
          columns={columns}
          searchable={searchProject}
          onView={(row) => navigate(`/project/${row.id}`)}
          onEdit={(row) => setEditingProject(row)}
          canEdit={(row) => row.permissions?.can_edit ?? false}
          onDelete={(row) => { setDeletingProject(row); setDeleteError(""); }}
          canDelete={(row) => row.permissions?.can_delete ?? false}
          addButtonLabel="Add New Project"
          onAdd={openModal}
        />
      )}

      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleEditSave}
      />
      <DeleteProjectModal
        project={deletingProject}
        onClose={() => { setDeletingProject(null); setDeleteError(""); }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        error={deleteError}
      />
      <CreateProjectModal
        isOpen={isOpen}
        onClose={closeModal}
        onCreate={handleCreateProject}
      />
    </>
  );
}
