import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    { header: "Info", accessor: "info", className: "min-w-[200px]" },
    { header: "Manager ID", accessor: "managerId", className: "min-w-[150px]" },
    { header: "Accounts", accessor: "accounts", className: "min-w-[150px]" },
    { header: "Platform", accessor: "platform", className: "min-w-[150px]" },
    { header: "Phone", accessor: "phone", className: "min-w-[150px]" },
    { header: "Country", accessor: "country", className: "min-w-[150px]" },
    ...(role === "admin"
      ? [{ header: "Actions", accessor: "action", className: "min-w-[100px]" }]
      : []),
  ];

  const renderRow = (item: Teacher) => (
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
      <td className="min-w-[150px] text-gray-400">{item.id}</td>
      <td className="min-w-[150px] text-gray-400">{item.accounts}</td>
      <td className="min-w-[150px] text-gray-400">{item.platform}</td>
      <td className="min-w-[150px] text-gray-400">{item.phone}</td>
      <td className="min-w-[150px] text-gray-400">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="users" type="delete" />
              <FormContainer table="users" type="update" />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.TeacherWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && key === "search") {
        query.name = { contains: value, mode: "insensitive" };
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
  ]);

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
