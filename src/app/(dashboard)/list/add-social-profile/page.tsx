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
          default:
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
    default:
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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    
        <h1 className="text-16px sm:text-xl md:text-2xl font-bold flex items-center gap-2">
        Submit Your Profile Link Here 📤 
          </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "manager" || role==="users" ||  role==="new-users") && (
              <FormContainer table="addSocialProfile" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST ITEMS */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 p-4 rounded-md shadow-sm hover:shadow-lg transition-shadow"
          >
            <h2 className="font-semibold text-md mb-2 text-gray-800">Profile Link</h2>
            <p className="text-sm text-gray-600 mb-4">{item.profileLink || "No Link Provided"}</p>
            <div className="flex justify-between items-center">
              {(role === "admin" || role === "manager" || role==="users" ||  role==="new-users") && (
                <div className="flex gap-2">
                  <FormContainer table="addSocialProfile" type="update" data={item} />
                  <FormContainer table="addSocialProfile" type="delete" id={item.id} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="mt-4">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AssignmentListPage;
