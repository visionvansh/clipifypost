import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await params
  const { action, status } = await request.json();
  const parsedId = parseInt(id);

  if (action === "setStatus") {
    await prisma.brand.update({
      where: { id: parsedId },
      data: { status },
    });
    return NextResponse.json({ message: "Status Got Updated" });
  }

  return NextResponse.json({ error: "Action is wrong" }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await params
  const parsedId = parseInt(id);
  await prisma.brand.delete({
    where: { id: parsedId },
  });
  return NextResponse.json({ message: "Promotion Got Deleted" });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await params
  const parsedId = parseInt(id);
  const { name, description, moreDetails, rate } = await request.json();

  console.log("PUT Brand API:", { id: parsedId, name, description, moreDetails: moreDetails?.slice(0, 50), rate });

  if (!name || !description || isNaN(parseFloat(rate))) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    await prisma.brand.update({
      where: { id: parsedId },
      data: {
        name,
        description,
        moreDetails: moreDetails || null,
        rate: parseFloat(rate),
      },
    });
    console.log("Brand Updated:", { id: parsedId, name, moreDetails: moreDetails?.slice(0, 50) });
    return NextResponse.json({ message: "Promotion Details Got Updated" });
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to update brand" }, { status: 500 });
  }
}