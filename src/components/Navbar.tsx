import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";

const Navbar = async () => {
  const user = await currentUser();
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 shadow-md">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-600 px-2 bg-gray-800 text-white">
        <Image src="/search.png" alt="Search" width={14} height={14} />
        <input
          type="text"
          id="seii"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none text-white placeholder-gray-400"
        />
      </div>

      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {/* Message Icon */}
        <div className="bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition">
          <Image src="/message.png" alt="Messages" width={20} height={20} />
        </div>

        {/* Notification Icon */}
        <div className="bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative hover:bg-gray-700 transition">
          <Image src="/announcement.png" alt="Notifications" width={20} height={20} />
          <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs">
            1
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col text-right">
          <span className="text-xs leading-3 font-medium text-white">{user?.username as string}</span>
          <span className="text-[10px] text-gray-400">{user?.publicMetadata.role as string}</span>
        </div>

        {/* User Profile Button */}
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;