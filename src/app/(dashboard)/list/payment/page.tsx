"use client";

import { useState, useEffect } from "react";
import PositionForm from "@/components/forms/announcementsForm";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { FaUser, FaCreditCard, FaTrash, FaEdit } from "react-icons/fa";

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

  useEffect(() => {
    if (userId) {
      const storedData = localStorage.getItem(`payment_${userId}`);
      if (storedData) {
        setPaymentData(JSON.parse(storedData));
        setShowForm(false);
      }
    }
  }, [userId]);

  const handleSavePayment = (data: PaymentData) => {
    setPaymentData(data);
    setShowForm(false);
    localStorage.setItem(`payment_${userId}`, JSON.stringify(data));
    toast.success("Payment method saved successfully!");
  };

  const handleDelete = () => {
    localStorage.removeItem(`payment_${userId}`);
    setPaymentData(null);
    setShowForm(true);
    toast.warn("Payment method removed.");
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

            <div className="mt-6 flex space-x-4">
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setShowForm(true)}
              >
                <FaEdit className="mr-2" /> Update
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
                onClick={handleDelete}
              >
                <FaTrash className="mr-2" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
