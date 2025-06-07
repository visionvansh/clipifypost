import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // Await params
    const { name, description, moreDetails, rate, image, status } = await request.json();
    const data: any = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (moreDetails !== undefined) data.moreDetails = moreDetails;
    if (rate) data.rate = rate;
    if (image) data.image = image;
    if (status && ["Active", "Stopped"].includes(status)) data.status = status;

    const company = await prisma.company.update({
      where: { id: parseInt(id) }, // Use awaited id
      data,
    });

    return NextResponse.json(company, { status: 200 });
  } catch (error: any) {
    console.error("Update promotion error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // Await params
    await prisma.company.delete({
      where: { id: parseInt(id) }, // Use awaited id
    });
    return NextResponse.json({ message: "Promotion deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete company error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}