import { useState, useMemo, useEffect } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import { tasksApi, type ProjectMemberItem, type TaskItem } from "../../services/api";

interface EditTaskModalProps {
  task: TaskItem | null;
  isManager: boolean;
  onClose: () => void;
  members: ProjectMemberItem[];
  onTaskSaved: () => void;
  guardCompletedProject: () => Promise<boolean>;
}

export default function EditTaskModal({
  task,
  isManager,
  onClose,
  members,
  onTaskSaved,
  guardCompletedProject,
}: EditTaskModalProps) {
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<
    "low" | "medium" | "high"
  >("low");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskAssignees, setEditTaskAssignees] = useState<
    { user_id: number; user_email: string }[]
  >([]);
  const [editTaskMemberSearch, setEditTaskMemberSearch] = useState("");
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [editTaskSaving, setEditTaskSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setEditTaskName(task.name);
      setEditTaskPriority(task.priority);
      setEditTaskDueDate(task.due_date ? task.due_date.split("T")[0] : "");
      setEditTaskAssignees(
        task.assignees.map((a) => ({
          user_id: a.user_id,
          user_email: a.user_email,
        })),
      );
      setEditTaskMemberSearch("");
      setEditTaskError(null);
    }
  }, [task]);

  const editFilteredMembers = useMemo(() => {
    if (!editTaskMemberSearch.trim()) return [];
    return members.filter(
      (m) =>
        m.user_email
          .toLowerCase()
          .includes(editTaskMemberSearch.toLowerCase()) &&
        !editTaskAssignees.some((a) => a.user_id === m.user_id),
    );
  }, [members, editTaskMemberSearch, editTaskAssignees]);

  const closeEditTask = () => {
    setEditTaskAssignees([]);
    setEditTaskMemberSearch("");
    setEditTaskError(null);
    onClose();
  };

  const handleEditTaskSave = async () => {
    if (!(await guardCompletedProject())) return;
    if (!task) return;
    if (!editTaskName.trim()) {
      setEditTaskError("Task name is required.");
      return;
    }
    setEditTaskSaving(true);
    setEditTaskError(null);

    const updatePayload = isManager
      ? {
          name: editTaskName.trim(),
          priority: editTaskPriority,
          due_date: editTaskDueDate || null,
        }
      : { priority: editTaskPriority };

    const result = await tasksApi.update(task.id, updatePayload);
    if (result.error) {
      setEditTaskError(result.error);
      setEditTaskSaving(false);
      return;
    }

    if (isManager) {
      const originalIds = new Set(task.assignees.map((a) => a.user_id));
      const newIds = new Set(editTaskAssignees.map((a) => a.user_id));
      const toAdd = editTaskAssignees.filter(
        (a) => !originalIds.has(a.user_id),
      );
      const toRemove = task.assignees.filter((a) => !newIds.has(a.user_id));
      await Promise.all([
        ...toAdd.map((a) => tasksApi.addAssignee(task.id, a.user_id)),
        ...toRemove.map((a) => tasksApi.removeAssignee(task.id, a.user_id)),
      ]);
    }

    setEditTaskSaving(false);
    closeEditTask();
    onTaskSaved();
  };

  return (
    <Modal
      isOpen={task !== null}
      onClose={closeEditTask}
      className="max-w-[584px] m-4"
    >
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit Task
        </h4>
        <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            {isManager && (
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Enter task name"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Select Priority</Label>
              <Select
                key={task?.id}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
                defaultValue={editTaskPriority}
                placeholder="Select an option"
                onChange={(value) =>
                  setEditTaskPriority(value as "low" | "medium" | "high")
                }
                className="dark:bg-dark-900"
              />
            </div>
            {isManager && (
              <div>
                <DatePicker
                  key={task?.id}
                  id="edit-date-picker"
                  label="Due date"
                  placeholder="Select a date"
                  defaultDate={editTaskDueDate || undefined}
                  onChange={(_dates, dateStr) => setEditTaskDueDate(dateStr)}
                />
              </div>
            )}
            {isManager && (
              <div className="sm:col-span-2 relative">
                <Label>Assign to</Label>
                {editTaskAssignees.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editTaskAssignees.map((a) => (
                      <span
                        key={a.user_id}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {a.user_email}
                        <button
                          type="button"
                          onClick={() =>
                            setEditTaskAssignees((prev) =>
                              prev.filter((x) => x.user_id !== a.user_id),
                            )
                          }
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
                  value={editTaskMemberSearch}
                  onChange={(e) => setEditTaskMemberSearch(e.target.value)}
                />
                {editTaskMemberSearch.trim() &&
                  editFilteredMembers.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {editFilteredMembers.map((m) => (
                        <li
                          key={m.user_id}
                          onClick={() => {
                            setEditTaskAssignees((prev) => [
                              ...prev,
                              {
                                user_id: m.user_id,
                                user_email: m.user_email,
                              },
                            ]);
                            setEditTaskMemberSearch("");
                          }}
                          className="px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {m.user_email}
                        </li>
                      ))}
                    </ul>
                  )}
                {editTaskMemberSearch.trim() &&
                  editFilteredMembers.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No members found.
                    </div>
                  )}
              </div>
            )}
          </div>
          {editTaskError && (
            <p className="mt-3 text-sm text-red-500">{editTaskError}</p>
          )}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeEditTask}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditTaskSave}
              disabled={editTaskSaving}
            >
              {editTaskSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
