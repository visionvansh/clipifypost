import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch discordUsername from Student table
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { discordUsername: true },
    });

    // Fetch totalRevenue and totalViews from UserStatsRecord
    const stats = await prisma.userStatsRecord.findMany({
      where: { userId: userId },
      select: { totalRevenue: true, totalViews: true }, // totalViews add kiya
    });

    const revenue = stats.reduce((sum, record) => sum + (record.totalRevenue || 0), 0);
    const views = stats.reduce((sum, record) => sum + (record.totalViews || 0), 0); // totalViews reduce kiya

    return new Response(
      JSON.stringify({
        discordUsername: student?.discordUsername || "Not Connected",
        totalRevenue: revenue,
        totalViews: views, // totalViews API response mein add kiya
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch user data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}