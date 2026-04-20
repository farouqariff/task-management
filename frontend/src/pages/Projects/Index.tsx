import { useEffect, useRef, useState } from "react";
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
          onEdit={(row) => console.log("edit project", row.id)}
          onDelete={(row) => console.log("delete project", row.id)}
          addButtonLabel="Add New Project"
          onAdd={openModal}
        />
      )}

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
