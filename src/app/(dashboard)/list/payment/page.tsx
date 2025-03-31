"use client";

import { useState, useEffect } from "react";
import PositionForm from "@/components/forms/announcementsForm";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { FaUser, FaCreditCard, FaEdit } from "react-icons/fa";

interface PaymentData {
  userId: string;
  username: string;
  paymentMethod: string;
  paymentDetails: string;
}

export default function Announcements() {
  const { user } = useUser();
  const userId = user?.id;
  const username = user?.username || "Anonymous";

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showForm, setShowForm] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (userId) {
      const fetchPaymentData = async () => {
        try {
          console.log(`Fetching data for userId: ${userId}`);
          const response = await fetch(`${baseUrl}/api/payments/${userId}`); // Changed to /api/payments
          const text = await response.text();
          console.log('GET Response:', text);

          if (response.ok) {
            const data = JSON.parse(text);
            const titleParts = data.title.match(/(.+)\((.+)\)/);
            if (titleParts) {
              const username = titleParts[1];
              const paymentMethod = titleParts[2];
              const paymentDetails = data.description;
              setPaymentData({ userId, username, paymentMethod, paymentDetails });
              setShowForm(false);
            } else {
              throw new Error("Invalid title format");
            }
          } else if (response.status === 404) {
            setShowForm(true);
          } else {
            throw new Error(`Failed to fetch: ${text}`);
          }
        } catch (error) {
          console.error("Fetch Error:", error);
          toast.error(`Failed to load payment data: ${String(error)}`);
          setShowForm(true);
        }
      };
      fetchPaymentData();
    }
  }, [userId]);

  const handleSavePayment = async (data: PaymentData) => {
    const title = `${data.username}(${data.paymentMethod})`;
    const description = data.paymentDetails;
    try {
      console.log(`Saving data for userId: ${data.userId}`, { title, description });
      const response = await fetch(`${baseUrl}/api/payments/${data.userId}`, { // Changed to /api/payments
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const text = await response.text();
      console.log('PUT Response:', text);

      if (response.ok) {
        const savedData = JSON.parse(text);
        const titleParts = savedData.data.title.match(/(.+)\((.+)\)/);
        if (titleParts) {
          const username = titleParts[1];
          const paymentMethod = titleParts[2];
          const paymentDetails = savedData.data.description;
          setPaymentData({ userId: data.userId, username, paymentMethod, paymentDetails });
          setShowForm(false);
          toast.success("Payment method saved successfully!");
        }
      } else {
        throw new Error(`Failed to save: ${text}`);
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(`Failed to save payment data: ${String(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-3xl p-6 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Manage Your Payment</h1>

        {showForm ? (
          <PositionForm onSave={handleSavePayment} userId={userId} username={username} />
        ) : (
          <div className="bg-gray-700 p-6 rounded-md shadow-md">
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <FaUser className="mr-2 text-blue-400" /> Your Payment Details
            </h2>
            <p className="flex items-center">
              <FaUser className="mr-2 text-yellow-400" /> <strong>Username:</strong> {paymentData?.username}
            </p>
            <p className="flex items-center mt-2">
              <FaCreditCard className="mr-2 text-green-400" /> <strong>Method:</strong> {paymentData?.paymentMethod}
            </p>
            <p className="flex items-center mt-2">
              <FaCreditCard className="mr-2 text-purple-400" /> <strong>Details:</strong> {paymentData?.paymentDetails}
            </p>

            <div className="mt-6">
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setShowForm(true)}
              >
                <FaEdit className="mr-2" /> Update
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}