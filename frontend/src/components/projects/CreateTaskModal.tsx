import { useState, useMemo, useEffect } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import { tasksApi, type ProjectMemberItem } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: ProjectMemberItem[];
  onTaskCreated: () => void;
  guardCompletedProject: () => Promise<boolean>;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  members,
  onTaskCreated,
  guardCompletedProject,
}: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "low",
  );
  const [taskDueDate, setTaskDueDate] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<
    ProjectMemberItem[]
  >([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    if (currentUser?.is_admin) return;
    const self = members.find((m) => m.user_id === currentUser?.id);
    if (self) setSelectedAssignees([self]);
  }, [isOpen]);
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return [];
    return members.filter(
      (m) =>
        m.user_email.toLowerCase().includes(memberSearch.toLowerCase()) &&
        !selectedAssignees.some((s) => s.user_id === m.user_id),
    );
  }, [members, memberSearch, selectedAssignees]);
  const handleSelectMember = (member: ProjectMemberItem) => {
    setSelectedAssignees((prev) => [...prev, member]);
    setMemberSearch("");
  };
  const handleRemoveMember = (userId: number) => {
    setSelectedAssignees((prev) => prev.filter((m) => m.user_id !== userId));
  };
  const handleClose = () => {
    setTaskName("");
    setTaskPriority("low");
    setTaskDueDate("");
    setSelectedAssignees([]);
    setMemberSearch("");
    setTaskError(null);
    onClose();
  };
  const handleCreateTask = async () => {
    if (!(await guardCompletedProject())) return;
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
      selectedAssignees.map((a) =>
        tasksApi.addAssignee(result.data!.id, a.user_id),
      ),
    );
    setSaving(false);
    handleClose();
    onTaskCreated();
  };
  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] m-4">
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
            <Button size="sm" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateTask} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
