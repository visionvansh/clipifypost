import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Assignment, Teacher, Student, Parent } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type AssignmentList = Assignment & { teacher: Teacher; student: Student; parent: Parent };

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AssignmentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.profileLink = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "manager":
      query.teacherId = userId!;
      break;
    case "users":
      query.studentId = userId!;
      break;
    case "new-users":
      query.parentId = userId!;
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);

  return (
    <div className="bg-gray-900 min-h-screen p-4">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        {/* TOP SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-sm sm:text-lg md:text-2xl font-bold flex items-center gap-2 text-white">
            Submit Your Profile Link Here 📤
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              {(role === "admin" || role === "manager" || role === "users" || role === "new-users") && (
                <FormContainer table="addSocialProfile" type="create" />
              )}
            </div>
          </div>
        </div>

        {/* TABLE LIST */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border border-gray-600 text-white">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3 border border-gray-600 text-left">Profile Link</th>
                {(role === "admin" || role === "manager" || role === "users" || role === "new-users") && (
                  <th className="p-3 border border-gray-600 text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="bg-gray-700 border-b border-gray-600 hover:bg-gray-600">
                  <td className="p-3 border border-gray-600">{item.profileLink || "No Link Provided"}</td>
                  {(role === "admin" || role === "manager" || role === "users" || role === "new-users") && (
                    <td className="p-3 border border-gray-600">
                      <div className="flex gap-2">
                        <FormContainer table="addSocialProfile" type="update" data={item} />
                        <FormContainer table="addSocialProfile" type="delete" id={item.id} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
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

export default AssignmentListPage;
