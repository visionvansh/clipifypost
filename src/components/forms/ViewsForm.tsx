
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { viewsSchema, ViewsSchema } from "@/lib/formValidaionSchema";
import { useFormState } from "react-dom";
import { createViews, updateViews } from "@/lib/action";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const ViewsForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ViewsSchema>({
    resolver: zodResolver(viewsSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createViews : updateViews,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    try {
      console.log("Submitting form data:", formData);
      await formAction(formData);
      
      // Don't check result.error since formAction returns void
      // Instead, rely on the state updates
      if (state.error) {
        toast.error("Failed to save views data");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred");
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Views data has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new views data" : "Update the views data"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
         Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Social Account Name"
          name="socialAccountName"
          defaultValue={data?.socialAccountName}
          register={register}
          error={errors.socialAccountName}
        />
        <InputField
          label="Name Of Person"
          name="nameOfPerson"
          defaultValue={data?.nameOfPerson}
          register={register}
          error={errors.nameOfPerson}
        />
        <InputField
          label="Views"
          name="views"
          defaultValue={data?.views}
          register={register}
          error={errors.views}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Id Section - One id is mandatory 
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Manager Id"
          name="teacherId"
          defaultValue={data?.teacherId}
          register={register}
          error={errors.teacherId}
          
        />
        <InputField
          label="User Id"
          name="studentId"
          defaultValue={data?.studentId}
          register={register}
          error={errors.studentId}
          
        />
        <InputField
          label="New User Id"
          name="parentId"
          defaultValue={data?.parentId}
          register={register}
          error={errors.parentId}
          
        />
        
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ViewsForm;
