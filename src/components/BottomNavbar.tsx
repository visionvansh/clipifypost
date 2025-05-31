import Link from "next/link";

export default function BottomNavbar({ companyId }: { companyId: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md py-3 px-4 flex justify-around items-center border-t border-yellow-500 shadow-lg z-50 animate-fadeIn">
      <Link href={`/list/paste-link/${companyId}/verify`}>
        <div className="group flex flex-col items-center text-yellow-400 hover:text-yellow-300 transition-all glow-item">
          <svg className="w-6 h-6 moving-icon glowing-icon group-hover:transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-xs font-semibold">Verify</span>
        </div>
      </Link>
      <Link href={`/list/paste-link/${companyId}/paste-links`}>
        <div className="group flex flex-col items-center text-yellow-400 hover:text-yellow-300 transition-all glow-item">
          <svg className="w-6 h-6 moving-icon glowing-icon group-hover:transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <span className="text-xs font-semibold">Paste Links</span>
        </div>
      </Link>
    
    </nav>
  );
}