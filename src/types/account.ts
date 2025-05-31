export type Account = {
  id: number;
  instagramLink: string;
  isVerified: boolean;
  status: string;
  verificationCode: string | null;
  driveLink: string | null;
  pushedVerificationCode: string | null;
};