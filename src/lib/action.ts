
"use server";

import { revalidatePath } from "next/cache";
import {
    PositionSchema,
    SocialProfilesSchema,
    ManagerSchema,
    UserSchema,
    NewUserSchema,
    PasteLinkSchema,
    AddSocialProfilesSchema,
    RevenueSchema,
    AnnouncementSchema,
    ViewsSchema
} from "./formValidaionSchema";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createPosition = async (
  currentState: CurrentState,
  data: PositionSchema
) => {
  try {
    console.log("Creating position with data:", data)
    await prisma.class.create({
      data: {
        bonus: data.bonus,
        accounts: data.accounts,
        name: data.name,
        position: data.position,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updatePosition = async (
  currentState: CurrentState,
  data: PositionSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data: {
        bonus: data.bonus,
        accounts: data.accounts,
        position: data.position,
        name: data.name,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deletePosition = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createSocialProfiles = async (
  currentState: CurrentState,
  data: SocialProfilesSchema
) => {
  try {
    await prisma.lesson.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSocialProfiles = async (
  currentState: CurrentState,
  data: SocialProfilesSchema
) => {
  try {
    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSocialProfiles = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createManager = async (
  currentState: CurrentState,
  data: ManagerSchema
) => {
  try {
    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"manager"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
        createdAt: data.createdAt,
      },
    });

    // revalidatePath("/list/manager");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateManager = async (
  currentState: CurrentState,
  data: ManagerSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
        createdAt: data.createdAt
      },
    });
    // revalidatePath("/list/manager");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteManager = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await (await clerkClient()).users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createUsers = async (
  currentState: CurrentState,
  data: UserSchema
) => {
  console.log(data);
  try {

    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"users"}
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
        createdAt: data.createdAt
      },
    });

    // revalidatePath("/list/manager");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateUsers = async (
  currentState: CurrentState,
  data: UserSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
        createdAt: data.createdAt,
      },
    });
    revalidatePath("/list/manager");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteUsers = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await (await clerkClient()).users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createNewUsers = async (
  currentState: CurrentState,
  data: NewUserSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }
    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"users"}
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateNewUsers = async (
  currentState: CurrentState,
  data: NewUserSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email ,
        phone: data.phone ,
        address: data.address,
        img: data.img ,
        platform: data.platform,
        sex: data.sex,
        accounts: data.accounts,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteNewUsers = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await (await clerkClient()).users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


export const createPasteLink = async (
  currentState: CurrentState,
  data: PasteLinkSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        id: data.id,
        name: data.name,
        spreadsheetLink: data.spreadsheetLink,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updatePasteLink = async (
  currentState: CurrentState,
  data: PasteLinkSchema
) => {
  try {
    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        id: data.id,
        name: data.name,
        spreadsheetLink: data.spreadsheetLink,
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deletePasteLink = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAddSocialProfile = async (
  currentState: CurrentState,
  data: AddSocialProfilesSchema
) => {
  try {
    await prisma.assignment.create({
      data: {
        id: data.id,
        profileLink: data.profileLink,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAddSocialProfile = async (
  currentState: CurrentState,
  data: AddSocialProfilesSchema
) => {
  try {
    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        id: data.id,
        profileLink: data.profileLink,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAddSocialProfile = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


export const createRevenue = async (
  currentState: CurrentState,
  data: RevenueSchema
) => {
  try {
    await prisma.result.create({
      data: {
        id: data.id,
        socialAccountName: data.socialAccountName,
        nameOfPerson: data.nameOfPerson,
        revenue: data.revenue,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateRevenue = async (
  currentState: CurrentState,
  data: RevenueSchema
) => {
  try {
    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        id: data.id,
        socialAccountName: data.socialAccountName,
        nameOfPerson: data.nameOfPerson,
        revenue: data.revenue,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteRevenue = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.create({
      data: {
        id: data.id,
        title: data.title,
        description : data.description,
        date: data.date
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        id: data.id,
        title: data.title,
        description : data.description,
        
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deteleAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createViews = async (
  currentState: CurrentState,
  data: ViewsSchema
) => {
  try {
    await prisma.attendance.create({
      data: {
        id: data.id,
        socialAccountName: data.socialAccountName,
        nameOfPerson : data.nameOfPerson,
        views: data.views,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateViews = async (
  currentState: CurrentState,
  data: ViewsSchema
) => {
  try {
    await prisma.attendance.update({
      where: {
        id: data.id,
      },
      data: {
        id: data.id,
        socialAccountName: data.socialAccountName,
        nameOfPerson : data.nameOfPerson,
        views: data.views,
        teacherId: data.teacherId || null,
        studentId: data.studentId || null,
        parentId: data.parentId || null
       
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteViews = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.attendance.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};