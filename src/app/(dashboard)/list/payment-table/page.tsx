"use client";

import { useEffect, useState } from "react";

interface PaymentData {
  userId: string;
  username: string;
  paymentMethod: string;
  paymentDetails: string;
}

export default function PaymentTable() {
  const [payments, setPayments] = useState<PaymentData[]>([]);

  useEffect(() => {
    const allPayments: PaymentData[] = [];
    
    // Loop through localStorage to collect all user payments
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("payment_")) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          allPayments.push(JSON.parse(storedData));
        }
      }
    });

    setPayments(allPayments);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">All Payment Data</h2>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-700">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 border border-gray-600">Username</th>
                  <th className="p-3 border border-gray-600">Payment Method</th>
                  <th className="p-3 border border-gray-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index} className="border border-gray-600 hover:bg-gray-700">
                    <td className="p-3">{payment.username}</td>
                    <td className="p-3">{payment.paymentMethod}</td>
                    <td className="p-3">{payment.paymentDetails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400">No payment data available.</p>
        )}
      </div>
    </div>
  );
}
