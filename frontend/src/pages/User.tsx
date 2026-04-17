import { useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AngleDownIcon,
  AngleUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashBinIcon,
} from "../icons";

type User = {
  id: number;
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: string; // ISO for sorting
  salary: number;
};

const users: User[] = [
  { id: 1, name: "Abram Schleifer", position: "Sales Assistant", office: "Edinburgh", age: 57, startDate: "2027-04-25", salary: 89500 },
  { id: 2, name: "Charlotte Anderson", position: "Marketing Manager", office: "London", age: 42, startDate: "2025-03-12", salary: 105000 },
  { id: 3, name: "Ethan Brown", position: "Software Engineer", office: "San Francisco", age: 30, startDate: "2024-01-01", salary: 120000 },
  { id: 4, name: "Isabella Davis", position: "UI/UX Designer", office: "Austin", age: 29, startDate: "2025-07-18", salary: 92000 },
  { id: 5, name: "James Wilson", position: "Data Analyst", office: "Chicago", age: 28, startDate: "2025-09-20", salary: 80000 },
  { id: 6, name: "Liam Moore", position: "DevOps Engineer", office: "Boston", age: 33, startDate: "2024-10-30", salary: 115000 },
  { id: 7, name: "Mia Garcia", position: "Content Strategist", office: "Denver", age: 27, startDate: "2027-12-12", salary: 70000 },
  { id: 8, name: "Olivia Johnson", position: "HR Specialist", office: "Los Angeles", age: 40, startDate: "2026-11-08", salary: 75000 },
  { id: 9, name: "Sophia Martinez", position: "Product Manager", office: "New York", age: 35, startDate: "2026-06-15", salary: 95000 },
  { id: 10, name: "William Smith", position: "Financial Analyst", office: "Seattle", age: 38, startDate: "2026-02-03", salary: 88000 },
  { id: 11, name: "Noah Clark", position: "Backend Engineer", office: "Toronto", age: 31, startDate: "2024-05-22", salary: 110000 },
  { id: 12, name: "Emma Rodriguez", position: "QA Engineer", office: "Miami", age: 26, startDate: "2025-02-14", salary: 72000 },
  { id: 13, name: "Lucas Hernandez", position: "Mobile Developer", office: "Madrid", age: 34, startDate: "2023-08-09", salary: 98000 },
  { id: 14, name: "Amelia Lee", position: "Data Scientist", office: "Singapore", age: 32, startDate: "2024-11-11", salary: 130000 },
  { id: 15, name: "Benjamin Wright", position: "Security Engineer", office: "Berlin", age: 39, startDate: "2022-06-30", salary: 125000 },
];

type SortKey = keyof Omit<User, "id">;
type SortDir = "asc" | "desc";

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "User" },
  { key: "position", label: "Position" },
  { key: "office", label: "Office" },
  { key: "age", label: "Age" },
  { key: "startDate", label: "Start Date" },
  { key: "salary", label: "Salary" },
];

const pageSizeOptions = [10, 25, 50, 100];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSalary(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export default function UserPage() {
  const [rows, setRows] = useState<User[]>(users);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.position, r.office, String(r.age), formatDate(r.startDate), formatSalary(r.salary)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(startIdx, startIdx + pageSize);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleDelete = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [currentPage, totalPages]);

  return (
    <div>
      <PageMeta title="Users | Tally" description="User data table" />
      <PageBreadcrumb pageTitle="Users" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-white/[0.05]">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Data Table 2</h3>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <span>entries</span>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.04175 2.66675C4.62051 2.66675 2.66675 4.62051 2.66675 7.04175C2.66675 9.46299 4.62051 11.4167 7.04175 11.4167C8.14248 11.4167 9.14641 11.0109 9.91378 10.3445L12.9512 13.382C13.2441 13.6749 13.719 13.6749 14.0119 13.382C14.3048 13.0891 14.3048 12.6143 14.0119 12.3214L10.9744 9.28383C11.6408 8.51647 12.0467 7.51254 12.0467 6.41181C12.0467 3.99057 10.093 2.66675 7.04175 2.66675ZM4.16675 7.04175C4.16675 5.44893 5.44893 4.16675 7.04175 4.16675C8.63457 4.16675 10.5467 5.44893 10.5467 7.04175C10.5467 8.63457 9.26449 9.91675 7.67167 9.91675C6.07885 9.91675 4.16675 8.63457 4.16675 7.04175Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900/40">
              <TableRow>
                {columns.map((col) => {
                  const isActive = sortKey === col.key;
                  return (
                    <TableCell
                      key={col.key}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide"
                      >
                        {col.label}
                        <span className="flex flex-col">
                          <AngleUpIcon
                            className={`h-2 w-2 ${
                              isActive && sortDir === "asc" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                          <AngleDownIcon
                            className={`h-2 w-2 ${
                              isActive && sortDir === "desc" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        </span>
                      </button>
                    </TableCell>
                  );
                })}
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wide dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No matching records found
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm font-medium dark:text-white/90">
                      {u.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {u.position}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {u.office}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {u.age}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {formatDate(u.startDate)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {formatSalary(u.salary)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          className="text-gray-400 transition-colors hover:text-error-500"
                          aria-label={`Delete ${u.name}`}
                        >
                          <TrashBinIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-400 transition-colors hover:text-brand-500"
                          aria-label={`Edit ${u.name}`}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${
                    n === currentPage
                      ? "bg-brand-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total === 0
              ? "Showing 0 entries"
              : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, total)} of ${total} entries`}
          </p>
        </div>
      </div>
    </div>
  );
}
