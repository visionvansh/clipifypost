"use client";

import { PendingUser } from '@/types/dashboard';
import { FaUserClock, FaCheck, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';

interface PendingUsersCardProps {
  pendingUsers: PendingUser[];
}

const PendingUsersCard = ({ pendingUsers }: PendingUsersCardProps) => {
  const [anime, setAnime] = useState<any>(null);

  // Dynamically import animejs only on the client side
  useEffect(() => {
    const loadAnime = async () => {
      const animeModule = await import('animejs');
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

  useEffect(() => {
    if (anime && pendingUsers && pendingUsers.length > 0) {
      // Animate table rows on load
      anime({
        targets: '.table-row',
        translateX: [-100, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutQuad',
      });

      // Pulsating glow for title and count
      anime({
        targets: '.animate-glow',
        textShadow: [
          { value: '0 0 5px rgba(234, 179, 8, 0.8)' },
          { value: '0 0 10px rgba(234, 179, 8, 1)' },
          { value: '0 0 5px rgba(234, 179, 8, 0.8)' },
        ],
        loop: true,
        duration: 1500,
        easing: 'linear',
      });

      // Animate table cells on hover
      const rows = document.querySelectorAll('.table-row');
      rows.forEach((row) => {
        row.addEventListener('mouseenter', () => {
          anime({
            targets: row,
            scale: 1.02,
            duration: 300,
            easing: 'easeOutQuad',
          });
        });
        row.addEventListener('mouseleave', () => {
          anime({
            targets: row,
            scale: 1,
            duration: 300,
            easing: 'easeOutQuad',
          });
        });
      });
    }
  }, [anime, pendingUsers]);

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg p-4 md:p-6 border border-yellow-500 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300" style={{ boxShadow: "0 0 15px rgba(234, 179, 8, 0.6)" }}>
      <div className="flex items-center space-x-2 mb-4">
        <FaUserClock className="text-2xl md:text-3xl text-yellow-500 glow-icon" />
        <h3 className="text-lg md:text-xl font-bold font-poppins text-white animate-glow">Pending Users</h3>
      </div>

      {pendingUsers === undefined || pendingUsers === null ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm md:text-base text-red-400 font-poppins">Error loading data</p>
          <p className="text-xs text-gray-400">Please try again later</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm md:text-base text-gray-400 font-poppins">No pending users</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[200px]">
          <table className="w-full text-left text-sm glass-table rounded-lg">
            <thead className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Discord Username</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Username</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text text-center min-w-[100px] text-xs sm:text-sm">Signed Up</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text text-center min-w-[100px] text-xs sm:text-sm">Approved</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text text-right min-w-[100px] text-xs sm:text-sm">Views</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user, index) => (
                <tr
                  key={index}
                  className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300"
                >
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{user.discordUsername}</td>
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{user.username}</td>
                  <td className="px-2 sm:px-4 py-2 flex justify-center">
                    {user.signedUpToWebsite ? (
                      <FaCheck className="text-green-500 glow-icon-green" />
                    ) : (
                      <FaTimes className="text-red-500 glow-icon-red" />
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 flex justify-center">
                    {user.isApproved ? (
                      <FaCheck className="text-green-500 glow-icon-green" />
                    ) : (
                      <FaTimes className="text-red-500 glow-icon-red" />
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-white text-right">
                    {user.isApproved ? (
                      <FaCheck className="text-green-500 glow-icon-green" />
                    ) : (
                      user.totalViews
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingUsersCard;