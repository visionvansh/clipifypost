'use client';

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function AfterSignIn() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const createStudent = async () => {
        try {
          const response = await fetch("/api/create-student", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: user.username || user.firstName || "Unknown",
              email: user.primaryEmailAddress?.emailAddress || "",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to create student:", errorData.error);
            return;
          }

          const data = await response.json();
          console.log("Student created successfully:", data);
        } catch (err: any) {
          console.error("Error creating student:", err.message);
        }
      };

      createStudent();
    }
  }, [user]);

  return null; // This component doesn't render anything
}