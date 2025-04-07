import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "manager"
    | "users"
    | "newUsers"
    | "position"
    | "revenue"
    | "views"
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  // Add lazy fetching logic for "teacher" table
  if (table === "manager") {
    // Assuming "manager" is analogous to your "teacher" table
    if (id) {
      // Fetch the teacher data with related fields
      const teacher = await prisma.teacher.findUnique({
        where: { id: id as string },
        include: {
          attendence: true,
          result: true,
          assignment: true,
          class: true,
        },
      });

      relatedData = {
        ...teacher, // Spread teacher data into relatedData
      };
    }
  }

  return (
    <div>
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
