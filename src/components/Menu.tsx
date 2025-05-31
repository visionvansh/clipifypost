"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const menuItems = [
  {
    title: "MENU",
    items: [
      { icon: "/homex.png", label: "Home", href: "/", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/managerx.png", label: "Manager", href: "/list/manager", visible: ["manager"] },
      { icon: "/userx.png", label: "Users", href: "/list/users", visible: ["admin", "manager"] },
      { icon: "/new-userx.png", label: "New Users", href: "/list/new-users", visible: ["manager"] },
      { icon: "/uploadx.png", label: "Uploaders Hub", href: "/list/paste-link", visible: ["users", "new-users"] },
      { icon: "/content-creator.png", label: "Editors Hub", href: "/list/editors", visible: ["users", "new-users"] },
      { icon: "/paymentx.png", label: "Payment", href: "/list/payment", visible: ["users", "new-users"] },
      { icon: "/checkx.png", label: "Uploaders Pannel", href: "/list/checking", visible: ["admin"] },
      { icon: "/positionx.png", label: "Editors Pannel", href: "/list/editors-checking", visible: ["admin"] },
      { icon: "/addx.png", label: "Add Promotion", href: "/list/social-profiles", visible: ["admin", "manager"] },
      { icon: "/addx.png", label: "User Stats & Payment", href: "/list/users-stats", visible: ["admin"] },
      { icon: "/addx.png", label: "Invites", href: "/list/invites", visible: ["admin", "users"] },
    ],
  },
];

const Menu = () => {
  const { user } = useUser();
  const role = user?.publicMetadata.role as string;

  if (!user || !role) {
    return <></>;
  }

  return (
    <div className="mt-4 text-sm hidden lg:block"> {/* Hidden on mobile */}
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="text-gray-400 font-light my-4 uppercase">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="glow-item flex items-center gap-4 text-white py-2 px-4 rounded-md bg-black hover:bg-gray-800 transition-all duration-200"
                >
                  <Image src={item.icon} alt={item.label} width={24} height={24} className="glow-icon" />
                  <span className="glow-text">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;