
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/teacher.png",
        label: "Manager",
        href: "/list//manager",
        visible: ["admin"],
      },
      {
        icon: "/student.png",
        label: "Users",
        href: "/list//users",
        visible: ["admin", "manager"],
      },
      {
        icon: "/parent.png",
        label: "New Users",
        href: "/list/new-users",
        visible: ["admin", "manager"],
      },
      {
        icon: "/subject.png",
        label: "Working",
        href: "/list/working",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Positions",
        href: "/list/positions",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/lesson.png",
        label: "Social Profiles",
        href: "/list/social-profiles",
        visible: ["admin", "manager"],
      },
      {
        icon: "/exam.png",
        label: "Paste Link",
        href: "/list/paste-link",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/assignment.png",
        label: "Add Social Profile",
        href: "/list/add-social-profile",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/result.png",
        label: "Revenue",
        href: "/list/revenue",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/attendance.png",
        label: "Views",
        href: "/list/views",
        visible: ["admin", "manager", "users", "new-users"],
      },

      {
        icon: "/announcement.png",
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
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "manager", "users", "new-users"],
      },
      {
        icon: "/logout.png",
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
