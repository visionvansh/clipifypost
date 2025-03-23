"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role;
    if (role) {
      router.push(`/${role}`);
    }
  }, [user, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-0">
      <SignIn.Root>
        <SignIn.Step
          name="start"
          className="bg-gray-800 p-10 sm:p-12 rounded-lg shadow-xl flex flex-col gap-6 w-full max-w-md"
        >
          <div className="flex flex-col items-center gap-3">
            <Image src="/bestlogo.png" alt="Clipify Post Logo" width={60} height={60} />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Clipify Post
            </h1>
          </div>

          <h2 className="text-gray-300 text-lg sm:text-xl text-center">
            Sign in to your account
          </h2>

          <Clerk.GlobalError className="text-sm text-red-400" />

          <Clerk.Field name="identifier" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm text-gray-300">Username</Clerk.Label>
            <Clerk.Input
              type="text"
              required
              className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          <Clerk.Field name="password" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm text-gray-300">Password</Clerk.Label>
            <Clerk.Input
              type="password"
              required
              className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          <SignIn.Action
            submit
            className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300"
          >
            Sign In
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
};

export default LoginPage;
