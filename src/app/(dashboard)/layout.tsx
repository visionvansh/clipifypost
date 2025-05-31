import { currentUser } from "@clerk/nextjs/server";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  return (
    <div className="h-screen flex">
      {/* LEFT SIDEBAR */}
    

      {/* RIGHT CONTENT */}
      <div className={`flex-1 bg-[#F7F8FA] overflow-scroll flex flex-col ${!user || !role ? 'w-full' : ''}`}>
        {user && role ? <Navbar /> : null}
        {children}
      </div>
    </div>
  );
}