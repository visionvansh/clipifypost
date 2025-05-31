"use client";

import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Mark as mounted after client-side render
  }, []);

  if (!isMounted) {
    return null; // Prevent rendering until client-side
  }

  return <ToastContainer position="top-right" theme="dark" autoClose={3000} />;
}