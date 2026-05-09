import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import type { ProjectItem } from "../../services/api";

interface Props {
  project: ProjectItem | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string;
}

export default function DeleteProjectModal({
  project,
  onClose,
  onConfirm,
  loading,
  error,
}: Props) {
  return (
    <Modal
      isOpen={project !== null}
      onClose={onClose}
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
            {project?.name}
          </span>
          ? This action cannot be undone.
        </p>
        {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
