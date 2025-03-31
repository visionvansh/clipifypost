
"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import * as SignUp from "@clerk/elements/sign-up";
import { useUser, useSignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";



const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isSignUpView, setIsSignUpView] = useState(false);
  const [signUpMessage, setSignUpMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login ke baad redirect to /users
  useEffect(() => {
    if (isSignedIn && user) {
      const role = user.publicMetadata.role || "users";
      console.log("User signed in, redirecting to:", `/${role}`);
      router.push(`/${role}`);
    }
  }, [isSignedIn, user, router]);

  // Sign-up status monitor
  useEffect(() => {
    if (signUpLoaded && signUp) {
      console.log("Current SignUp Status:", signUp.status);
    }
  }, [signUpLoaded, signUp]);

  // Loading state
  if (!isLoaded || !signUpLoaded) return <div>Loading...</div>;

  // Agar user signed in hai, toh redirect message
  if (isSignedIn) {
    return <div>Redirecting to your dashboard...</div>;
  }

  // Handle Sign-Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) {
      setError("Sign-up object not available");
      return;
    }

    try {
      await signUp.create({
        emailAddress: email,
        username,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setIsVerificationStep(true);
      setError(null);
      setSignUpMessage("Verification code sent to your email, please check your inbox.");
    } catch (err: any) {
      console.error("Sign-up error:", err);
      setError(err.errors?.[0]?.message || "Something went wrong during sign-up");
    }
  };

  // Handle Email Verification with Code and Store in Database via API
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Verify button clicked, code entered:", verificationCode);

    if (!signUp) {
      setError("Sign-up object not available");
      console.error("SignUp object is null");
      return;
    }

    if (!verificationCode) {
      setError("Please enter the verification code");
      console.error("Verification code is empty");
      return;
    }

    try {
      console.log("Attempting email verification...");
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log("Verification result:", result);

      if (result.status === "complete") {
        console.log("Verification successful, proceeding to store user in database");

        const clerkUserId = signUp.createdUserId;
        const clerkUsername = signUp.username;
        const clerkEmail = signUp.emailAddress;

        console.log("Clerk User Data:", { clerkUserId, clerkUsername, clerkEmail });

        if (!clerkUserId || !clerkUsername || !clerkEmail) {
          throw new Error("Clerk user data is missing or incomplete");
        }

        // Call API to store user in database
        const response = await fetch("/api/store-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId,
            username: clerkUsername,
            email: clerkEmail,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to store user in database");
        }

        console.log("User stored in database:", data.student);

        // Set active session and redirect
        console.log("Setting active session:", signUp.createdSessionId);
        await setActive({ session: signUp.createdSessionId });
        setSignUpMessage("You have registered successfully, redirecting to your dashboard...");
        setTimeout(() => {
          console.log("Redirecting to /users");
          router.push("/users");
        }, 3000);
      } else {
        setError("Verification failed, please check the code and try again");
        console.error("Verification did not complete, status:", result.status);
      }
    } catch (err: any) {
      console.error("Error during verification or database operation:", err);
      setError(err.message || "Invalid verification code or server error");
    }
  };

  // Handle Resend Verification Code
  const handleResend = async () => {
    if (!signUp) {
      setError("Sign-up object not available");
      return;
    }
    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setSignUpMessage("Verification code resent, please check your inbox.");
      setError(null);
    } catch (err: any) {
      console.error("Resend error:", err);
      setError("Failed to resend verification code");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-0">
      {/* Sign-up success/error message */}
      {(signUpMessage || error) && (
        <div
          className={`fixed top-5 right-5 p-4 rounded-md shadow-lg ${
            error ? "bg-red-600" : "bg-green-600"
          } text-white`}
        >
          {signUpMessage || error}
        </div>
      )}

      {isSignUpView ? (
        isVerificationStep ? (
          // Verification Step
          <div className="bg-gray-800 p-10 sm:p-12 rounded-lg shadow-xl flex flex-col gap-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-3">
              <Image src="/bestlogo.png" alt="Clipify Post Logo" width={60} height={60} />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Verify Your Email
              </h1>
            </div>

            <h2 className="text-gray-300 text-lg sm:text-xl text-center">
              Enter the verification code sent to your email
            </h2>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300"
              >
                Verify Email
              </button>
            </form>

            <p className="text-gray-400 text-sm text-center">
              Didn’t receive a code?{" "}
              <button
                onClick={handleResend}
                className="text-blue-400 hover:underline"
              >
                Resend
              </button>
            </p>
          </div>
        ) : (
          // Sign-Up Form
          <div className="bg-gray-800 p-10 sm:p-12 rounded-lg shadow-xl flex flex-col gap-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-3">
              <Image src="/bestlogo.png" alt="Clipify Post Logo" width={60} height={60} />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Clipify Post
              </h1>
            </div>

            <h2 className="text-gray-300 text-lg sm:text-xl text-center">
              Create your account
            </h2>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300"
              >
                Sign Up
              </button>
            </form>

            <p className="text-gray-400 text-sm text-center">
              Already have an account?{" "}
              <button
                onClick={() => setIsSignUpView(false)}
                className="text-blue-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        )
      ) : (
        // Sign-In Form
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
              <Clerk.Label className="text-sm text-gray-300">Email</Clerk.Label>
              <Clerk.Input
                type="email"
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

            <p className="text-gray-400 text-sm text-center">
              Don’t have an account?{" "}
              <button
                onClick={() => setIsSignUpView(true)}
                className="text-blue-400 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </SignIn.Step>
        </SignIn.Root>
      )}
    </div>
  );
};

export default LoginPage;