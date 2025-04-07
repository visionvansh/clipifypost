
export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/users(.*)": ["users"],
  "/manager(.*)": ["manager"],
  "/new-users(.*)": ["new-users"],
  "/list/manager": ["admin"],
  "/list/users": ["admin", "manager"],
  "/list/new-users": [ "manager"],
  "/list/positions": ["admin", "manager", "users", "new-users"],
  "/list/social-profiles": ["admin"],
  "/list/paste-link": ["manager", "users", "new-users"],
  "/list/add-social-profile": [ "users", "manager", "new-users"],
  "/list/revenue": ["admin", "manager", "users", "new-users"],
  "/list/attendance": ["admin", "manager", "users", "new-users"],
  "/list/events": ["admin", "manager", "users", "new-users"],
  "/list/announcements": ["admin", "manager", "users", "new-users"],
};
