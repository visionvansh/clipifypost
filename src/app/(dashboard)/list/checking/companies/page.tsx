import prisma from "@/lib/prisma";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import Link from "next/link";

async function getCompanies(userId: string) {
  // Fetch all companies, regardless of user association
  return await prisma.company.findMany();
}

async function getStudent(userId: string) {
  return prisma.student.findUnique({
    where: { id: userId },
    select: { username: true },
  });
}

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const params = await searchParams; // Await searchParams to fix the error
  const userId = params.userId;
  if (!userId) return <div className="text-[#e0e0e0] bg-[#1a1a1a] p-6">User ID missing</div>;

  const companies = await getCompanies(userId);
  const student = await getStudent(userId);

  // Debug log to check companies
  console.log("CompaniesPage - userId:", userId);
  console.log("CompaniesPage - companies:", companies);

  const columns = [
    { header: "Company Name", accessor: "name", className: "min-w-[250px]" },
    { header: "Actions", accessor: "actions", className: "min-w-[150px]" },
  ];

  const renderRow = (company: any) => (
    <tr
      key={company.id}
      className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all"
    >
      <td className="text-gray-300 p-4">{company.name}</td>
      <td>
        <Link
          href={`/list/checking/companies/accounts?userId=${userId}&companyId=${company.id}`}
          className="text-blue-500 hover:underline"
        >
          View Accounts →
        </Link>
      </td>
    </tr>
  );

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        {/* Header */}
        <div className="flex flex-col gap-2 w-full mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-300">
            Companies for <strong>{student?.username || "User"}</strong> 🏢
          </h1>
          <div className="text-sm text-gray-400 space-x-2">
            <Link href="/list/checking" className="text-blue-500 hover:underline">Users</Link> /
            <span className="text-white"> Companies</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-gray-900 rounded-md">
          {companies.length > 0 ? (
            <Table columns={columns} renderRow={renderRow} data={companies} />
          ) : (
            <div className="text-gray-400 text-center p-6">
              No companies found for this user.
            </div>
          )}
        </div>

        {/* Pagination Placeholder (if needed) */}
        {/* <Pagination page={1} count={companies.length} /> */}
      </div>
    </div>
  );
}