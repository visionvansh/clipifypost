"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Extend the Session type to match the one in [...nextauth].ts
interface ExtendedSession {
  user?: {
    id?: string;
    discordUsername?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DiscordConnectStatus({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const [isDiscordConnected, setIsDiscordConnected] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkDiscordConnection = async () => {
      if (status === "loading") return;

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/check-discord-connection", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setIsDiscordConnected(data.isConnected);
    };

    checkDiscordConnection();
  }, [session, status, router]);

  if (status === "loading" || isDiscordConnected === null) {
    return <div className="text-gray-400 p-4">Loading...</div>;
  }

  if (!isDiscordConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold mb-4">Connect Your Discord Account</h2>
        <p className="text-gray-400 mb-6">
          To use the invite tracker tool, please connect your Discord account.
        </p>
        <button
          onClick={() => signIn("discord")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
        >
          Connect with Discord
        </button>
      </div>
    );
  }

  return <>{children}</>;
}