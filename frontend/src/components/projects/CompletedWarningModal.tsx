import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

interface CompletedWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  error: string | null;
  loading: boolean;
}

export default function CompletedWarningModal({
  isOpen,
  onClose,
  onConfirm,
  error,
  loading,
}: CompletedWarningModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[507px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 text-center dark:bg-gray-900 sm:p-10">
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g className="fill-warning-50 dark:fill-warning-500/15">
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
              d="M48 36V54"
              className="stroke-warning-500"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="63" r="3.5" className="fill-warning-500" />
          </svg>
        </div>
        <h4 className="mb-3 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Warning Alert!
        </h4>
        <p className="mx-auto mb-6 max-w-[380px] text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to mark this project as completed? Once marked
          as completed, no further changes can be made.
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-warning-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-warning-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Marking..." : "Okay, Got It"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
