import React, { useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { usersApi, type UserItem } from "../../services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string, leaderId: number) => Promise<void>;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
}: Props) {
  const [projectName, setProjectName] = useState("");
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderResults, setLeaderResults] = useState<UserItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [projectNameError, setProjectNameError] = useState("");
  const [leaderError, setLeaderError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleClose = () => {
    setProjectName("");
    setLeaderId(null);
    setLeaderSearch("");
    setLeaderResults([]);
    setShowDropdown(false);
    setProjectNameError("");
    setLeaderError("");
    onClose();
  };

  // const handleSubmit = async () => {
  //   setProjectNameError("");
  //   setLeaderError("");

  //   if (!projectName.trim()) {
  //     setProjectNameError("Please enter a project name.");
  //     return;
  //   }
  //   if (!leaderId) {
  //     setLeaderError("Please select a leader.");
  //     return;
  //   }
  //   await onCreate(projectName, leaderId);
  //   handleClose();
  // };

  const handleSubmit = async () => {
    setProjectNameError("");
    setLeaderError("");

    let hasError = false;
    if (!projectName.trim()) {
      setProjectNameError("Please enter a project name");
      hasError = true;
    }
    if (leaderId === null) {
      setLeaderError("Please select a leader");
      hasError = true;
    }
    if (hasError) return;
    await onCreate(projectName, leaderId!);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] m-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProjectName(e.target.value)
                }
              />
              <p className="mt-1 text-sm text-error-500 min-h-[1.25rem]">
                {projectNameError}
              </p>
            </div>
            <div className="sm:col-span-2 relative">
              <Label>Select Leader</Label>
              <Input
                type="text"
                placeholder="Search by email"
                value={leaderSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleLeaderSearch(e.target.value)
                }
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
              <p className="mt-1 text-sm text-error-500 min-h-[1.25rem]">
                {leaderError}
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
