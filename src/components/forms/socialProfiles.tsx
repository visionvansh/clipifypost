
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { socialProfilesSchema, SocialProfilesSchema } from "@/lib/formValidaionSchema";
import { useFormState } from "react-dom";
import { createSocialProfiles, updateSocialProfiles } from "@/lib/action";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const SocialProfileForm = ({
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
  } = useForm<SocialProfilesSchema>({
    resolver: zodResolver(socialProfilesSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSocialProfiles : updateSocialProfiles,
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
        toast.error("Failed to save position");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred");
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Social Profiles has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Register a new Social Profile" : "Update the Social Profile"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
         Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Social Profiles"
          name="socialProfiles"
          defaultValue={data?.socialProfiles}
          register={register}
          error={errors.socialProfiles}
        />
        <InputField
          label="Belongs To"
          name="belongsTo"
          defaultValue={data?.belongsTo}
          register={register}
          error={errors.belongsTo}
        />
        <InputField
          label="Status"
          name="status"
          defaultValue={data?.status}
          register={register}
          error={errors.status}
        />
      </div>
      <div className="flex justify-between flex-wrap gap-4">
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

export default SocialProfileForm;
