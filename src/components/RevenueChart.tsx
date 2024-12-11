import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Attendance, Prisma } from "@prisma/client";

const ViewsChart = async ({ type }: { type: "Your Revenue" }) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Initialize query object
  const query: Prisma.ResultWhereInput = {};
  query.teacher = {}
  // Adjust query based on role
  switch (role) {
    case "manager":
      query.teacherId = userId!; // Assuming Attendance has a teacherId field
      break;

    case "users":
      query.studentId = userId!; // Assuming Attendance has a studentId field
      break;
    
      case "new-users":
        query.parentId = userId!; // Assuming Attendance has a studentId field
        break;  

    default:
      break
  }

  // Fetch data from Prisma
  const data = await prisma.result.findMany({
    where: query,
    select: { revenue: true }, // Adjust based on your schema fields
  });

  // Calculate total views (if applicable)
  const totalViews = data.reduce((acc, item) => acc + (item.revenue || 0), 0);

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          This Month
        </span>
        <Image src="/more.png" alt="More" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">${totalViews}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}</h2>
    </div>
  );
};

export default ViewsChart;
