import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CompanyForm from "@/components/CompanyForm";
import CompaniesTable from "@/components/CompaniesTable";
import dynamic from "next/dynamic";
import BottomNavBar from "@/components/CompaniesBottomNav";
import { MdBarChart } from "react-icons/md";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

const PageLoader = dynamic(() => import("@/components/PageLoader"), { ssr: true });

export default async function CompanyPage() {
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    return redirect("/sign-in");
  }

  const companies = await prisma.company.findMany({
    include: { clips: { select: { id: true } } },
  });

  async function addCompany(formData: FormData) {
    "use server";
    try {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const moreDetails = formData.get("moreDetails") as string | null;
      const rate = formData.get("rate") as string;
      const imageFile = formData.get("image") as File;

      console.log("Form Data:", { name, description, moreDetails, rate, imageFile: imageFile?.name });

      if (!name || !description || !rate || !imageFile) {
        throw new Error("Saare fields bharo bhai!");
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("Image size too large! Max 5MB allowed.");
      }

      if (!["image/jpeg", "image/png", "image/gif"].includes(imageFile.type)) {
        throw new Error("Please select a valid image file (JPEG, PNG, GIF)!");
      }

      const existingCompany = await prisma.company.findUnique({
        where: { name },
      });
      if (existingCompany) {
        throw new Error(`Company with name '${name}' already exists!`);
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let imageUrl;
      try {
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "image", public_id: `${Date.now()}-${imageFile.name}` },
              (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) reject(error);
                else resolve(result!);
              }
            )
            .end(buffer);
        });
        imageUrl = uploadResult.secure_url;
        console.log("Cloudinary Upload Success:", imageUrl);
      } catch (cloudinaryError: any) {
        console.error("Cloudinary Upload Error:", cloudinaryError);
        throw new Error(`Image upload failed: ${cloudinaryError.message}`);
      }

      try {
        await prisma.company.create({
          data: {
            name,
            description,
            moreDetails: moreDetails || null, // Ensure null if empty
            rate,
            image: imageUrl,
            status: "Active",
          },
        });
        console.log("Company Created:", { name, imageUrl });
      } catch (prismaError: any) {
        console.error("Prisma Error:", prismaError.message);
        if (prismaError.code === "P2002") {
          throw new Error(`Company with name '${name}' already exists!`);
        }
        throw new Error(`Database error: ${prismaError.message}`);
      }

      return { success: true, redirectTo: "/list/social-profiles/company" };
    } catch (error: any) {
      console.error("Add Company Error:", error.message, error.stack);
      throw new Error(error.message || "Failed to add company");
    }
  }

  return (
    <PageLoader>
      <div className="bg-[#121212] w-full min-h-screen overflow-y-auto text-gray-200 pb-16">
        <div className="px-4 sm:px-8 md:px-12 lg:px-[30px] py-6">
          <div className="flex items-center justify-center space-x-2 mb-6 animate-fade">
            <span className="text-yellow-500 text-xl glowing-icon moving-icon mr-2">🏢</span>
            <h2 className="text-xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text">
              UPLOADERS HUB MANAGEMENT
            </h2>
       
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-6"></div>

          <div className="flex items-center space-x-2 mt-6 mb-4">
            <MdBarChart className="text-xl sm:text-xl md:text-2xl text-yellow-500 glowing-icon moving-icon" />
            <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white font-poppins">
              ADD COMPANY
            </h2>
          </div>

          <CompanyForm action={addCompany} />

          <div className="flex items-center space-x-2 mb-4">
            <span className="text-yellow-500 text-2xl glowing-icon moving-icon mr-2">📋</span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white font-poppins">
              COMPANY LIST
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>

          <CompaniesTable initialCompanies={companies} />
        </div>
        <BottomNavBar />
      </div>
    </PageLoader>
  );
}