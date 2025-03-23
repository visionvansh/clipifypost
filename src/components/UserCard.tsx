import prisma from "@/lib/prisma";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "admin" | "manager" | "user" | "newUser";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    manager: prisma.teacher,
    user: prisma.student,
    newUser: prisma.parent,
  };

  const data = await modelMap[type].count();

  // Define card colors based on user type (Dark Theme)
  const colorMap: Record<typeof type, string> = {
    admin: "bg-gray-900 border-red-500 shadow-red-500/30",
    manager: "bg-gray-900 border-blue-500 shadow-blue-500/30",
    user: "bg-gray-900 border-green-500 shadow-green-500/30",
    newUser: "bg-gray-900 border-purple-500 shadow-purple-500/30",
  };

  // Define text colors for year and number
  const textColorMap: Record<typeof type, string> = {
    admin: "text-red-400",
    manager: "text-blue-400",
    user: "text-green-400",
    newUser: "text-purple-400",
  };

  return (
    <div
      className={`rounded-2xl p-6 flex-1 min-w-[130px] border shadow-md ${colorMap[type]} text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg`}
    >
      <div className="flex justify-between items-center">
        <span
          className={`text-[10px] px-3 py-1 rounded-full font-medium ${textColorMap[type]} bg-white/10`}
        >
          2025/26
        </span>
        <Image
          src="/more.png"
          alt="More"
          width={20}
          height={20}
          className="opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        />
      </div>
      <h1 className={`text-4xl font-bold my-4 ${textColorMap[type]}`}>
        {data}
      </h1>
      <h2 className="capitalize text-lg font-medium text-gray-400">{type}s</h2>
    </div>
  );
};

export default UserCard;
