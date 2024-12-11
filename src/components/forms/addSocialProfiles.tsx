
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { addSocialProfilesSchema, AddSocialProfilesSchema } from "@/lib/formValidaionSchema";
import { useFormState } from "react-dom";
import { createAddSocialProfile, updateAddSocialProfile } from "@/lib/action";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const AddSocialProfileForm = ({
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
  } = useForm<AddSocialProfilesSchema>({
    resolver: zodResolver(addSocialProfilesSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAddSocialProfile : updateAddSocialProfile,
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
        toast.error("Failed to add social profile");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred");
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Social Profile has been ${type === "create" ? "added" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add a new social profile" : "Update the new social profile"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
         Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Profile Link"
          name="profileLink"
          defaultValue={data?.profileLink}
          register={register}
          error={errors.profileLink}
        />
  
      </div>
      
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

export default AddSocialProfileForm;
