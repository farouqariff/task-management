import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  AddIcon,
  AngleDownIcon,
  AngleUpIcon,
  PencilIcon,
  TrashBinIcon,
  ViewIcon,
} from "../../../icons";
import Button from "../../ui/button/Button";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  accessor?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: (row: T) => string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  canEdit?: (row: T) => boolean;
  canDelete?: (row: T) => boolean;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  addButtonLabel?: string;
  onAdd?: () => void;
}

type SortDirection = "asc" | "desc";

export default function DataTable<T>({
  data,
  columns,
  searchable,
  onView,
  onEdit,
  canEdit,
  onDelete,
  canDelete,
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 10,
  addButtonLabel,
  onAdd,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filtered = useMemo(() => {
    if (!search || !searchable) return data;
    const q = search.toLowerCase();
    return data.filter((row) => searchable(row).toLowerCase().includes(q));
  }, [data, search, searchable]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const { totalEntries, totalPages, safePage, startIdx, endIdx, paged } = useMemo(() => {
    const totalEntries = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalEntries);
    const paged = sorted.slice(startIdx, endIdx);
    return { totalEntries, totalPages, safePage, startIdx, endIdx, paged };
  }, [sorted, pageSize, currentPage]);

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Show</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 appearance-none rounded-lg border border-gray-200 bg-transparent pl-3 pr-8 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {pageSizeOptions.map((n) => (
                <option
                  key={n}
                  value={n}
                  className="dark:bg-gray-900 dark:text-gray-300"
                >
                  {n}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <AngleDownIcon className="size-4" />
            </span>
          </div>
          <span>entries</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="size-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          {addButtonLabel && onAdd && (
            <Button
              size="sm"
              variant="primary"
              endIcon={<AddIcon className="size-5" />}
              onClick={onAdd}
            >
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <Table>
          <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-2 text-start font-medium text-gray-700 dark:text-gray-300"
                    >
                      {col.header}
                      <span className="flex flex-col">
                        <AngleUpIcon
                          className={`size-2 ${
                            sortKey === col.key && sortDir === "asc"
                              ? "text-gray-700 dark:text-gray-200"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                        <AngleDownIcon
                          className={`size-2 ${
                            sortKey === col.key && sortDir === "desc"
                              ? "text-gray-700 dark:text-gray-200"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {paged.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, idx) => (
                <TableRow key={startIdx + idx}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300"
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? String(col.accessor(row))
                          : ""}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-3">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(row)}
                            className="text-gray-400 transition-colors hover:text-brand-500"
                            aria-label="View"
                          >
                            <ViewIcon className="size-5" />
                          </button>
                        )}
                        {onEdit && (!canEdit || canEdit(row)) && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="text-gray-400 transition-colors hover:text-brand-500"
                            aria-label="Edit"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                        )}
                        {onDelete && (!canDelete || canDelete(row)) && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="text-gray-400 transition-colors hover:text-error-500"
                            aria-label="Delete"
                          >
                            <TrashBinIcon className="size-5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setCurrentPage(safePage - 1)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:enabled:hover:bg-white/[0.03]"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm transition-colors ${
                  p === safePage
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(safePage + 1)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:enabled:hover:bg-white/[0.03]"
          >
            Next
          </button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {totalEntries === 0 ? 0 : startIdx + 1} to {endIdx} of{" "}
          {totalEntries} entries
        </div>
      </div>
    </div>
  );
}
