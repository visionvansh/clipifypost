"use client";

import { useState } from "react";
import { toast } from "react-toastify";

interface PaymentData {
  userId: string;
  username: string;
  paymentMethod: string;
  paymentDetails: string;
}

interface PositionFormProps {
  onSave: (data: PaymentData) => void;
  userId?: string;
  username: string;
}

export default function PositionForm({ onSave, userId, username }: PositionFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod || !paymentDetails) {
      toast.error("Please fill in all fields!");
      return;
    }

    if (!userId) {
      toast.error("User ID is missing!");
      return;
    }

    onSave({ userId, username, paymentMethod, paymentDetails });
    setPaymentMethod(""); // Reset form
    setPaymentDetails(""); // Reset form
  };

  return (
    <div className="bg-gray-700 p-6 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Select Your Payment Method</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Payment Method:</label>
        <select
          className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">Select a method</option>
          <option value="UPI">UPI</option>
          <option value="PayPal">PayPal</option>
          <option value="Bitcoin">Bitcoin</option>
          <option value="Ethereum">Ethereum</option>
        </select>

        {paymentMethod && (
          <div className="mt-4">
            <label className="block mb-2 font-semibold">Enter {paymentMethod} Details:</label>
            <input
              type="text"
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600"
              placeholder={`Enter your ${paymentMethod} details`}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              required
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
        >
          Save Payment
        </button>
      </form>
    </div>
  );
}