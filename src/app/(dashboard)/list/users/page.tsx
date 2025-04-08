import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma, Student } from "@prisma/client";
import Image from "next/image";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type StudentWithExtras = Student & {
  email: string;
  username: string;
  instagramUsernames: string;
  totalViews: number;
  totalRevenue: number;
};

const extractInstagramUsername = (link: string): string => {
  const match = link.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return match ? match[1] : "";
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    { header: "Info", accessor: "info", className: "min-w-[200px]" },
    { header: "Username", accessor: "username", className: "min-w-[150px]" },
    { header: "Email", accessor: "email", className: "min-w-[200px]" },
    { header: "Account", accessor: "account", className: "min-w-[200px]" },
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
          <h3 className="font-semibold text-gray-300">{item.name || "N/A"}</h3>
          <p className="text-xs text-gray-500">{item.email || "N/A"}</p>
        </div>
      </td>
      <td className="min-w-[150px] text-gray-400">{item.username || "N/A"}</td>
      <td className="min-w-[200px] text-gray-400">{item.email || "N/A"}</td>
      <td className="min-w-[200px] text-gray-400">{item.instagramUsernames}</td>
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

  const students = await prisma.student.findMany({
    where: query,
    include: {
      accounts: { select: { instagramLink: true } },
      attendence: { select: { views: true } },
      result: { select: { revenue: true } },
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
  });

  const data: StudentWithExtras[] = students.map((student) => {
    const totalViews = student.attendence.reduce(
      (sum, record) => sum + (parseInt(record.views) || 0),
      0
    );
    const totalRevenue = student.result.reduce(
      (sum, record) => sum + (parseFloat(record.revenue) || 0),
      0
    );
    const instagramUsernamesList = student.accounts
      .map((account) => extractInstagramUsername(account.instagramLink))
      .filter(Boolean);
    const instagramUsernames =
      instagramUsernamesList.length > 0
        ? instagramUsernamesList.join(", ")
        : student.email || "N/A";

    return {
      ...student,
      instagramUsernames,
      totalViews,
      totalRevenue,
    };
  });

  const count = await prisma.student.count({ where: query });

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        {/* TOP */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h1 className="text-2xl sm:text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-300">
              All Users 🧑‍💼
            </h1>
           
          </div>
          <div className="flex items-center gap-4 self-end md:mt-0 mt-4">
          <TableSearch />
           
          </div>
        </div>

        {/* LIST */}
        <div className="overflow-x-auto mt-4 bg-gray-900 rounded-lg border border-gray-700">
          <Table columns={columns} renderRow={renderRow} data={data} />
        </div>

        {/* PAGINATION */}
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default TeacherListPage;
