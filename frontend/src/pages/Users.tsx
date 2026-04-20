import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import DataTable, { Column } from "../components/tables/DataTable/DataTable";
import { usersApi, type UserItem } from "../services/api";
import { LoadingIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { useAuth } from "../context/AuthContext";

const columns: Column<UserItem>[] = [
  {
    key: "full_name",
    header: "Full Name",
    sortable: true,
    accessor: (row) => row.full_name,
    render: (row) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.full_name}
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    accessor: (row) => row.email,
  },
];

const searchUser = (row: UserItem) => `${row.full_name} ${row.email}`;

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();

  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    usersApi.list().then((result) => {
      if (result.data) setUsers(result.data);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    closeModal();
  };

  const openEditModal = (row: UserItem) => {
    setEditingUser(row);
    setEditFirstName(row.first_name);
    setEditLastName(row.last_name);
    setEditEmail(row.email);
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError("");
    const result = await usersApi.update(editingUser.id, {
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
    });
    setEditSaving(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    if (result.data) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? result.data! : u)),
      );
    }
    closeEditModal();
  };

  const openDeleteModal = (row: UserItem) => {
    setDeletingUser(row);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeletingUser(null);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError("");
    const result = await usersApi.delete(deletingUser.id);
    setDeleteLoading(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    closeDeleteModal();
  };

  return (
    <>
      <PageMeta
        title="Users | Tally Task Management"
        description="Users directory — search, sort, and manage team members."
      />
      <PageBreadcrumb pageTitle="Users" />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : (
        <DataTable<UserItem>
          data={users}
          columns={columns}
          searchable={searchUser}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          canDelete={(row) => row.id !== currentUser?.id}
          addButtonLabel="Add New User"
          onAdd={openModal}
        />
      )}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[584px] m-4">
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            New User
          </h4>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input type="text" placeholder="Musharof" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input type="text" placeholder="Chowdhury" />
              </div>
              <div className="sm:col-span-2">
                <Label>Email Address</Label>
                <Input type="text" placeholder="randomuser@pimjo.com" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Add
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={editingUser !== null}
        onClose={closeEditModal}
        className="max-w-[584px] m-4"
      >
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit User
          </h4>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input
                  type="text"
                  placeholder="Musharof"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  placeholder="Chowdhury"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email Address</Label>
                <Input
                  type="text"
                  placeholder="randomuser@pimjo.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
            {editError && (
              <p className="mt-3 text-sm text-red-500">{editError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button size="sm" variant="outline" onClick={closeEditModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={deletingUser !== null}
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
              {deletingUser?.full_name}
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
    </>
  );
}
