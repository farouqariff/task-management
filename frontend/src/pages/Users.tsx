import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import DataTable, { Column } from "../components/tables/DataTable/DataTable";

interface UserRow {
  id: number;
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: string;
  startDateISO: string;
  salary: number;
}

const salaryFormatter = new Intl.NumberFormat("en-US");

const formatSalary = (salary: number) => `$${salaryFormatter.format(salary)}`;

const usersData: UserRow[] = [
  {
    id: 1,
    name: "Abram Schleifer",
    position: "Sales Assistant",
    office: "Edinburgh",
    age: 57,
    startDate: "25 Apr, 2027",
    startDateISO: "2027-04-25",
    salary: 89500,
  },
  {
    id: 2,
    name: "Abram Schleifer",
    position: "Sales Assistant",
    office: "Edinburgh",
    age: 57,
    startDate: "25 Apr, 2027",
    startDateISO: "2027-04-25",
    salary: 89500,
  },
  {
    id: 3,
    name: "Abram Schleifer",
    position: "Sales Assistant",
    office: "Edinburgh",
    age: 57,
    startDate: "25 Apr, 2027",
    startDateISO: "2027-04-25",
    salary: 89500,
  },
  {
    id: 4,
    name: "Carla George",
    position: "Sales Assistant",
    office: "London",
    age: 45,
    startDate: "11 May, 2027",
    startDateISO: "2027-05-11",
    salary: 15500,
  },
  {
    id: 5,
    name: "Carla George",
    position: "Sales Assistant",
    office: "London",
    age: 45,
    startDate: "11 May, 2027",
    startDateISO: "2027-05-11",
    salary: 15500,
  },
  {
    id: 6,
    name: "Carla George",
    position: "Sales Assistant",
    office: "London",
    age: 45,
    startDate: "11 May, 2027",
    startDateISO: "2027-05-11",
    salary: 15500,
  },
  {
    id: 7,
    name: "Ekstrom Bothman",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 53,
    startDate: "15 Nov, 2027",
    startDateISO: "2027-11-15",
    salary: 19200,
  },
  {
    id: 8,
    name: "Ekstrom Bothman",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 53,
    startDate: "15 Nov, 2027",
    startDateISO: "2027-11-15",
    salary: 19200,
  },
  {
    id: 9,
    name: "Ekstrom Bothman",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 53,
    startDate: "15 Nov, 2027",
    startDateISO: "2027-11-15",
    salary: 19200,
  },
  {
    id: 10,
    name: "Emery Culhane",
    position: "Sales Assistant",
    office: "New York",
    age: 45,
    startDate: "29 Jun, 2027",
    startDateISO: "2027-06-29",
    salary: 23500,
  },
  {
    id: 11,
    name: "Emery Culhane",
    position: "Sales Assistant",
    office: "New York",
    age: 45,
    startDate: "29 Jun, 2027",
    startDateISO: "2027-06-29",
    salary: 23500,
  },
  {
    id: 12,
    name: "Emery Culhane",
    position: "Sales Assistant",
    office: "New York",
    age: 45,
    startDate: "29 Jun, 2027",
    startDateISO: "2027-06-29",
    salary: 23500,
  },
  {
    id: 13,
    name: "Francesca Piper",
    position: "Software Engineer",
    office: "Tokyo",
    age: 31,
    startDate: "12 Feb, 2027",
    startDateISO: "2027-02-12",
    salary: 72400,
  },
  {
    id: 14,
    name: "Francesca Piper",
    position: "Software Engineer",
    office: "Tokyo",
    age: 31,
    startDate: "12 Feb, 2027",
    startDateISO: "2027-02-12",
    salary: 72400,
  },
  {
    id: 15,
    name: "Francesca Piper",
    position: "Software Engineer",
    office: "Tokyo",
    age: 31,
    startDate: "12 Feb, 2027",
    startDateISO: "2027-02-12",
    salary: 72400,
  },
  {
    id: 16,
    name: "Gemma Thornton",
    position: "Marketing Lead",
    office: "Berlin",
    age: 38,
    startDate: "03 Sep, 2027",
    startDateISO: "2027-09-03",
    salary: 61200,
  },
  {
    id: 17,
    name: "Gemma Thornton",
    position: "Marketing Lead",
    office: "Berlin",
    age: 38,
    startDate: "03 Sep, 2027",
    startDateISO: "2027-09-03",
    salary: 61200,
  },
  {
    id: 18,
    name: "Gemma Thornton",
    position: "Marketing Lead",
    office: "Berlin",
    age: 38,
    startDate: "03 Sep, 2027",
    startDateISO: "2027-09-03",
    salary: 61200,
  },
  {
    id: 19,
    name: "Harvey Morales",
    position: "Product Designer",
    office: "Sydney",
    age: 29,
    startDate: "18 Jan, 2027",
    startDateISO: "2027-01-18",
    salary: 54800,
  },
  {
    id: 20,
    name: "Harvey Morales",
    position: "Product Designer",
    office: "Sydney",
    age: 29,
    startDate: "18 Jan, 2027",
    startDateISO: "2027-01-18",
    salary: 54800,
  },
  {
    id: 21,
    name: "Harvey Morales",
    position: "Product Designer",
    office: "Sydney",
    age: 29,
    startDate: "18 Jan, 2027",
    startDateISO: "2027-01-18",
    salary: 54800,
  },
  {
    id: 22,
    name: "Isla Redmond",
    position: "Finance Analyst",
    office: "Toronto",
    age: 41,
    startDate: "07 Jul, 2027",
    startDateISO: "2027-07-07",
    salary: 48900,
  },
  {
    id: 23,
    name: "Isla Redmond",
    position: "Finance Analyst",
    office: "Toronto",
    age: 41,
    startDate: "07 Jul, 2027",
    startDateISO: "2027-07-07",
    salary: 48900,
  },
  {
    id: 24,
    name: "Isla Redmond",
    position: "Finance Analyst",
    office: "Toronto",
    age: 41,
    startDate: "07 Jul, 2027",
    startDateISO: "2027-07-07",
    salary: 48900,
  },
  {
    id: 25,
    name: "Jonah Reyes",
    position: "QA Engineer",
    office: "Singapore",
    age: 34,
    startDate: "22 Oct, 2027",
    startDateISO: "2027-10-22",
    salary: 42700,
  },
  {
    id: 26,
    name: "Jonah Reyes",
    position: "QA Engineer",
    office: "Singapore",
    age: 34,
    startDate: "22 Oct, 2027",
    startDateISO: "2027-10-22",
    salary: 42700,
  },
  {
    id: 27,
    name: "Jonah Reyes",
    position: "QA Engineer",
    office: "Singapore",
    age: 34,
    startDate: "22 Oct, 2027",
    startDateISO: "2027-10-22",
    salary: 42700,
  },
  {
    id: 28,
    name: "Kira Novak",
    position: "HR Manager",
    office: "Dublin",
    age: 47,
    startDate: "30 Mar, 2027",
    startDateISO: "2027-03-30",
    salary: 58300,
  },
  {
    id: 29,
    name: "Kira Novak",
    position: "HR Manager",
    office: "Dublin",
    age: 47,
    startDate: "30 Mar, 2027",
    startDateISO: "2027-03-30",
    salary: 58300,
  },
  {
    id: 30,
    name: "Kira Novak",
    position: "HR Manager",
    office: "Dublin",
    age: 47,
    startDate: "30 Mar, 2027",
    startDateISO: "2027-03-30",
    salary: 58300,
  },
];

