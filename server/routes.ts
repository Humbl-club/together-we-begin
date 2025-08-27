import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // All API functionality is handled directly by Supabase
  // This Express server only serves the React PWA
  
  const httpServer = createServer(app);
  return httpServer;
}
