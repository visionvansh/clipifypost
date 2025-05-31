interface InvitedToServerCardProps {
  inviteCount: number;
}

const InvitedToServerCard = ({ inviteCount }: InvitedToServerCardProps) => {
  return (
    <div className="relative referral-card">
      <svg className="glowing-icon absolute top-2 right-2 moving-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
      <h1 className="glow-text text-3xl sm:text-4xl font-bold">
        {inviteCount.toLocaleString()}
      </h1>
      <h2 className="glow-text text-sm sm:text-base font-medium mt-2">Invited to Server</h2>
    </div>
  );
};

export default InvitedToServerCard;