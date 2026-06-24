import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Authentication is bypassed completely for development/local use
  const mockUser: User = {
    id: 1,
    openId: "mock_user_openid",
    name: "Demo User",
    email: "demo@example.com",
    loginMethod: "mock",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  };

  return {
    req: opts.req,
    res: opts.res,
    user: mockUser,
  };
}
