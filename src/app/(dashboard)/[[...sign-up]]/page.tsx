'use client';

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import * as SignUp from "@clerk/elements/sign-up";
import { useUser, useSignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";

const SignUpPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isSignUpView, setIsSignUpView] = useState(true);
  const [isResetPasswordView, setIsResetPasswordView] = useState(false);
  const [isOtpView, setIsOtpView] = useState(false);
  const [signUpMessage, setSignUpMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validatePassword = (password: string) => {
    if (password.length < 12) {
      return "Password must be at least 12 characters long";
    }
    if (!/[a-zA-Z]/.test(password)) {
      return "Password must contain at least one letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp || isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      if (!email || !username || !password) {
        setError("All fields are required");
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setIsSubmitting(false);
        return;
      }
      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9]+$/.test(username)) {
        setError("Username must be 3-20 characters and alphanumeric");
        setIsSubmitting(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Invalid email format");
        setIsSubmitting(false);
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
        setSignUpMessage("Verification code sent to your email, please check your inbox.");
      } catch (err: any) {
        const errorMessage =
          err.errors?.[0]?.code === "form_identifier_exists"
            ? "Email or username already taken"
            : err.errors?.[0]?.code === "rate_limit_exceeded"
            ? "Too many requests, please try again in a few minutes"
            : err.errors?.[0]?.message || "Something went wrong during sign-up";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signUp, email, username, password, isSubmitting]
  );

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signUp || isSubmitting || !verificationCode) return;
      setIsSubmitting(true);
      setError(null);

      if (verificationCode.length !== 6 || isNaN(Number(verificationCode))) {
        setError("Please enter a valid 6-digit verification code");
        setIsSubmitting(false);
        return;
      }

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });

        if (result.status === "complete") {
          const clerkUserId = signUp.createdUserId;
          const clerkUsername = signUp.username;
          const clerkEmail = signUp.emailAddress;

          if (!clerkUserId || !clerkUsername || !clerkEmail) {
            throw new Error("Clerk user data is missing");
          }

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

          await setActive({ session: signUp.createdSessionId });
          setSignUpMessage("You have registered successfully, redirecting...");
          setTimeout(() => router.push("/users"), 2000);
        } else {
          setError("Verification failed, please check the code");
        }
      } catch (err: any) {
        const errorMessage =
          err.message.includes("already exists")
            ? "Email or username already taken in database"
            : err.message || "Invalid verification code or server error";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signUp, verificationCode, setActive, router, isSubmitting]
  );

  const handleResend = useCallback(async () => {
    if (!signUp || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setSignUpMessage("Verification code resent, please check your inbox.");
      resendTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 30000);
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.code === "rate_limit_exceeded"
          ? "Too many resend attempts, please wait a few minutes"
          : "Failed to resend verification code";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }, [signUp, isSubmitting]);

  const handlePasswordReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("Invalid email format");
        }

        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const responseText = await response.text();
        console.log("[RESET-PASSWORD-EMAIL] Raw response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("[RESET-PASSWORD-EMAIL] Failed to parse response:", responseText);
          throw new Error("Invalid server response format");
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to process reset request");
        }

        console.log("[RESET-PASSWORD-EMAIL] Response data:", data);
        setSignUpMessage(data.message || "OTP code sent to your email, please check your inbox!");
        setResetEmail(email);
        setIsOtpView(true);
      } catch (err: any) {
        console.error("[RESET-PASSWORD-EMAIL] Error:", err.message);
        setError(err.message || "Failed to process reset request");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, isSubmitting]
  );

  const handleOtpVerification = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      try {
        if (!resetEmail || !otp || !newPassword) {
          throw new Error("Email, OTP, and new password are required");
        }

        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
          throw new Error("Please enter a valid 6-digit OTP code");
        }

        const passwordValidationError = validatePassword(newPassword);
        if (passwordValidationError) {
          throw new Error(passwordValidationError);
        }

        const response = await fetch("/api/verify-reset-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, otp, newPassword }),
        });

        const responseText = await response.text();
        console.log("[RESET-OTP] Raw response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("[RESET-OTP] Failed to parse response:", responseText);
          throw new Error("Invalid server response format");
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify OTP");
        }

        console.log("[RESET-OTP] Response data:", data);
        setSignUpMessage(data.message || "Password reset successful, please sign in!");
        setIsOtpView(false);
        setIsResetPasswordView(false);
        setOtp("");
        setNewPassword("");
        setEmail("");
        setResetEmail("");
        setPasswordError("");
      } catch (err: any) {
        console.error("[RESET-OTP] Error:", err.message);
        setError(err.message || "Failed to verify OTP");
      } finally {
        setIsSubmitting(false);
      }
    },
    [resetEmail, otp, newPassword, isSubmitting]
  );

  useEffect(() => {
    if (isSignedIn && user) {
      const role = user.publicMetadata.role || "users";
      router.push(`/${role}`);
    }
  }, [isSignedIn, user, router]);

  useEffect(() => {
    return () => {
      if (resendTimeoutRef.current) clearTimeout(resendTimeoutRef.current);
    };
  }, []);

  if (!isLoaded || !signUpLoaded) {
    return <div className="text-white text-center">Loading...</div>;
  }

  if (isSignedIn) {
    return <div className="text-white text-center">Redirecting to your dashboard...</div>;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-0">
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

            {isSubmitting && (
              <div className="text-center text-gray-300">Processing...</div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Verify Email
              </button>
            </form>

            <p className="text-gray-400 text-sm text-center">
              Didn’t receive a code?{" "}
              <button
                onClick={handleResend}
                className="text-blue-400 hover:underline"
                disabled={isSubmitting}
              >
                Resend
              </button>
            </p>
          </div>
        ) : (
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

            {isSubmitting && (
              <div className="text-center text-gray-300">Processing...</div>
            )}

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300 disabled:opacity-50"
                disabled={isSubmitting}
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
      ) : isResetPasswordView ? (
        <div className="bg-gray-800 p-10 sm:p-12 rounded-lg shadow-xl flex flex-col gap-6 w-full max-w-md">
          <div className="flex flex-col items-center gap-3">
            <Image src="/bestlogo.png" alt="Clipify Post Logo" width={60} height={60} />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Reset Password
            </h1>
          </div>

          {isOtpView ? (
            <>
              <h2 className="text-gray-300 text-lg sm:text-xl text-center">
                Enter OTP and New Password
              </h2>

              {isSubmitting && (
                <div className="text-center text-gray-300">Processing...</div>
              )}

              <form onSubmit={handleOtpVerification} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    readOnly
                    className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 opacity-50"
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(validatePassword(e.target.value));
                    }}
                    required
                    className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-400">{passwordError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300 disabled:opacity-50"
                  disabled={isSubmitting || !!passwordError}
                >
                  Verify OTP
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center">
                Back to{" "}
                <button
                  onClick={() => {
                    setIsOtpView(false);
                    setOtp("");
                    setNewPassword("");
                    setPasswordError("");
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Reset Password
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-gray-300 text-lg sm:text-xl text-center">
                Enter your email to reset your password
              </h2>

              {isSubmitting && (
                <div className="text-center text-gray-300">Processing...</div>
              )}

              <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white mt-2 rounded-md text-base sm:text-lg p-3 transition duration-300 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Send OTP
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center">
                Back to{" "}
                <button
                  onClick={() => setIsResetPasswordView(false)}
                  className="text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </>
          )}
        </div>
      ) : (
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
              Forgot password?{" "}
              <button
                onClick={() => setIsResetPasswordView(true)}
                className="text-blue-400 hover:underline"
              >
                Reset Password
              </button>
            </p>

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

export default SignUpPage;