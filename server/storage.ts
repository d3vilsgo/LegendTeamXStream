import { 
  users, 
  userFavorites, 
  contentHistory, 
  userSettings,
  type User, 
  type InsertUser, 
  type UserFavorite, 
  type InsertUserFavorite,
  type ContentHistory,
  type InsertContentHistory,
  type UserSettings,
  type InsertUserSettings
} from "@shared/schema";

/**
 * Storage interface defining all CRUD operations
 */
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Favorites methods
  getUserFavorites(userId: number): Promise<UserFavorite[]>;
  addFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeFavorite(userId: number, contentType: string, streamId: string): Promise<boolean>;
  isFavorite(userId: number, contentType: string, streamId: string): Promise<boolean>;
  
  // History methods
  getUserHistory(userId: number): Promise<ContentHistory[]>;
  addOrUpdateHistory(history: InsertContentHistory): Promise<ContentHistory>;
  clearHistory(userId: number): Promise<boolean>;
  
  // Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
}

/**
 * In-memory implementation of IStorage
 */
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private favoritesMap: Map<number, UserFavorite[]>;
  private historyMap: Map<number, ContentHistory[]>;
  private settingsMap: Map<number, UserSettings>;
  private currentIds: {
    users: number;
    favorites: number;
    history: number;
    settings: number;
  };

  constructor() {
    this.usersMap = new Map();
    this.favoritesMap = new Map();
    this.historyMap = new Map();
    this.settingsMap = new Map();
    this.currentIds = {
      users: 1,
      favorites: 1,
      history: 1,
      settings: 1
    };
  }

  //#region User Methods
  
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const id = this.currentIds.users++;
    const user: User = { 
      ...insertUser, 
      id,
      displayName: insertUser.displayName || null,
      profilePicture: insertUser.profilePicture || null,
      apiHost: insertUser.apiHost || null,
      apiUsername: insertUser.apiUsername || null,
      apiPassword: insertUser.apiPassword || null,
      createdAt: now 
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.usersMap.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...userData
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  //#endregion

  //#region Favorites Methods
  
  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    return this.favoritesMap.get(userId) || [];
  }
  
  async addFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const now = new Date();
    const id = this.currentIds.favorites++;
    
    const newFavorite: UserFavorite = {
      ...favorite,
      id,
      streamIcon: favorite.streamIcon || null,
      category: favorite.category || null,
      createdAt: now
    };
    
    // Initialize array if it doesn't exist
    if (!this.favoritesMap.has(favorite.userId)) {
      this.favoritesMap.set(favorite.userId, []);
    }
    
    // Check if it already exists (same user, content type and stream id)
    const userFavorites = this.favoritesMap.get(favorite.userId)!;
    const existingIndex = userFavorites.findIndex(
      f => f.contentType === favorite.contentType && f.streamId === favorite.streamId
    );
    
    if (existingIndex >= 0) {
      // Update existing
      userFavorites[existingIndex] = {
        ...userFavorites[existingIndex],
        ...favorite,
        id: userFavorites[existingIndex].id, // Keep same ID
      };
      return userFavorites[existingIndex];
    } else {
      // Add new
      userFavorites.push(newFavorite);
      return newFavorite;
    }
  }
  
  async removeFavorite(userId: number, contentType: string, streamId: string): Promise<boolean> {
    const userFavorites = this.favoritesMap.get(userId);
    if (!userFavorites) return false;
    
    const initialLength = userFavorites.length;
    const newFavorites = userFavorites.filter(
      f => !(f.contentType === contentType && f.streamId === streamId)
    );
    
    if (newFavorites.length < initialLength) {
      this.favoritesMap.set(userId, newFavorites);
      return true;
    }
    
    return false;
  }
  
  async isFavorite(userId: number, contentType: string, streamId: string): Promise<boolean> {
    const userFavorites = this.favoritesMap.get(userId);
    if (!userFavorites) return false;
    
    return userFavorites.some(
      f => f.contentType === contentType && f.streamId === streamId
    );
  }
  
  //#endregion

  //#region History Methods
  
  async getUserHistory(userId: number): Promise<ContentHistory[]> {
    return this.historyMap.get(userId) || [];
  }
  
  async addOrUpdateHistory(history: InsertContentHistory): Promise<ContentHistory> {
    const now = new Date();
    
    // Initialize array if it doesn't exist
    if (!this.historyMap.has(history.userId)) {
      this.historyMap.set(history.userId, []);
    }
    
    const userHistory = this.historyMap.get(history.userId)!;
    const existingIndex = userHistory.findIndex(
      h => h.contentType === history.contentType && h.streamId === history.streamId
    );
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedHistory: ContentHistory = {
        ...userHistory[existingIndex],
        ...history,
        streamIcon: history.streamIcon || null,
        watchDuration: history.watchDuration || null,
        progress: history.progress || null,
        metadata: history.metadata || null,
        lastWatched: now // Always update timestamp
      };
      userHistory[existingIndex] = updatedHistory;
      return updatedHistory;
    } else {
      // Add new
      const id = this.currentIds.history++;
      const newHistory: ContentHistory = {
        ...history,
        id,
        streamIcon: history.streamIcon || null,
        watchDuration: history.watchDuration || null,
        progress: history.progress || null,
        metadata: history.metadata || null,
        lastWatched: now
      };
      userHistory.push(newHistory);
      
      // Sort by lastWatched (newest first)
      userHistory.sort((a, b) => {
        const dateA = a.lastWatched instanceof Date ? a.lastWatched.getTime() : 0;
        const dateB = b.lastWatched instanceof Date ? b.lastWatched.getTime() : 0;
        return dateB - dateA;
      });
      
      return newHistory;
    }
  }
  
  async clearHistory(userId: number): Promise<boolean> {
    if (!this.historyMap.has(userId)) return false;
    this.historyMap.set(userId, []);
    return true;
  }
  
  //#endregion

  //#region Settings Methods
  
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.settingsMap.get(userId);
  }
  
  async createOrUpdateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const now = new Date();
    
    const existingSettings = this.settingsMap.get(settings.userId);
    if (existingSettings) {
      // Update existing
      const updatedSettings: UserSettings = {
        ...existingSettings,
        ...settings,
        playerSettings: settings.playerSettings || null,
        uiSettings: settings.uiSettings || null,
        updatedAt: now
      };
      this.settingsMap.set(settings.userId, updatedSettings);
      return updatedSettings;
    } else {
      // Create new
      const id = this.currentIds.settings++;
      const newSettings: UserSettings = {
        ...settings,
        id,
        playerSettings: settings.playerSettings || null,
        uiSettings: settings.uiSettings || null,
        createdAt: now,
        updatedAt: now
      };
      this.settingsMap.set(settings.userId, newSettings);
      return newSettings;
    }
  }
  
  //#endregion
}

// Export a singleton instance
export const storage = new MemStorage();
