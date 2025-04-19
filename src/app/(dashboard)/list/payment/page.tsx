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
          const response = await fetch(`${baseUrl}/api/payments/${userId}`);
          const text = await response.text();

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
      const response = await fetch(`${baseUrl}/api/payments/${data.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const text = await response.text();

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
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight transform rotate-3d flex items-center gap-3">
    <span className="text-purple-400">
      💳
    </span>
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
      Manage Your Payment
    </span>
  </h1>
          </div>

          <div className="backdrop-blur-md bg-gray-900 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform rotate-3d">
            {showForm ? (
              <PositionForm onSave={handleSavePayment} userId={userId} username={username} />
            ) : (
              <div className="space-y-4">
                <div className="text-xl font-semibold flex items-center gap-2">
                  <FaUser className="text-blue-400" /> Your Payment Details
                </div>

                <div className="bg-gray-800/30 p-4 rounded-lg space-y-3">
                  <p className="flex items-center gap-2">
                    <FaUser className="text-yellow-400" />
                    <span><strong>Username:</strong> {paymentData?.username}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FaCreditCard className="text-green-400" />
                    <span><strong>Method:</strong> {paymentData?.paymentMethod}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FaCreditCard className="text-purple-400" />
                    <span><strong>Details:</strong> {paymentData?.paymentDetails}</span>
                  </p>
                </div>

                <div className="pt-4">
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
      </div>
    </div>
  );
}
