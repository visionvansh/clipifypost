import prisma from "@/lib/prisma";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import { auth } from "@clerk/nextjs/server"; // Clerk SDK for auth

async function getStudents() {
  return prisma.student.findMany({
    select: { id: true, username: true, email: true }, // Email bhi fetch karenge
  });
}

export default async function CheckingPage() {
  const students = await getStudents();

  // Clerk se user ka email fetch karne ke liye mapping
  const studentWithEmails = students.map((student) => ({
    ...student,
    email: student.email || "Not Available", // Agar email nahi hai toh fallback
  }));

  const columns = [
    { header: "Email", accessor: "email", className: "min-w-[200px]" }, // User ID ki jagah Email
    { header: "Username", accessor: "username", className: "min-w-[250px]" },
    { header: "Actions", accessor: "actions", className: "min-w-[150px]" },
  ];

  const renderRow = (student: any) => (
    <tr
      key={student.id}
      className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all"
    >
      <td className="text-gray-400 p-4">{student.email}</td>
      <td className="text-gray-300 p-4">{student.username}</td>
      <td>
        <a
          href={`/list/checking/companies?userId=${student.id}`}
          className="text-blue-500 hover:underline"
        >
          View Companies →
        </a>
      </td>
    </tr>
  );

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        {/* Header */}
        <div className="flex flex-col gap-2 w-full mb-4">
          <h1 className="text-2xl font-extrabold tracking-wide text-yellow-400">📋 Checking Page</h1>
          <h2 className="text-lg md:text-xl font-bold text-gray-300">Users</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-md">
          <Table columns={columns} renderRow={renderRow} data={studentWithEmails} />
        </div>

        {/* Optional Pagination */}
        {/* <Pagination page={1} count={students.length} /> */}
      </div>
    </div>
  );
}
