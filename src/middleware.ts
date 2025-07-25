import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/((?!api|login|signup|_next/static|_next/image|favicon.ico).*)"],
};