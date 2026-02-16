import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "promoter" | "admin";
    } & DefaultSession["user"];
  }
}

export type UserRole = "user" | "promoter" | "admin";
