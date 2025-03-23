import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Attendance, Prisma } from "@prisma/client";

const ViewsChart = async ({ type }: { type: "Your View" }) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Initialize query object
  const query: Prisma.AttendanceWhereInput = {};
  query.teacher = {};

  // Adjust query based on role
  switch (role) {
    case "manager":
      query.teacherId = userId!;
      break;
    case "users":
      query.studentId = userId!;
      break;
    case "newUsers":
      query.parentId = userId!;
      break;
    default:
      break;
  }

  // Fetch data from Prisma
  const data = await prisma.attendance.findMany({
    where: query,
    select: { views: true },
  });

  // Calculate total views
  const totalViews = data.reduce((acc, item) => acc + (item.views || 0), 0);

  // Format number with global comma style (100,000 instead of 1,00,000)
  const formattedViews = totalViews.toLocaleString("en-US");

  return (
    <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-md w-full flex flex-col">
      {/* Top Header Row */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] sm:text-xs bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-white font-semibold shadow-md">
          This Month
        </span>
        <Image
          src="/more.png"
          alt="More"
          width={16} 
          height={16} 
          className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer sm:w-[20px] sm:h-[20px]"
        />
      </div>

      {/* Views Count */}
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-blue-400 tracking-wide">
        {formattedViews}
      </h1>

      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-400">
        {type}s
      </h2>
    </div>
  );
};

export default ViewsChart;
