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
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    usersApi.list().then((result) => {
      if (result.data) setUsers(result.data);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    closeModal();
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
          onEdit={(row) => console.log("edit user", row.id)}
          onDelete={(row) => console.log("delete user", row.id)}
          addButtonLabel="Add New User"
          onAdd={openModal}
        />
      )}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[584px] m-4">
        <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Personal Information
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
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
