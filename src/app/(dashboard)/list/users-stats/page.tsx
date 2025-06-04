"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Loading from "@/app/(dashboard)/list/loading";

interface InviteDetails {
  inviteId: string;
  discordUsername: string | null;
  signedUpToWebsite: boolean;
  status: string;
}

interface UserStats {
  userId: string;
  username: string;
  uploadersHub: { views: number; revenue: number };
  editorsHub: { views: number; revenue: number };
  total: { views: number; revenue: number };
  invites?: { count: number; signedUp: number; approved: number };
  paidAmount?: number;
}

interface PaymentDetails {
  paymentMethod: string;
  details: string;
}

interface StatsResponse {
  users: UserStats[];
  totalUploadersHubViews: number;
  totalUploadersHubRevenue: number;
  totalEditorsHubViews: number;
  totalEditorsHubRevenue: number;
  totalViews: number;
  totalRevenue: number;
}

interface InviteResponse {
  inviteDetails: InviteDetails[];
  approvedCount: number;
  totalPayout: number;
  totalPaidOut: number;
}

const UserStatsPage = () => {
  const { userId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) || "2025-05"
  );
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [inviteData, setInviteData] = useState<InviteResponse | null>(null);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [totalPaidOut, setTotalPaidOut] = useState<number>(0);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/user-stats?month=${selectedMonth}`, { cache: "no-store" });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user stats.");
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId, selectedMonth]);

  const fetchPaymentDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/payment-details?userId=${userId}`, { cache: "no-store" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch payment details.");
      }
      const data = await response.json();
      setPaymentDetails(data);
    } catch (err: any) {
      setPaymentError(`Failed to fetch payment details: ${err.message}`);
      setPaymentDetails(null);
    }
  };

  const fetchPaymentStatus = async (userId: string, month: string) => {
    try {
      const response = await fetch(`/api/check-payment?userId=${userId}&month=${month}`, { cache: "no-store" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check payment status.");
      }
      const data = await response.json();
      setIsPaid(data.isPaid);
    } catch (err: any) {
      console.error("Error fetching payment status:", err.message);
      setIsPaid(false);
    }
  };

  const fetchInviteDetails = async (userId: string) => {
    setInviteLoading(true);
    try {
      const response = await fetch(`/api/user-invites?userId=${userId}`, { cache: "no-store" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch invite details.");
      }
      const data = await response.json();
      console.log("Invite details response:", data);
      setInviteData(data);
      setTotalPaidOut(data.totalPaidOut || 0);
      setSelectedUser(stats?.users.find((u) => u.userId === userId) || null);
      setInviteModalOpen(true);
    } catch (err: any) {
      setError(`Failed to fetch invite details: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const handlePaymentDetailsClick = (user: UserStats) => {
    setSelectedUser(user);
    setPaymentDetails(null);
    setPaymentError(null);
    setIsPaid(false);
    setCopySuccess(null);
    fetchPaymentDetails(user.userId);
    fetchPaymentStatus(user.userId, selectedMonth);
    setModalOpen(true);
  };

  const handlePaidClick = async () => {
    if (!selectedUser) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/send-payment-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          month: selectedMonth,
          totalRevenue: selectedUser.total.revenue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send payment email.");
      }

      alert(`Payment email sent to ${selectedUser.username} for $${selectedUser.total.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setIsPaid(true);
      setModalOpen(false);
    } catch (err: any) {
      setPaymentError(`Failed to send payment email: ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyDetails = () => {
    if (!paymentDetails) return;

    const textData = paymentDetails.details;
    navigator.clipboard.writeText(textData).then(() => {
      setCopySuccess("Text data copied to clipboard!");
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch((err) => {
      console.error("Failed to copy:", err);
      setCopySuccess("Failed to copy.");
    });
  };

  const handlePaymentClick = () => {
    setPaymentAmount("");
    setPaymentErrorMsg(null);
    setPaymentModalOpen(true);
  };

  const handleMakePayment = async () => {
    if (!selectedUser || !paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      setPaymentErrorMsg("Please enter a valid payment amount.");
      return;
    }

    const paymentValue = Number(paymentAmount);
    if (paymentValue > (inviteData?.totalPayout || 0) - totalPaidOut) {
      setPaymentErrorMsg("Payment amount cannot exceed remaining payout.");
      return;
    }

    setPaymentProcessing(true);
    setPaymentErrorMsg(null);

    try {
      const response = await fetch("/api/make-invite-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          month: selectedMonth,
          paymentAmount: paymentValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment.");
      }

      alert(`Payment of $${paymentAmount} processed for ${selectedUser.username}`);
      setTotalPaidOut(totalPaidOut + paymentValue);
      setPaymentModalOpen(false);
      await fetchInviteDetails(selectedUser.userId);
    } catch (err: any) {
      setPaymentErrorMsg(`Failed to process payment: ${err.message}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <Loading />;
  if (!userId) return <div className="text-gray-400 p-4">Please log in to view stats.</div>;
  if (error) return <div className="text-gray-400 p-4">{error}</div>;

  const remainingMoney = (inviteData?.totalPayout || 0) - totalPaidOut;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">User Stats Dashboard</h1>

      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300 appearance-none cursor-pointer"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month} className="bg-gray-800 text-white">
                {new Date(month).toLocaleString("en-US", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">User Stats</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-gray-800 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Uploaders Hub (Views | Revenue $)</th>
                <th className="p-3 text-left">Editors Hub (Views | Revenue $)</th>
                <th className="p-3 text-left">Total (Views | Revenue $)</th>
             
                <th className="p-3 text-left">Invites</th>
                <th className="p-3 text-left">Payment</th>
              </tr>
            </thead>
            <tbody>
              {stats?.users.map((user) => (
                <tr key={user.userId} className="border-t border-gray-700">
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    {user.uploadersHub.views.toLocaleString()} |{" "}
                    {user.uploadersHub.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    {user.editorsHub.views.toLocaleString()} |{" "}
                    {user.editorsHub.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    {user.total.views.toLocaleString()} |{" "}
                    {user.total.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => fetchInviteDetails(user.userId)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-300"
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? "Loading..." : "View Invites"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handlePaymentDetailsClick(user)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
                    >
                      Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Payment Details for {selectedUser.username}</h2>
            {paymentDetails ? (
              <>
                <p><strong>Payment Method:</strong> {paymentDetails.paymentMethod}</p>
                <div className="flex items-center gap-2">
                  <p><strong>Details:</strong> {paymentDetails.details}</p>
                  <button
                    onClick={handleCopyDetails}
                    className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
                {copySuccess && <p className="text-green-400 mt-2">{copySuccess}</p>}
                <p className="mt-4">
                  <strong>Total Revenue for {new Date(selectedMonth).toLocaleString("en-US", { month: "long", year: "numeric" })}:</strong> $
                  {selectedUser.total.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {isPaid ? (
                  <p className="mt-4 text-green-400 font-semibold">Already Paid</p>
                ) : (
                  <button
                    onClick={handlePaidClick}
                    disabled={paymentLoading}
                    className={`mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 ${paymentLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {paymentLoading ? "Processing..." : "Paid"}
                  </button>
                )}
                {paymentError && <p className="text-red-400 mt-2">{paymentError}</p>}
              </>
            ) : paymentError ? (
              <p className="text-red-400">{paymentError}</p>
            ) : (
              <p>Loading payment details...</p>
            )}
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {inviteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full">
            <h2 className="text-xl font-semibold mb-4">Invite Details for {selectedUser.username}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-600">
                    <th className="p-3 text-left">Discord Username</th>
                    <th className="p-3 text-left">Signed Up to Website</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteData?.inviteDetails.length ? (
                    inviteData.inviteDetails.map((invite) => (
                      <tr key={invite.inviteId} className="border-t border-gray-600">
                        <td className="p-3">{invite.discordUsername || "N/A"}</td>
                        <td className="p-3">{invite.signedUpToWebsite ? "Yes" : "No"}</td>
                        <td className="p-3">{invite.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-3 text-center">No invitees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <p><strong>Total Made:</strong> ${inviteData?.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</p>
              <p><strong>Total Paid Out:</strong> ${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p><strong>Remaining Money:</strong> ${remainingMoney.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {remainingMoney === 0 ? (
                <p className="text-green-400 font-semibold mt-2">Already Paid</p>
              ) : (
                <button
                  onClick={handlePaymentClick}
                  className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300"
                >
                  Make Payment
                </button>
              )}
            </div>
            <button
              onClick={() => setInviteModalOpen(false)}
              className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {paymentModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Referral Payment for {selectedUser.username}</h2>
            <p>
              <strong>Total Made:</strong> ${inviteData?.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
            </p>
            <p>
              <strong>Remaining Money:</strong> ${remainingMoney.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-4">
              <label htmlFor="paymentAmount" className="block text-sm font-medium">Enter Payment Amount ($):</label>
              <input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="e.g., 2.00"
                min="0"
                step="0.01"
                max={remainingMoney}
              />
            </div>
            <button
              onClick={handleMakePayment}
              disabled={paymentProcessing}
              className={`mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 ${paymentProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {paymentProcessing ? "Processing..." : "Make Payment"}
            </button>
            {paymentErrorMsg && <p className="text-red-400 mt-2">{paymentErrorMsg}</p>}
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatsPage;