import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma, Student } from "@prisma/client";
import Image from "next/image";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

// Extended Student type with extra fields
type StudentWithExtras = Student & {
  email: string;
  username: string;
  instagramUsername: string; // Instagram username from link
  totalViews: number;
  totalRevenue: number;
};

// Function to extract username from Instagram link
const extractInstagramUsername = (link: string): string => {
  const match = link.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return match ? match[1] : "N/A";
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Updated columns to include Email, Account (Instagram Username), Total Views, Total Revenue
  const columns = [
    { header: "Info", accessor: "info", className: "min-w-[200px]" },
    { header: "Username", accessor: "username", className: "min-w-[150px]" },
    { header: "Email", accessor: "email", className: "min-w-[200px]" },
    { header: "Account", accessor: "account", className: "min-w-[150px]" },
    { header: "Total Views", accessor: "totalViews", className: "min-w-[150px]" },
    { header: "Total Revenue", accessor: "totalRevenue", className: "min-w-[150px]" },
    ...(role === "admin"
      ? [{ header: "Actions", accessor: "action", className: "min-w-[100px]" }]
      : []),
  ];

  const renderRow = (item: StudentWithExtras) => (
    <tr
      key={item.id}
      className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-300">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="min-w-[150px] text-gray-400">{item.username}</td>
      <td className="min-w-[200px] text-gray-400">{item.email}</td>
      <td className="min-w-[150px] text-gray-400">{item.instagramUsername}</td>
      <td className="min-w-[150px] text-gray-400">{item.totalViews.toLocaleString()}</td>
      <td className="min-w-[150px] text-gray-400">${item.totalRevenue.toLocaleString()}</td>
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="users" type="delete" />
            <FormContainer table="users" type="update" />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.StudentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && key === "search") {
        query.name = { contains: value, mode: "insensitive" };
      }
    }
  }

  // Fetch students with their accounts, attendance, and results
  const students = await prisma.student.findMany({
    where: query,
    include: {
      accounts: {
        select: { instagramLink: true },
      },
      attendence: {
        select: { views: true },
      },
      result: {
        select: { revenue: true },
      },
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
  });

  // Process data to include total views, total revenue, and Instagram username
  const data: StudentWithExtras[] = students.map((student) => {
    const totalViews = student.attendence.reduce(
      (sum, record) => sum + (parseInt(record.views) || 0),
      0
    );
    const totalRevenue = student.result.reduce(
      (sum, record) => sum + (parseFloat(record.revenue) || 0),
      0
    );
    const instagramLink = student.accounts[0]?.instagramLink || "N/A"; // Take first account's link
    const instagramUsername = extractInstagramUsername(instagramLink);

    return {
      ...student,
      instagramUsername,
      totalViews,
      totalRevenue,
    };
  });

  const count = await prisma.student.count({ where: query });

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        {/* TOP */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-300">
              All Managers 🧑‍💼
            </h1>
            <TableSearch />
          </div>
          <div className="flex items-center gap-4 self-end md:mt-0 mt-4">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-all">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-all">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="users" type="create" />}
          </div>
        </div>

        {/* LIST */}
        <div className="overflow-x-auto mt-4 bg-gray-900 rounded-md">
          <Table columns={columns} renderRow={renderRow} data={data} />
        </div>

        {/* PAGINATION */}
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default TeacherListPage;