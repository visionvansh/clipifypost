import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BrandsTable from "@/components/BrandsTable";
import PageLoader from "@/components/PageLoader";
import BottomNavBar from "@/components/CompaniesBottomNav";
import { MdBarChart } from "react-icons/md";
import BrandForm from "@/components/BrandForm"; // Import Client Component
import { addBrand } from "@/lib/brandActions"; // Import Server Action

export default async function BrandPage() {
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    return redirect("/sign-in");
  }

  const brands = await prisma.brand.findMany();

  return (
    <PageLoader>
      <div className="bg-[#121212] w-full min-h-screen overflow-y-auto text-gray-200 pb-16">
        <div className="px-4 sm:px-8 md:px-12 lg:px-[30px] py-6">
          <div className="flex items-center justify-center space-x-2 mb-6 animate-fadeIn">
            <span className="text-yellow-500 text-xl md:text-3xl glowing-icon moving-icon mr-2 mb-2">📦</span>
            <h2 className="text-xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text">
              EDITORS HUB MANAGEMENT
            </h2>
           
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-6"></div>
          <div className="flex items-center space-x-2 mt-6 mb-4">
            <MdBarChart className="text-yellow-500 text-2xl md:text-3xl glowing-icon moving-icon" />
            <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white font-poppins">
              ADD PROMO
            </h2>
          </div>
          <BrandForm action={addBrand} />
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-yellow-500 text-xl md:text-3xl glowing-icon moving-icon mr-1">📋</span>
            <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white font-poppins">
              BRAND LIST
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>
          <BrandsTable initialBrands={brands} />
        </div>
        <BottomNavBar />
      </div>
    </PageLoader>
  );
}