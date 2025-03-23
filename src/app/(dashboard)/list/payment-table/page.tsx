"use client";

import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";

interface PaymentData {
  userId: string;
  username: string;
  paymentMethod: string;
  paymentDetails: string;
}

export default function PaymentTable() {
  const [payments, setPayments] = useState<PaymentData[]>([]);

  // Fetch payment data from local storage
  useEffect(() => {
    const allPayments: PaymentData[] = [];
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

  // Export payment data to CSV file
  const exportToCSV = () => {
    const headers = "User ID,Username,Payment Method,Payment Details\n";
    const rows = payments
      .map(
        (payment) =>
          `${payment.userId},${payment.username},${payment.paymentMethod},${payment.paymentDetails}`
      )
      .join("\n");

    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "payments.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-center mb-6">💰 Payment Records</h2>

        {payments.length > 0 ? (
          <>
            {/* Export CSV Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-md transition-all"
              >
                <FaDownload /> Export as CSV
              </button>
            </div>

            {/* Payment Table */}
            <div className="overflow-hidden border border-gray-700 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="p-4 border border-gray-600">Username</th>
                    <th className="p-4 border border-gray-600">Payment Method</th>
                    <th className="p-4 border border-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={index} className="border border-gray-600 hover:bg-gray-700 transition-all">
                      <td className="p-4">{payment.username}</td>
                      <td className="p-4">{payment.paymentMethod}</td>
                      <td className="p-4">{payment.paymentDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400 text-lg">No payment data available.</p>
        )}
      </div>
    </div>
  );
}
