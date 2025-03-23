import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Lesson, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    { header: "Social Profiles", accessor: "socialProfiles", className: "min-w-[150px] p-2 text-left" },
    { header: "Belongs To", accessor: "belongsTo", className: "min-w-[150px] p-2 text-left" },
    { header: "Status", accessor: "status", className: "min-w-[100px] p-2 text-left" },
    ...(role === "admin"
      ? [{ header: "Actions", accessor: "action", className: "min-w-[120px] p-2 text-left" }]
      : []),
  ];

  const renderRow = (item: Lesson) => (
    <tr key={item.id} className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all">
      <td className="min-w-[150px] p-2 text-left text-gray-300">{item.socialProfiles}</td>
      <td className="min-w-[150px] p-2 text-left text-gray-300">{item.belongsTo}</td>
      <td className="min-w-[100px] p-2 text-left text-gray-300">{item.status}</td>
      {role === "admin" && (
        <td className="min-w-[120px] p-2 text-left">
          <div className="flex items-center gap-2">
            <FormContainer table="socialProfiles" type="update" data={item} />
            <FormContainer table="socialProfiles" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.LessonWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.socialProfiles = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lesson.count({ where: query }),
  ]);

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        {/* TOP */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-300">
            All Social Profiles <span className="text-base sm:text-lg md:text-2xl">💯</span>
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-all">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-all">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {role === "admin" && <FormContainer table="socialProfiles" type="create" />}
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="overflow-x-auto mt-4 bg-gray-900 rounded-md">
          <table className="w-full border-collapse border-spacing-0">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.header} className={`bg-gray-800 text-gray-300 text-left ${col.className}`}>
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
    </div>
  );
};

export default LessonListPage;