const columns: Column<UserRow>[] = [
  {
    key: "name",
    header: "User",
    sortable: true,
    accessor: (row) => row.name,
    render: (row) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.name}
      </span>
    ),
  },
  {
    key: "position",
    header: "Position",
    sortable: true,
    accessor: (row) => row.position,
  },
  {
    key: "office",
    header: "Office",
    sortable: true,
    accessor: (row) => row.office,
  },
  {
    key: "age",
    header: "Age",
    sortable: true,
    accessor: (row) => row.age,
  },
  {
    key: "startDate",
    header: "Start date",
    sortable: true,
    accessor: (row) => row.startDateISO,
    render: (row) => row.startDate,
  },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    accessor: (row) => row.salary,
    render: (row) => formatSalary(row.salary),
  },
];

export default function Users() {
  const handleEdit = (row: UserRow) => {
    console.log("edit user", row.id);
  };

  const handleDelete = (row: UserRow) => {
    console.log("delete user", row.id);
  };

  const handleAddUser = () => {
    console.log("add new user");
  };

  return (
    <>
      <PageMeta
        title="Users | Tally Task Management"
        description="Users directory — search, sort, and manage team members."
      />
      <PageBreadcrumb pageTitle="Users" />
      <DataTable<UserRow>
        data={usersData}
        columns={columns}
        searchable={(row) =>
          `${row.name} ${row.position} ${row.office} ${row.age} ${row.startDate} ${row.salary}`
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Add New User"
        onAdd={handleAddUser}
      />
    </>
  );
}
