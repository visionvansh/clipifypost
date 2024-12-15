import Pagination from "@/components/Pagination";
import Table from "../../../../components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import FormModal from "@/components/FormModal";

const ParentListPage = async ({
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
      className: "min-w-[200px]", // Added min-width for info column
    },
    {
      header: "New User Id",
      accessor: "students",
      className: "min-w-[150px] md:table-cell", // Min-width for id column
    },
    {
      header: "Accounts",
      accessor: "grade",
      className: "min-w-[150px] md:table-cell",
    },
    {
      header: "Platform",
      accessor: "platform",
      className: "min-w-[150px] md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "min-w-[150px] lg:table-cell",
    },
    {
      header: "Country",
      accessor: "address",
      className: "min-w-[200px] lg:table-cell",
    },
    ...(role === "admin" || role === "manager"
      ? [
          {
            header: "Actions",
            accessor: "action",
            className: "min-w-[100px]",
          },
        ]
      : []),
  ];

  const renderRow = (item: Parent) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        {/* Avatar Section */}
        <Image
          src={item.img || "/noAvatar.png"}
          alt="avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="p-2">{item.id}</td>
      <td className="p-2">{item.accounts}</td>
      <td className="p-2">{item.platform}</td>
      <td className="p-2">{item.phone}</td>
      <td className="p-2">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="users" type="update" data={item} />
              <FormModal table="users" type="delete" />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.ParentWhereInput = {};
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
    prisma.parent.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        {/* Heading Below Search Bar on Mobile */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
            New Users 🧑‍💼
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
          {role === "admin" && <FormModal table="users" type="create" />}
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

export default ParentListPage;
