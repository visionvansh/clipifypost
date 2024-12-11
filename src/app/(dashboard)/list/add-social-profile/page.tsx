
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Assignment, Teacher, Student, Parent } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import FormModal from "@/components/FormModal";

type AssignmentList = Assignment & { teacher: Teacher } & {student: Student} & {parent: Parent};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const { userId,sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const currentUserId = userId
const columns = [
  {
    header: "Add Social Profile Link",
    accessor: "name",
  },
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: AssignmentList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.profileLink} </td>
   
    <td>
      <div className="flex items-center gap-2">
        {(role === "admin" || role === "manager" ) && (
          <>
            <FormContainer table="addSocialProfile" type="update" data={item} />
            <FormContainer table="addSocialProfile" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.AssignmentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "manager":
            query.id = parseInt(value);
            break;
          
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
      query.teacherId = currentUserId!;
      break;
      case "users":
        query.studentId = currentUserId!;
        case "new-users":
          query.parentId = currentUserId!;
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
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Submit Your Social Profile Link Here</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "manager" || role==="users" || role==="new-users") && (
              <FormContainer table="addSocialProfile" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;
