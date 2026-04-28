import { useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import DataTable, { Column } from "../components/tables/DataTable/DataTable";
import { auditApi, type AuditLogItem } from "../services/api";
import { LoadingIcon } from "../icons";

const columns: Column<AuditLogItem>[] = [
  {
    key: "user_email",
    header: "User",
    sortable: true,
    accessor: (row) => row.user_email ?? "",
  },
  {
    key: "action",
    header: "Action",
    sortable: true,
    accessor: (row) => row.action,
    render: (row) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.action}
      </span>
    ),
  },
  {
    key: "resource_type",
    header: "Resource Type",
    sortable: true,
    accessor: (row) => row.resource_type,
  },
  {
    key: "resource_label",
    header: "Resource",
    sortable: true,
    accessor: (row) => row.resource_label ?? "",
  },
  {
    key: "ip_address",
    header: "IP Address",
    accessor: (row) => row.ip_address ?? "",
  },
  {
    key: "created_at",
    header: "Date",
    sortable: true,
    accessor: (row) => row.created_at,
    render: (row) => <span>{new Date(row.created_at).toLocaleString()}</span>,
  },
];

const searchLog = (row: AuditLogItem) =>
  `${row.user_email ?? ""} ${row.action} ${row.resource_type} ${row.resource_label ?? ""}`;

export default function Log() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    auditApi.list().then((result) => {
      if (result.error) setFetchError(result.error);
      else if (result.data) setLogs(result.data.items);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageMeta
        title="Audit Logs | Tally"
        description="Audit log — track all actions performed in the system."
      />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingIcon className="size-150 animate-spin text-brand-500" />
        </div>
      ) : fetchError ? (
        <div className="py-12 text-center text-sm text-red-500">
          {fetchError}
        </div>
      ) : (
        <DataTable<AuditLogItem>
          data={logs}
          columns={columns}
          searchable={searchLog}
        />
      )}
    </>
  );
}
