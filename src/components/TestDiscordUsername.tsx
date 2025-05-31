"use client";

import { useSession } from "next-auth/react";

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

export default function TestDiscordUsername() {
  const { data: session } = useSession() as { data: ExtendedSession | null };

  if (!session || !session.user) {
    return <div>Please log in with Discord</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl">User Info</h2>
      <p>Username: {session.user.name ?? "N/A"}</p>
      <p>Email: {session.user.email ?? "N/A"}</p>
      <p>Discord Username: {session.user.discordUsername ?? "N/A"}</p>
    </div>
  );
}