import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { projectsApi, usersApi, type ProjectItem, type UserItem } from "../../services/api";

interface Props {
  project: ProjectItem | null;
  onClose: () => void;
  onSave: (updated: ProjectItem) => void;
}

export default function EditProjectModal({ project, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderResults, setLeaderResults] = useState<UserItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setIsCompleted(project.is_completed);
    const leader = project.members.find((m) => m.role === "leader");
    setLeaderId(leader?.user_id ?? null);
    setLeaderSearch(leader?.user_email ?? "");
    setLeaderResults([]);
    setShowDropdown(false);
    setError("");
  }, [project]);

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

  const handleSave = async () => {
    if (!project) return;
    setError("");
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }
    setSaving(true);
    const result = await projectsApi.update(project.id, {
      name,
      is_completed: isCompleted,
      ...(leaderId !== null ? { leader_id: leaderId } : {}),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) onSave(result.data);
    onClose();
  };

  return (
    <Modal isOpen={project !== null} onClose={onClose} className="max-w-[584px] m-4">
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
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Label>Select Leader</Label>
              <Input
                type="text"
                placeholder="Search by email"
                value={leaderSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLeaderSearch(e.target.value)}
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
              {showDropdown && leaderResults.length === 0 && leaderSearch.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No leaders found.
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                id="edit-is-completed"
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500"
              />
              <label htmlFor="edit-is-completed" className="text-sm text-gray-700 dark:text-gray-300">
                Mark as completed
              </label>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
