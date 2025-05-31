import { verifyAccount } from "@/lib/adminActions";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import sgMail from '@sendgrid/mail';
import { clerkClient } from '@clerk/nextjs/server';
import Link from "next/link";

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Function to extract username from Instagram link
const extractUsername = (link: string) => {
  try {
    const url = new URL(link);
    const pathSegments = url.pathname.split("/").filter((seg) => seg);
    return pathSegments[0] || link;
  } catch (e) {
    return link;
  }
};

// Server action to set verification code and send email
async function setVerificationCode(formData: FormData) {
  "use server";
  const accountId = parseInt(formData.get("accountId") as string);
  const code = formData.get("code") as string;

  // Validation
  if (!accountId || isNaN(accountId)) {
    throw new Error("Invalid account ID");
  }
  if (!code || code.trim() === "") {
    throw new Error("Code cannot be empty!");
  }
  if (code.length > 50) {
    throw new Error("Code is too long! Maximum 50 characters allowed.");
  }

  // Fetch account
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  // Extract username from Instagram link
  const username = extractUsername(account.instagramLink);

  // Fetch user email from Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(account.userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  if (!userEmail) {
    throw new Error("User email not found");
  }

  // Validate GMAIL_EMAIL
  if (!process.env.GMAIL_EMAIL) {
    throw new Error("GMAIL_EMAIL is not set in environment variables");
  }

  // Update account with verification code and status
  await prisma.account.update({
    where: { id: accountId },
    data: {
      verificationCode: code,
      status: "pending",
    },
  });

  // Send verification email using SendGrid
  const msg = {
    to: userEmail,
    from: process.env.GMAIL_EMAIL,
    subject: 'Your Verification Code',
    text: `This is your verification code for ${username}: ${code}. Please add it to your bio.`,
    html: `<div style="background-color: #fffacd; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
              <img src="https://instagram.fknu1-3.fna.fbcdn.net/v/t51.2885-19/494420827_17865809820379363_7174285822831955811_n.jpg?_nc_ht=instagram.fknu1-3.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2QHvUF_OoVDCrrkvdi5w5zx-P1RxJKxdZfxzkuRt8RIkiyLyBqo4O-WahUr1Pcjekyg&_nc_ohc=83lGUlgVNbQQ7kNvwGOYfXO&_nc_gid=yz8tsVmFdTl2SEwMhxVvgA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfLHT8Omk2_lS3FEdXEK6lMUWdPBgKN1aY-n6ljI8SkCcA&oe=68305EF6&_nc_sid=7a9f4b" alt="Logo" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 0 10px rgba(255,255,0,0.8);">
              <h2 style="color: #000;">Verification Code for ${username}</h2>
              <p style="color: #333;">Please add the following code to your bio:</p>
              <p style="font-size: 18px; font-weight: bold; color: #000; background-color: #fff; padding: 10px; border-radius: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.2);">${code}</p>
              <p style="color: #333;">Thank you!</p>
            </div>`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    // Optionally handle email sending failure
  }

  // Revalidate path
  revalidatePath("/list/checking/companies/accounts");
}

// Function to get accounts
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
      driveLink: true,
      clips: {
        select: {
          companyId: true,
        },
      },
    },
  });

  const accountsWithClipCount = accounts.map((account) => ({
    ...account,
    clipCount: account.clips.filter((clip) => clip.companyId === companyId).length,
  }));

  return accountsWithClipCount;
}

