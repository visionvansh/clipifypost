
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { pasteLinkSchema, PasteLinkSchema } from "@/lib/formValidaionSchema";
import { useFormState } from "react-dom";
import { createPasteLink, updatePasteLink } from "@/lib/action";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const PasteLinkForm = ({
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
  } = useForm<PasteLinkSchema>({
    resolver: zodResolver(pasteLinkSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createPasteLink : updatePasteLink,
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
      toast(`Spread Sheet Link has been ${type === "create" ? "inserted" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new link" : "Update the link"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
         Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Spread Sheet Link"
          name="spreadsheetLink"
          defaultValue={data?.spreadsheetLink}
          register={register}
          error={errors.spreadsheetLink}
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

export default PasteLinkForm;
