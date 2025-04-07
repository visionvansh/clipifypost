import prisma from "@/lib/prisma";
import { verifyAccount } from "@/lib/adminActions";
import { revalidatePath } from "next/cache";
import Image from "next/image";

async function getAccounts(userId: string, companyId: number) {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      instagramLink: true,
      verificationCode: true,
      isVerified: true,
      status: true,
      clips: {
        select: {
          companyId: true,
        },
      },
    },
  });

  const filteredAccounts = accounts.filter((account) =>
    account.clips.some((clip) => clip.companyId === companyId)
  );

  return filteredAccounts;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { userId: string; companyId: string };
}) {
  const { userId, companyId } = searchParams;
  if (!userId || !companyId)
    return <div className="text-[#e0e0e0] bg-[#1a1a1a] p-6">Missing params</div>;

  const accounts = await getAccounts(userId, parseInt(companyId));

  async function handleVerifyAccount(formData: FormData) {
    "use server";
    const accountId = parseInt(formData.get("accountId") as string);
    const isVerified = formData.get("isVerified") === "true";
    await verifyAccount(accountId, isVerified);
    revalidatePath("/list/checking/companies/accounts");
  }

  // Function to extract username from Instagram link
  const extractUsername = (link: string) => {
    try {
      const url = new URL(link);
      const pathSegments = url.pathname.split("/").filter((seg) => seg);
      return pathSegments[0] || link; // Return first segment after / or original link if invalid
    } catch (e) {
      return link; // Fallback to original link if URL parsing fails
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        {/* TOP */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-300">
              Accounts Overview 📱
            </h1>
            {/* Breadcrumb Navigation */}
            <div className="text-sm text-gray-400">
              <a
                href="/list/checking"
                className="text-blue-400 hover:underline"
              >
                Users
              </a>{" "}
              /{" "}
              <a
                href={`/list/checking/companies?userId=${userId}`}
                className="text-blue-400 hover:underline"
              >
                Companies
              </a>{" "}
              / <span className="text-white font-medium">Accounts</span>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto mt-4 bg-gray-800 rounded-lg shadow">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-700 text-gray-300 text-sm uppercase">
              <tr>
                <th className="p-4">Instagram</th>
                <th className="p-4">Verification Code</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all"
                >
                  <td className="p-4 text-gray-200">
                    {extractUsername(account.instagramLink)} {/* Username dikhayega */}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.verificationCode}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.status ?? "undefined"}
                  </td>
                  <td className="p-4 text-gray-200">
                    {!account.isVerified &&
                    (!account.status ||
                      account.status.trim().toLowerCase() === "pending" ||
                      account.status.trim().toLowerCase() ===
                        "awaiting bio update") ? (
                      <div className="flex gap-2">
                        <form action={handleVerifyAccount}>
                          <input
                            type="hidden"
                            name="accountId"
                            value={account.id}
                          />
                          <input
                            type="hidden"
                            name="isVerified"
                            value="true"
                          />
                          <button className="bg-green-600 px-3 py-1 rounded-md text-white hover:bg-green-500 text-sm">
                            ✅ Verify
                          </button>
                        </form>
                        <form action={handleVerifyAccount}>
                          <input
                            type="hidden"
                            name="accountId"
                            value={account.id}
                          />
                          <input
                            type="hidden"
                            name="isVerified"
                            value="false"
                          />
                          <button className="bg-red-600 px-3 py-1 rounded-md text-white hover:bg-red-500 text-sm">
                            ❌ Decline
                          </button>
                        </form>
                      </div>
                    ) : account.isVerified ? (
                      <a
                        href={`/list/checking/companies/accounts/links?accountId=${account.id}`}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Links
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-6 text-gray-400 text-sm"
                  >
                    No accounts found for this user and company.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}