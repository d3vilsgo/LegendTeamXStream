import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  apiHost: text("api_host"),
  apiUsername: text("api_username"),
  apiPassword: text("api_password"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: text("content_type").notNull(), // 'live', 'vod', 'series'
  streamId: text("stream_id").notNull(),
  streamName: text("stream_name").notNull(),
  streamIcon: text("stream_icon"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentHistory = pgTable("content_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: text("content_type").notNull(), // 'live', 'vod', 'series'
  streamId: text("stream_id").notNull(),
  streamName: text("stream_name").notNull(),
  streamIcon: text("stream_icon"),
  lastWatched: timestamp("last_watched").defaultNow(),
  watchDuration: integer("watch_duration"), // in seconds
  progress: integer("progress"), // in seconds, for vod/series
  metadata: json("metadata"), // Additional info like episode/season for series
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  playerSettings: json("player_settings"), // e.g. preferred quality, subtitle settings
  uiSettings: json("ui_settings"), // e.g. dark mode, content grid size
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for each table
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  profilePicture: true,
  apiHost: true,
  apiUsername: true,
  apiPassword: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).pick({
  userId: true,
  contentType: true,
  streamId: true,
  streamName: true,
  streamIcon: true,
  category: true,
});

export const insertContentHistorySchema = createInsertSchema(contentHistory).pick({
  userId: true,
  contentType: true,
  streamId: true,
  streamName: true,
  streamIcon: true,
  watchDuration: true,
  progress: true,
  metadata: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  playerSettings: true,
  uiSettings: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;

export type InsertContentHistory = z.infer<typeof insertContentHistorySchema>;
export type ContentHistory = typeof contentHistory.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Frontend interfaces for API data
export type ContentMode = 'live' | 'vod' | 'series' | 'favorites' | 'history';

export interface Category {
  category_id: string;
  category_name: string;
}

export interface MediaItem {
  stream_id: number;
  name: string;
  stream_icon?: string;
  stream_url?: string;
  category_id: string;
  category_name?: string;
  cover?: string;
  movie_image?: string;
  container_extension?: string;
  isFavorite?: boolean; // Flag to indicate if this is a favorite
}

export interface AuthCredentials {
  username: string;
  password: string;
  host: string;
}

export interface XtreamUserInfo {
  user_info: {
    username: string;
    password: string;
    status: string;
    exp_date: string;
    active_cons: string;
    is_trial: string;
    max_connections: string;
    created_at: string;
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
  };
}

export interface XtreamConnection {
  credentials: AuthCredentials;
  userInfo?: XtreamUserInfo;
  baseUrl: string;
}
