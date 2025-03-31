// No "use client" - Yeh ab server component hai
import { PrismaClient } from "@prisma/client";
import { FaDownload } from "react-icons/fa";

const prisma = new PrismaClient();

interface PaymentData {
  id: number;
  userId: string; // Clerk ID
  username: string; // Extracted from title
  paymentMethod: string; // Extracted from title
  paymentDetails: string; // description field
  date: string; // Formatted date
}

async function fetchPayments(): Promise<PaymentData[]> {
  try {
    const data = await prisma.announcement.findMany({
      orderBy: { date: "desc" }, // Latest payments pehle
    });
    console.log("Fetched payments:", data);

    // Map data to PaymentData format
    const formattedPayments = data.map((item) => {
      const titleParts = item.title.match(/(.+)\((.+)\)/); // username(paymentMethod)
      return {
        id: item.id,
        userId: item.userId,
        username: titleParts ? titleParts[1] : "Unknown",
        paymentMethod: titleParts ? titleParts[2] : "Unknown",
        paymentDetails: item.description,
        date: new Date(item.date).toLocaleString(), // Readable date
      };
    });
    return formattedPayments;
  } catch (error) {
    console.error("Fetch Payments Error:", error);
    return [];
  } finally {
    await prisma.$disconnect(); // Cleanup
  }
}

export default async function PaymentTable() {
  const payments = await fetchPayments();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-center mb-6">💰 Payment Records</h2>

        {payments.length > 0 ? (
          <>
          
      

            {/* Payment Table */}
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="p-4 border border-gray-600">ID</th>
                    <th className="p-4 border border-gray-600">Clerk User ID</th>
                    <th className="p-4 border border-gray-600">Username</th>
                    <th className="p-4 border border-gray-600">Payment Method</th>
                    <th className="p-4 border border-gray-600">Payment Details</th>
                    <th className="p-4 border border-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border border-gray-600 hover:bg-gray-700 transition-all"
                    >
                      <td className="p-4">{payment.id}</td>
                      <td className="p-4">{payment.userId}</td>
                      <td className="p-4">{payment.username}</td>
                      <td className="p-4">{payment.paymentMethod}</td>
                      <td className="p-4">{payment.paymentDetails}</td>
                      <td className="p-4">{payment.date}</td>
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