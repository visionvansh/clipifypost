
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/homephoto.png",
        label: "Home",
        href: "/",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/darkmanager.png",
        label: "Manager",
        href: "/list//manager",
        visible: ["admin"],
      },
      {
        icon: "/userphoto.png",
        label: "Users",
        href: "/list//users",
        visible: ["admin", "manager"],
      },
      {
        icon: "/newuser.png",
        label: "New Users",
        href: "/list/new-users",
        visible: ["admin", "manager"],
      },
      {
        icon: "/podium.png",
        label: "Positions",
        href: "/list/positions",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/blacksocial.png",
        label: "Social Profiles",
        href: "/list/social-profiles",
        visible: ["admin", "manager"],
      },
      {
        icon: "/darkpaste.png",
        label: "Paste Link",
        href: "/list/paste-link",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/instagramdark.png",
        label: "Add Profile",
        href: "/list/add-social-profile",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/income.png",
        label: "Revenue",
        href: "/list/revenue",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/eye.png",
        label: "Views",
        href: "/list/views",
        visible: ["admin", "manager", "users", "new-users"],
      },

      {
        icon: "/announce.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "manager", "users", "new-users"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile-userdark.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/settingsdark.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/logoutdark.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "manager", "users", "new-users"],
      },
    ],
  },
];

const Menu = async() => {
  const user = await currentUser()
  const role = user?.publicMetadata.role as string

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
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
