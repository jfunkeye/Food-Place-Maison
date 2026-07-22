import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

class ApiClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
      });

      this.socket.on('data-updated', ({ collection, data }) => {
        const callbacks = this.listeners.get(collection);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(data);
            } catch (err) {
              console.error(`Error in callback for ${collection}:`, err);
            }
          });
        }
      });

      this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
      });

      this.socket.on('data-error', ({ collection, message }) => {
        console.error(`Data error for ${collection}:`, message);
      });
    } catch (error) {
      console.warn('WebSocket init failed:', error);
    }
  }

  subscribe(collection: string, callback: (data: any) => void) {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(callback);
    
    return () => {
      const callbacks = this.listeners.get(collection);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  async get<T>(collection: string): Promise<T> {
    const url = `${API_BASE}/${collection}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${collection}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`GET ${collection} failed:`, error);
      throw error;
    }
  }

  async put(collection: string, data: any): Promise<any> {
    const url = `${API_BASE}/${collection}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update ${collection}: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (this.socket?.connected) {
        this.socket.emit('data-changed', { 
          collection, 
          data, 
          timestamp: Date.now() 
        });
        
        const callbacks = this.listeners.get(collection);
        if (callbacks) {
          const savedData = result.settings || result.data || data;
          callbacks.forEach(callback => {
            try {
              callback(savedData);
            } catch (err) {
              console.error(`Error in immediate callback for ${collection}:`, err);
            }
          });
        }
      } else {
        const callbacks = this.listeners.get(collection);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(data);
            } catch (err) {
              console.error(`Error in callback for ${collection}:`, err);
            }
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error(`PUT ${collection} failed:`, error);
      throw error;
    }
  }

  async restore(data: any): Promise<void> {
    const url = `${API_BASE}/../restore`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to restore data: ${response.status}`);
    }
  }

  async verifyLogin(username: string, password: string): Promise<{ success: boolean; message: string; username?: string }> {
    const url = `${API_BASE}/login/verify`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }

  async refresh(collection: string): Promise<any> {
    return this.get(collection);
  }

  async getAllData(): Promise<any> {
    const url = `${API_BASE}/export`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch all data: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();