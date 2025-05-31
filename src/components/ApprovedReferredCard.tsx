import { DashboardData } from '@/types/dashboard';

interface ApprovedUser {
  clerkUsername: string;
  discordUsername: string | null;
}

interface ApprovedReferredCardProps {
  approvedUsers: ApprovedUser[];
}

const ApprovedReferredCard = ({ approvedUsers }: ApprovedReferredCardProps) => {
  const count = approvedUsers.length;

  return (
    <div className="relative referral-card">
      <svg className="glowing-icon absolute top-2 right-2 moving-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.39 7.61h7.61l-6.15 4.47 2.39 7.61-6.15-4.47-6.15 4.47 2.39-7.61-6.15-4.47h7.61z" />
      </svg>
      <h1 className="glow-text text-3xl sm:text-4xl font-bold">
        {count.toLocaleString()}
      </h1>
      <h2 className="glow-text text-sm sm:text-base font-medium mt-2">Approved Users</h2>
      {count > 0 && (
        <ul className="mt-3 text-sm sm:text-base">
          {approvedUsers.slice(0, 3).map((user, index) => (
            <li key={index} className="truncate text-gray-300">
              {user.clerkUsername} <span className="text-gray-400">({user.discordUsername || 'No Discord'})</span>
            </li>
          ))}
          {count > 3 && <li className="text-gray-400">+{count - 3} more</li>}
        </ul>
      )}
    </div>
  );
};

export default ApprovedReferredCard;