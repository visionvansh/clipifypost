import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

const RevenueChart = async ({ type }: { type: "Your Revenue" }) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Initialize query object
  const query: Prisma.ResultWhereInput = {};
  query.teacher = {};

  // Adjust query based on role
  switch (role) {
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

  // Fetch data from Prisma
  const data = await prisma.result.findMany({
    where: query,
    select: { revenue: true },
  });

  // Calculate total revenue, converting revenue to number
  const totalRevenue = data.reduce((acc, item) => {
    const revenueValue = item.revenue && !isNaN(Number(item.revenue)) ? Number(item.revenue) : 0;
    return acc + revenueValue;
  }, 0);

  // Format revenue number with global comma style and $
  const formattedRevenue = `$${totalRevenue.toLocaleString("en-US")}`;

  return (
    <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-md w-full flex flex-col">
      {/* Top Header Row */}
      <div className="flex justify-between items-center">
        <span className="text-xs sm:text-sm bg-green-600 px-2 sm:px-3 py-1 rounded-full text-white font-semibold shadow-md">
          This Month
        </span>
        <Image
          src="/more.png"
          alt="More"
          width={18}
          height={18}
          className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer sm:w-[22px] sm:h-[22px]"
        />
      </div>

      {/* Revenue Amount */}
      <h1 className="text-xl sm:text-3xl font-bold my-2 sm:my-3 text-green-400 tracking-wide break-words">
        {formattedRevenue}
      </h1>

      <h2 className="capitalize text-sm sm:text-base font-medium text-gray-400">
        {type}
      </h2>
    </div>
  );
};

export default RevenueChart;