// Server action to handle account verification and send notification emails
async function handleVerifyAccount(formData: FormData): Promise<void> {
  "use server";
  const accountId = parseInt(formData.get("accountId") as string);
  const isVerifiedStr = formData.get("isVerified") as string;
  const isVerified = isVerifiedStr === "true";
  let declineReason = formData.get("declineReason") as string;

  if (!accountId || isNaN(accountId)) {
    throw new Error("Invalid account ID");
  }

  // Call verifyAccount to update verification status
  await verifyAccount(accountId, isVerified);

  // Fetch account details
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  // Extract username from Instagram link
  const username = extractUsername(account.instagramLink);

  // Fetch user email from Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(account.userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  if (!userEmail) {
    throw new Error("User email not found");
  }

  // Validate GMAIL_EMAIL environment variable
  if (!process.env.GMAIL_EMAIL) {
    throw new Error("GMAIL_EMAIL is not set in environment variables");
  }

  // Send email based on verification status
  if (isVerified) {
    // Send verification success email
    const msg = {
      to: userEmail,
      from: process.env.GMAIL_EMAIL,
      subject: 'Your Account Has Been Verified',
      text: `Your account ${username} has been verified.`,
      html: `<div style="background-color: #fffacd; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                <img src="https://instagram.fknu1-3.fna.fbcdn.net/v/t51.2885-19/494420827_17865809820379363_7174285822831955811_n.jpg?_nc_ht=instagram.fknu1-3.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2QHvUF_OoVDCrrkvdi5w5zx-P1RxJKxdZfxzkuRt8RIkiyLyBqo4O-WahUr1Pcjekyg&_nc_ohc=83lGUlgVNbQQ7kNvwGOYfXO&_nc_gid=yz8tsVmFdTl2SEwMhxVvgA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfLHT8Omk2_lS3FEdXEK6lMUWdPBgKN1aY-n6ljI8SkCcA&oe=68305EF6&_nc_sid=7a9f4b" alt="Logo" style="width: 70px; height: 70px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 0 10px rgba(255,255,0,0.8);">
                <h2 style="color: #000;">Account Verified✅</h2>
                <h3 style="color: #333;">Your account ${username} has been verified.</h3>
                <p style="color: #333;">Thank you!</p>
              </div>`,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  } else {
    // Validate decline reason
    if (!declineReason || declineReason.trim() === "") {
      throw new Error("Decline reason cannot be empty");
    }

    // Send decline email with reason
    const msg = {
      to: userEmail,
      from: process.env.GMAIL_EMAIL,
      subject: 'Your Account Has Been Declined',
      text: `Your account ${username} has been declined: ${declineReason}.`,
      html: `<div style="background-color: #fffacd; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                <img src="https://instagram.fknu1-3.fna.fbcdn.net/v/t51.2885-19/494420827_17865809820379363_7174285822831955811_n.jpg?_nc_ht=instagram.fknu1-3.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2QHvUF_OoVDCrrkvdi5w5zx-P1RxJKxdZfxzkuRt8RIkiyLyBqo4O-WahUr1Pcjekyg&_nc_ohc=83lGUlgVNbQQ7kNvwGOYfXO&_nc_gid=yz8tsVmFdTl2SEwMhxVvgA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfLHT8Omk2_lS3FEdXEK6lMUWdPBgKN1aY-n6ljI8SkCcA&oe=68305EF6&_nc_sid=7a9f4b" alt="Logo" style="width: 70px; height: 70px; border-radius: 50%; margin-bottom: 10px; box-shadow: 0 0 10px rgba(255,255,0,0.8);">
                <h2 style="color: #000;">Account Declined❌</h2>
                <h3 style="color: #333;">Your account ${username} has been declined: ${declineReason}.</h3>
                <p style="color: #333;">Please create ticket on discord if you have any questions.</p>
              </div>`,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending decline email:', error);
    }
  }

  // Revalidate path
  revalidatePath("/list/checking/companies/accounts");
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; companyId?: string }>;
}) {
  const { userId, companyId } = await searchParams;
  if (!userId || !companyId || isNaN(parseInt(companyId))) {
    return <div className="text-[#e0e0e0] bg-[#1a1a1a] p-6">Missing or invalid params</div>;
  }

  const accounts = await getAccounts(userId, parseInt(companyId));

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
              <Link
                href="/list/checking"
                className="text-blue-400 hover:underline"
              >
                Users
              </Link>{" "}
              /{" "}
              <Link
                href={`/list/checking/companies?userId=${userId}`}
                className="text-blue-400 hover:underline"
              >
                Companies
              </Link>{" "}
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
                <th className="p-4">Clips Submitted</th>
                <th className="p-4">Analytics Link</th>
                <th className="p-4">Set Code</th>
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
                    {extractUsername(account.instagramLink)}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.verificationCode ?? "N/A"}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.status ?? "undefined"}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.clipCount}
                  </td>
                  <td className="p-4 text-gray-200">
                    {account.driveLink ? (
                      <a
                        href={account.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Analytics
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Not Provided</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-200">
                    {(account.status && account.status.trim().toLowerCase() === "awaiting bio update") || account.verificationCode === null ? (
                      <form
                        action={setVerificationCode}
                        className="flex gap-2 items-center"
                        key={`form-${account.id}`}
                      >
                        <input
                          type="hidden"
                          name="accountId"
                          value={account.id}
                        />
                        <input
                          type="text"
                          name="code"
                          placeholder="Enter code"
                          className="p-1 bg-gray-600 text-gray-200 border border-gray-500 rounded-md focus:outline-none focus:border-blue-400 text-sm w-32"
                          required
                          suppressHydrationWarning
                          key={`input-${account.id}`}
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 px-3 py-1 rounded-md text-white hover:bg-blue-500 text-sm"
                          suppressHydrationWarning
                          key={`button-${account.id}`}
                        >
                          Set Code
                        </button>
                      </form>
                    ) : (
                      <span className="text-gray-400 text-sm">Not Applicable</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-200">
                    {!account.isVerified &&
                    (!account.status ||
                      account.status.trim().toLowerCase() === "pending" ||
                      account.status.trim().toLowerCase() === "awaiting bio update") ? (
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
                          <button
                            className="bg-green-600 px-3 py-1 rounded-md text-white hover:bg-green-500 text-sm"
                            suppressHydrationWarning
                          >
                            ✅ Verify
                          </button>
                        </form>
                        <form action={handleVerifyAccount} className="flex gap-2 items-center">
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
                          <input
                            type="text"
                            name="declineReason"
                            placeholder="Reason"
                            className="p-1 bg-gray-600 text-gray-200 border border-gray-500 rounded-md focus:outline-none focus:border-red-400 text-sm w-32"
                            required
                            suppressHydrationWarning
                          />
                          <button
                            type="submit"
                            className="bg-red-600 px-3 py-1 rounded-md text-white hover:bg-red-500 text-sm"
                            suppressHydrationWarning
                          >
                            ❌ Decline
                          </button>
                        </form>
                      </div>
                    ) : account.isVerified && account.clipCount > 0 ? (
                      <Link
                        href={`/list/checking/companies/accounts/links?accountId=${account.id}&companyId=${companyId}`}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Links
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-6 text-gray-400 text-sm"
                  >
                    No accounts found for this user.
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