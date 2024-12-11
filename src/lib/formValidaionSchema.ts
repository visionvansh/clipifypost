import { date, optional, z } from "zod";

export const positionSchema = z.object({
  id: z.coerce.number().optional(),
  position: z.string().min(1, { message: "Position should be there!" }),
  bonus: z.string().min(1, {message: "Bonus is required, if there is no bonus just type No Bonus!"}),
  accounts: z.string().min(1, {message: "Account Is Required"}), //teacher ids
  name : z.string().min(1, {message:"Name is required"}),
  teacherId : z.string().optional(),
  studentId : z.string().optional(),
  parentId :  z.string().optional()
});

export type PositionSchema = z.infer<typeof positionSchema>;

export const socialProfilesSchema = z.object({
  id: z.coerce.number().optional(),
  
  socialProfiles: z.string().min(1, { message: "Social Profile Is required!" }),
  views: z.coerce.string().min(1, { message: "Views is required!" }),
  belongsTo: z.coerce.string().min(1, { message: "It should be belonging to anyone!" }),
  status: z.coerce.string(),
});

export type SocialProfilesSchema = z.infer<typeof socialProfilesSchema>;

export const managerSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  img: z.string(),
  accounts: z.string().min(1, { message: "User must have one social account!" }),
  platform: z.string().min(1,{ message: "Platform Is Necessary" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  createdAt : z.coerce.date(),
  attendence: z.array(z.unknown()).default([]),
  result: z.array(z.unknown()).default([]),
  assignment: z.array(z.unknown()).default([]),
  class: z.array(z.unknown()).default([]),
});

export type ManagerSchema = z.infer<typeof managerSchema>;

export const userSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .or(z.literal(""))
    .optional(),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  img: z.string(),
  accounts: z.string().min(1, { message: "User must have one social account!" }),
  platform: z.string().min(1,{ message: "Platform Is Necessary" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  createdAt : z.coerce.date()
});

export type UserSchema = z.infer<typeof userSchema>;

export const newUserSchema = z.object({
    id: z.string().optional(),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long!" })
      .max(20, { message: "Username must be at most 20 characters long!" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long!" })
      .or(z.literal("")),
    name: z.string().min(1, { message: "First name is required!" }),
    surname: z.string().min(1, { message: "Last name is required!" }),
    email: z
      .string()
      .email({ message: "Invalid email address!" })
      .or(z.literal("")),
    phone: z.string(),
    address: z.string(),
    img: z.string(),
    accounts: z.string().min(1, { message: "User must have one social account!" }),
    platform: z.string().min(1,{ message: "Platform Is Necessary" }),
    sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  });
  
  export type NewUserSchema = z.infer<typeof newUserSchema>;

export const pasteLinkSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Title name is required!" }),
  spreadsheetLink: z.string().min(1,{ message: "Please add spreadsheet link!" }),
});

export type PasteLinkSchema = z.infer<typeof pasteLinkSchema>;


export const addSocialProfilesSchema = z.object({
    id: z.coerce.number().optional(),
    profileLink: z.string().min(1, { message: "Title name is required!" }),
    teacherId: z.string().optional(),
    studentId: z.string().optional(),
    parentId: z.string().optional(),
  });
  
  export type AddSocialProfilesSchema = z.infer<typeof addSocialProfilesSchema>;

  export const revenueSchema = z.object({
    id: z.coerce.number().optional(),
    socialAccountName: z.string().min(1, { message: "Account name is required!" }),
    nameOfPerson: z.string().min(1, { message: "Name of person is required!" }),
    revenue: z.coerce.number().min(1,{message:"Views should be there if not then put 0"}),
    teacherId: z.string().optional(),
    studentId: z.string().optional(),
    parentId: z.string().optional(),
  });
  
  export type RevenueSchema = z.infer<typeof revenueSchema>;

  export const announcementSchema = z.object({
    id: z.coerce.number().optional(),
    title: z.string().min(1, { message: "Title is required!" }),
    description: z.string().min(1, { message: "Description is required!" }),
    date: z.coerce.date()
  });
  
  export type AnnouncementSchema = z.infer<typeof announcementSchema>;

  export const viewsSchema = z.object({
    id: z.coerce.number().optional(),
    socialAccountName: z.string().min(1, { message: "Title is required!" }),
    nameOfPerson: z.string().min(1, { message: "Description is required!" }),
    views: z.coerce.number().gte(-1, 'Value should be above -1'),
    teacherId: z.string().optional(),
    studentId: z.string().optional(),
    parentId: z.string().optional(),
  });
  
  export type ViewsSchema = z.infer<typeof viewsSchema>;