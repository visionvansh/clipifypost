
"use client";

import {
  deteleAnnouncement,
  deleteManager,
  deleteUsers,
  deleteNewUsers,
  deletePosition,
  deleteAddSocialProfile,
  deleteRevenue,
  deleteViews
} from "@/lib/action";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  manager: deleteManager,
  users: deleteUsers,
  newUsers: deleteNewUsers,
  position: deletePosition,

  addSocialProfile: deleteAddSocialProfile,
  revenue: deleteRevenue,
  views: deleteViews,
  announcement: deteleAnnouncement,
};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});


const UserForm = dynamic(() => import("./forms/usersForm"), {
  loading: () => <h1>Loading...</h1>,
});

const NewUserForm = dynamic(() => import("./forms/newUsersForm"), {
  loading: () => <h1>Loading...</h1>,
});

const PositionForm = dynamic(() => import("./forms/PositionForm"), {
  loading: () => <h1>Loading...</h1>,
});

const RevenueForm = dynamic(() => import("./forms/revenueForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ViewsForm = dynamic(() => import("./forms/ViewsForm"), {
  loading: () => <h1>Loading...</h1>,
});

// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  manager: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  users: (setOpen, type, data, relatedData) => (
    <UserForm
      type={type}
      data={data}
      setOpen={setOpen}
  
    />
  ),
  newUsers: (setOpen, type, data, relatedData) => (
    <NewUserForm
      type={type}
      data={data}
      setOpen={setOpen}

    />
  ),
  position: (setOpen, type, data, relatedData) => (
    <PositionForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),




  revenue: (setOpen, type, data, relatedData) => (
    <RevenueForm
      type={type}
      data={data}
      setOpen={setOpen}
   
    />
    // TODO OTHER LIST ITEMS
  ),
  views: (setOpen, type, data, relatedData) => (
    <ViewsForm
      type={type}
      data={data}
      setOpen={setOpen}
    
    />
    
    // TODO OTHER LIST ITEMS
  ),

  // announcement: (setOpen, type, data, relatedData) => (
  //   <AnnouncementForm
  //     type={type}
  //     data={data}
  //     setOpen={setOpen}
    
  //   />
    
  //   // TODO OTHER LIST ITEMS
  // ),
  

};

const FormModal = ({
  table,
  type,
  data,
  id,
 relatedData, 
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="text | number" name="id" value={id} hidden />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
          Delete
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
