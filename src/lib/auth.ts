// TODO: Configure NextAuth.js with providers and adapter
// This is a placeholder until auth is fully configured

import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    // TODO: Add providers (Google, GitHub, etc.)
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // @ts-expect-error - role is added by our schema
        session.user.role = user.role;
      }
      return session;
    },
  },
});
