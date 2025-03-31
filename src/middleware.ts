import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Fake/temporary email domains ko block karne ke liye list
const blockedEmailDomains = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "throwawaymail.com",
  // Aur domains add kar sakta hai
];

export default clerkMiddleware(async (auth, req) => {
  console.log("Middleware running for:", req.url);

  // API routes ko bypass karo
  if (req.nextUrl.pathname.startsWith("/api")) {
    console.log(`Bypassing middleware for API route: ${req.url}`);
    return NextResponse.next();
  }

  // Check for bot User-Agent
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = /bot|crawler|spider|curl|wget/i.test(userAgent);

  if (isBot) {
    console.log(`Blocking bot access to ${req.url}`);
    return new NextResponse("Access denied for bots", { status: 403 });
  }

  // Sign-up request ke liye email check karo
  if (req.nextUrl.pathname === "/" && req.method === "POST") {
    const body = await req.text();
    try {
      const data = JSON.parse(body || "{}");
      const email = data.email || "";

      if (email) {
        const domain = email.split("@")[1]?.toLowerCase();
        if (blockedEmailDomains.some((blocked) => domain === blocked)) {
          console.log(`Blocking fake email: ${email}`);
          return new NextResponse("Fake or temporary email addresses are not allowed", {
            status: 403,
          });
        }
      }
    } catch (error) {
      console.error("Error parsing request body:", error);
    }
  }

  // Session claims se role fetch karo
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role || "users";

  // Route protection logic
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role)) {
      console.log(`Redirecting ${req.url} to /${role} due to role: ${role}`);
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/", // Homepage ko target karna
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)", // API routes bhi include hain, lekin upar bypass ho jayenge
  ],
};