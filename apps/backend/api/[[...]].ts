// This file is the entry point for Vercel serverless functions
// It imports from the built dist folder (build must run first)
// The [[...]] syntax creates a catch-all route that handles all paths
import { createApp } from '../dist/src/main.js';
import { Request, Response } from 'express';

let appInstance: any;

/**
 * Serverless handler for Vercel
 * This function is called for each request in a serverless environment
 */
export default async function handler(req: Request, res: Response) {
  // Initialize the app instance on first request (lazy initialization)
  if (!appInstance) {
    const app = await createApp();
    // Get the underlying Express instance from NestJS
    appInstance = app.getHttpAdapter().getInstance();
  }

  // Forward the request to the Express app
  return appInstance(req, res);
}

