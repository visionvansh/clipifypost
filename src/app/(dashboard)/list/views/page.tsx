import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Attendance } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

const ViewsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Name Of Person",
      accessor: "nameOfPerson",
      className: "min-w-[200px] px-4 py-2 text-left font-bold",
    },
    {
      header: "Social Account Name",
      accessor: "socialAccountName",
      className: "min-w-[150px] px-4 py-2 text-left font-bold",
    },
    {
      header: "Views",
      accessor: "views",
      className: "min-w-[150px] px-4 py-2 text-left font-bold",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
            className: "min-w-[100px] px-4 py-2 text-left font-bold",
          },
        ]
      : []),
  ];

  const renderRow = (item: Attendance) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="px-4 py-2">{item.nameOfPerson}</td>
      <td className="px-4 py-2">{item.socialAccountName}</td>
      <td className="px-4 py-2">{item.views}</td>
      {role === "admin" && (
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <FormContainer table="views" type="update" data={item} />
            <FormContainer table="views" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AttendanceWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.nameOfPerson = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: query,
      include: { teacher: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.attendance.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-1">
          Views You Have Made Till Now 👀
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="views" type="create" />}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse border-spacing-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`bg-gray-100 ${col.className}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map((item) => renderRow(item))}</tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ViewsListPage;
