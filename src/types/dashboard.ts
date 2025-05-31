export interface PendingUser {
  username: string;
  discordUsername: string;
  totalViews: number;
  isApproved: boolean;
  signedUpToWebsite: boolean;
}

export interface ApprovedUser {
  clerkUsername: string;
  discordUsername: string;
}

export interface DashboardData {
  discordUsername: string | null | undefined;
  inviteLink: string | undefined;
  inviteCount: number;
  loggedInWebsite: number;
  pendingUsers: PendingUser[];
  approvedUsers: ApprovedUser[];
  earnings: number; // Add earnings property
}