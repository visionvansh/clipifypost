import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Student } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Info",
      accessor: "info",
      className: "min-w-[250px]", // Increased width for the Info column
    },
    {
      header: "User ID",
      accessor: "userId",
      className: "min-w-[150px]", // Ensure User ID column has enough space
    },
    {
      header: "Accounts",
      accessor: "accounts",
      className: "min-w-[150px]", // Ensure Accounts column has enough space
    },
    {
      header: "Platform",
      accessor: "platform",
      className: "min-w-[150px]", // Ensure Platform column has enough space
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "min-w-[150px]", // Ensure Phone column has enough space
    },
    {
      header: "Country",
      accessor: "address",
      className: "min-w-[150px]", // Ensure Country column has enough space
    },
    ...(role === "admin"
      ? [
        {
          header: "Actions",
          accessor: "action",
          className: "min-w-[100px]", // Ensure Actions column has enough space
        },
      ]
      : []),
  ];

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        {/* Avatar Section */}
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="min-w-[150px]">{item.id}</td> {/* User ID */}
      <td className="min-w-[150px]">{item.accounts}</td>
      <td className="min-w-[150px]">{item.platform}</td>
      <td className="min-w-[150px]">{item.phone}</td>
      <td className="min-w-[150px]">{item.address}</td>
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

  const query: Prisma.StudentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        {/* Heading Below Search Bar on Mobile */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
            All Users 🌟
          </h1>
          <TableSearch />
        </div>
        <div className="flex items-center gap-4 self-end md:mt-0 mt-4">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/filter.png" alt="" width={14} height={14} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/sort.png" alt="" width={14} height={14} />
          </button>
          {role === "admin" && <FormContainer table="users" type="create" />}
        </div>
      </div>

      {/* LIST */}
      <div className="overflow-x-auto mt-4">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;
