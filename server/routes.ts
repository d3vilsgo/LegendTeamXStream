import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { 
  insertUserFavoriteSchema, 
  insertContentHistorySchema, 
  insertUserSettingsSchema,
  type InsertUserFavorite,
  type InsertContentHistory,
  type InsertUserSettings,
  type MediaItem
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api
  
  // Heartbeat endpoint
  app.get('/api/heartbeat', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Xtream API Authentication
  app.post('/api/xtream/authenticate', async (req, res) => {
    try {
      const { host, username, password } = req.body;
      
      if (!host || !username || !password) {
        return res.status(400).json({ 
          error: 'Missing credentials', 
          message: 'Host, username and password are required' 
        });
      }
      
      // Make sure host is properly formatted
      const formattedHost = host.startsWith('http') ? host : `http://${host}`;
      
      // Call the Xtream API to authenticate
      const url = `${formattedHost}/player_api.php?username=${username}&password=${password}`;
      console.log(`Authenticating with Xtream API: ${url}`);
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data?.user_info?.auth === 0) {
        return res.status(401).json({ 
          error: 'Authentication failed', 
          message: 'Invalid credentials' 
        });
      }
      
      // Return the user info
      res.json({
        user_info: response.data.user_info,
        server_info: {
          url: formattedHost,
          port: formattedHost.includes(':') ? formattedHost.split(':')[2] : '80',
          https_port: '443',
          server_protocol: formattedHost.startsWith('https') ? 'https' : 'http',
        }
      });
    } catch (error) {
      console.error('Xtream authentication error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          return res.status(503).json({
            error: 'Connection failed',
            message: 'Could not connect to the Xtream server'
          });
        }
        res.status(error.response?.status || 500).json({ 
          error: 'Authentication failed', 
          message: error.message,
          details: error.response?.data
        });
      } else {
        res.status(500).json({ 
          error: 'Authentication failed', 
          message: String(error) 
        });
      }
    }
  });

  // Xtream API proxy
  app.get('/api/xtream/player_api.php', async (req, res) => {
    try {
      const { username, password, action, category_id, series_id } = req.query;
      
      // Build the URL for the actual Xtream API
      const baseUrl = req.query.host as string || "http://sorunsuztv.xyz:8080";
      let url = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
      
      if (action) url += `&action=${action}`;
      if (category_id) url += `&category_id=${category_id}`;
      if (series_id) url += `&series_id=${series_id}`;

      console.log(`Proxying request to: ${url}`);
      
      const response = await axios.get(url);
      res.json(response.data);
    } catch (error) {
      console.error('Xtream API proxy error:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({ 
          error: 'API request failed', 
          message: error.message,
          details: error.response?.data
        });
      } else {
        res.status(500).json({ error: 'API request failed', message: String(error) });
      }
    }
  });

  // Xtream streams proxy
  app.get('/api/xtream/:streamType/:username/:password/:streamId', async (req, res) => {
    try {
      const { streamType, username, password, streamId } = req.params;
      const host = req.query.host as string || "http://sorunsuztv.xyz:8080";
      const extension = req.query.extension as string || 'ts';
      
      // Make sure host is properly formatted
      let formattedHost = host.startsWith('http') ? host : `http://${host}`;
      
      // Remove trailing slashes if any
      formattedHost = formattedHost.replace(/\/+$/, '');
      
      // Log host information for debugging
      console.log(`Stream request - Host: ${formattedHost}, Type: ${streamType}, ID: ${streamId}`);
      
      // Build the URL based on stream type
      let url = '';
      if (streamType === 'live') {
        url = `${formattedHost}/live/${username}/${password}/${streamId}.${extension}`;
      } else if (streamType === 'movie') {
        url = `${formattedHost}/movie/${username}/${password}/${streamId}.${extension}`;
      } else if (streamType === 'series') {
        url = `${formattedHost}/series/${username}/${password}/${streamId}.${extension}`;
      } else {
        return res.status(400).json({ error: 'Invalid stream type' });
      }
      
      // Add debug URL to response headers
      res.setHeader('X-Debug-Stream-URL', url);
      
      // Log the full stream URL for debugging
      console.log(`Full stream URL: ${url}`);
      
      console.log(`Proxying stream from: ${url}`);
      
      // Check if the stream is accessible first
      try {
        await axios.head(url, { timeout: 5000 });
      } catch (headError: any) {
        console.warn(`HEAD request failed for ${url}, proceeding anyway:`, headError.message || 'Unknown error');
        // Continue anyway - some servers don't support HEAD requests
      }
      
      // Instead of redirecting, proxy the actual stream
      const streamResponse = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 10000,
        validateStatus: (status) => status < 500, // Accept 2xx, 3xx, and 4xx responses
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
          'Referer': formattedHost,
        }
      });
      
      // Handle 4xx errors
      if (streamResponse.status >= 400) {
        return res.status(streamResponse.status).json({
          error: `Stream not available (${streamResponse.status})`,
          message: 'The requested stream could not be accessed'
        });
      }
      
      // Set all relevant headers from the source
      Object.entries(streamResponse.headers)
        .filter(([key]) => !['transfer-encoding', 'connection'].includes(key.toLowerCase()))
        .forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      
      // Allow CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Handle errors in the stream
      streamResponse.data.on('error', (err: Error) => {
        console.error('Stream data error:', err);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream data error', message: err.message });
        }
      });
      
      // Pipe the stream directly to the response
      streamResponse.data.pipe(res);
    } catch (error) {
      console.error('Stream proxy error:', error);
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status || 500).json({ 
          error: `Stream request failed (${error.response.status})`, 
          message: error.message,
          details: error.response.statusText
        });
      } else {
        res.status(500).json({ 
          error: 'Stream request failed', 
          message: String(error)
        });
      }
    }
  });

  // User API
  app.get('/api/user/profile', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // User Favorites API
  app.get('/api/favorites', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const favorites = await storage.getUserFavorites(userId);
      res.json({ favorites });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  app.post('/api/favorites', async (req, res) => {
    try {
      const parsedData = insertUserFavoriteSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: parsedData.error.errors 
        });
      }

      const favorite = await storage.addFavorite(parsedData.data);
      res.status(201).json({ favorite });
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  });

  app.delete('/api/favorites', async (req, res) => {
    try {
      const { userId, contentType, streamId } = req.body;

      if (!userId || !contentType || !streamId) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'userId, contentType, and streamId are required'
        });
      }

      const removed = await storage.removeFavorite(userId, contentType, streamId);
      if (removed) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Favorite not found' });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Failed to remove favorite' });
    }
  });

  app.get('/api/favorites/check', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const contentType = req.query.contentType as string;
      const streamId = req.query.streamId as string;

      if (!userId || !contentType || !streamId) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          details: 'userId, contentType, and streamId are required'
        });
      }

      const isFavorited = await storage.isFavorite(userId, contentType, streamId);
      res.json({ isFavorited });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ error: 'Failed to check favorite status' });
    }
  });

  // User History API
  app.get('/api/history', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await storage.getUserHistory(userId);
      res.json({ history });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  app.post('/api/history', async (req, res) => {
    try {
      const parsedData = insertContentHistorySchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: parsedData.error.errors 
        });
      }

      const historyEntry = await storage.addOrUpdateHistory(parsedData.data);
      res.status(201).json({ historyEntry });
    } catch (error) {
      console.error('Error updating history:', error);
      res.status(500).json({ error: 'Failed to update history' });
    }
  });

  app.delete('/api/history', async (req, res) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const cleared = await storage.clearHistory(userId);
      if (cleared) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'No history found for this user' });
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      res.status(500).json({ error: 'Failed to clear history' });
    }
  });

  // User Settings API
  app.get('/api/settings', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        return res.json({ settings: null });
      }
      
      res.json({ settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const parsedData = insertUserSettingsSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: parsedData.error.errors 
        });
      }

      const settings = await storage.createOrUpdateUserSettings(parsedData.data);
      res.status(201).json({ settings });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
