import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function AddCompanyPage() {
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    return redirect("/sign-in");
  }

  async function handleSubmit(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const rate = formData.get("rate") as string;
    const image = formData.get("image") as string;
    const tutorialDriveLink = formData.get("tutorialDriveLink") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;
    const description = formData.get("description") as string;
    const contentLink = formData.get("contentLink") as string;

    if (!name || !rate || !image || !tutorialDriveLink || !thumbnailUrl || !description || !contentLink) {
      throw new Error("Saare fields bharo bhai!");
    }

    await prisma.company.create({
      data: {
        name,
        rate,
        image,
        tutorialVideo: tutorialDriveLink,
        thumbnailUrl,
        description,
        contentLink,
      },
    });

    redirect("/list/paste-link");
  }

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-wide font-[Poppins] mb-6">
          📦 Add Company
        </h1>

        <form
          action={handleSubmit}
          className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700"
        >
          <div className="mb-4">
            <label htmlFor="name" className="text-gray-100 text-sm font-semibold mb-1 block">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Company X"
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="rate" className="text-gray-100 text-sm font-semibold mb-1 block">
              Rate
            </label>
            <input
              type="text"
              id="rate"
              name="rate"
              placeholder="₹5000"
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="image" className="text-gray-100 text-sm font-semibold mb-1 block">
              Logo URL
            </label>
            <input
              type="url"
              id="image"
              name="image"
              placeholder="https://example.com/logo.png"
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="tutorialDriveLink" className="text-gray-100 text-sm font-semibold mb-1 block">
              Tutorial Drive Link
            </label>
            <input
              type="url"
              id="tutorialDriveLink"
              name="tutorialDriveLink"
              placeholder="https://drive.google.com/file/d/xyz/view"
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="thumbnailUrl" className="text-gray-100 text-sm font-semibold mb-1 block">
              Thumbnail URL (Google Drive ya koi aur)
            </label>
            <input
              type="url"
              id="thumbnailUrl"
              name="thumbnailUrl"
              placeholder="https://drive.google.com/thumbnail?id=abc"
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="text-gray-100 text-sm font-semibold mb-1 block">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Promotion details..."
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm h-20 resize-none"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contentLink" className="text-gray-100 text-sm font-semibold mb-1 block">
              Content Link
            </label>
            <input
              type="url"
              id="contentLink"
              name="contentLink"
              placeholder="https://drive.google.com/..."
              className="w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-600 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-2 rounded-md shadow-lg hover:from-red-700 hover:to-red-900 transition-all text-sm"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
