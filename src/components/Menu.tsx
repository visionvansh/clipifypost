import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      { icon: "/homex.png", label: "Home", href: "/", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/managerx.png", label: "Manager", href: "/list/manager", visible: ["admin"] },
      { icon: "/userx.png", label: "Users", href: "/list/users", visible: ["admin", "manager"] },
      { icon: "/new-userx.png", label: "New Users", href: "/list/new-users", visible: ["admin", "manager"] },
      { icon: "/positionx.png", label: "Positions", href: "/list/positions", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/social-profilex.png", label: "Social Profiles", href: "/list/social-profiles", visible: ["admin", "manager"] },
      { icon: "/paste-linkx.png", label: "Paste Link", href: "/list/paste-link", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/add-profilex.png", label: "Add Profile", href: "/list/add-social-profile", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/revenuex.png", label: "Revenue", href: "/list/revenue", visible: ["admin", "manager"] },
      { icon: "/viewsx.png", label: "Views", href: "/list/views", visible: ["admin", "manager"] },
      { icon: "/paymentx.png", label: "Payment", href: "/list/payment", visible: ["users","new-users"] },
      { icon: "/paymentx.png", label: "Payment Data", href: "/list/payment-table", visible: ["admin", "manager"] },
    ],
  },
  {
    title: "OTHER",
    items: [
      { icon: "/profilex.png", label: "Profile", href: "/profile", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/setg.png", label: "Settings", href: "/settings", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/log.png", label: "Logout", href: "/logout", visible: ["admin", "manager", "users", "new-users"] },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          {/* Show Section Title Only on Desktop */}
          <span className="hidden lg:block text-gray-400 font-light my-4 uppercase">
            {section.title}
          </span>

          {section.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center lg:justify-start gap-4 text-gray-300 py-2 px-2 rounded-md hover:bg-gray-800 hover:text-white transition-all duration-200 active:bg-gray-700"
                >
                  {/* Always Show Icons */}
                  <Image src={item.icon} alt={item.label} width={24} height={24} />

                  {/* Only Show Labels on Desktop */}
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
