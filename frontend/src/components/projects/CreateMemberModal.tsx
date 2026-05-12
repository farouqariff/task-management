import { useState, useRef } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import {
  projectsApi,
  usersApi,
  type ProjectMemberItem,
  type UserItem,
} from "../../services/api";

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: ProjectMemberItem[];
  onMemberAdded: () => void;
  guardCompletedProject: () => Promise<boolean>;
}

export default function CreateMemberModal({
  isOpen,
  onClose,
  projectId,
  members,
  onMemberAdded,
  guardCompletedProject,
}: CreateMemberModalProps) {
  const [newMemberSearch, setNewMemberSearch] = useState("");
  const [newMemberId, setNewMemberId] = useState<number | null>(null);
  const [newMemberResults, setNewMemberResults] = useState<UserItem[]>([]);
  const [showNewMemberDropdown, setShowNewMemberDropdown] = useState(false);
  const [newMemberError, setNewMemberError] = useState<string | null>(null);
  const [newMemberSaving, setNewMemberSaving] = useState(false);
  const newMemberDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  const handleClose = () => {
    setNewMemberSearch("");
    setNewMemberId(null);
    setNewMemberResults([]);
    setShowNewMemberDropdown(false);
    setNewMemberError(null);
    onClose();
  };

  const handleAddMember = async () => {
    if (!(await guardCompletedProject())) return;
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
    handleClose();
    onMemberAdded();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[484px] m-4">
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
          <p className="mt-3 text-sm text-error-500 min-h-[1.25rem]">
            {newMemberError}
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={handleClose}>
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
  );
}
