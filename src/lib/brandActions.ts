"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function addBrand(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const moreDetails = formData.get("moreDetails") as string | null;
  const rate = parseFloat(formData.get("rate") as string);

  console.log("Add Brand Server Action:", { name, description, moreDetails: moreDetails?.slice(0, 50), rate }); // Debug

  if (!name || !description || isNaN(rate)) {
    throw new Error("Please fill all fieldsi!");
  }

  try {
    await prisma.brand.create({
      data: {
        name,
        description,
        moreDetails: moreDetails || null,
        rate,
        status: "Active",
      },
    });
    console.log("Brand Created:", { name, rate }); // Debug
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    throw new Error(error.message || "Failed to add brand");
  }

  redirect("/list/social-profiles");
}

export async function editBrand(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const moreDetails = formData.get("moreDetails") as string | null;
  const rate = parseFloat(formData.get("rate") as string);

  console.log("Edit Brand Server Action:", { id, name, description, moreDetails: moreDetails?.slice(0, 50), rate }); // Debug

  if (!id || !name || !description || isNaN(rate)) {
    throw new Error("Please fill all fields!");
  }

  try {
    await prisma.brand.update({
      where: { id },
      data: {
        name,
        description,
        moreDetails: moreDetails || null,
        rate,
      },
    });
    console.log("Brand Updated:", { id, name, rate }); // Debug
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    throw new Error(error.message || "Failed to update brand");
  }

  redirect("/list/social-profiles");
}