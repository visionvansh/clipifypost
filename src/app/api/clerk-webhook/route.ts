import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Clerk Webhook - Received event:", body);

    if (body.type === "user.created") {
      const clerkUser = body.data;
      const clerkUserId = clerkUser.id;
      const clerkEmail = clerkUser.email_addresses[0].email_address;
      const username = clerkUser.username || `user_${clerkUserId}`;

      // Create new student record
      await prisma.student.create({
        data: {
          id: clerkUserId,
          username,
          email: clerkEmail,
          createdAt: new Date(),
        },
      });
      console.log("Clerk Webhook - Student record created for user:", clerkUserId);
    }

    return new Response(null, { status: 200 });
  } catch (error: any) {
    console.error("Clerk Webhook - Error:", error.message);
    return new Response("Error processing webhook", { status: 500 });
  }
}