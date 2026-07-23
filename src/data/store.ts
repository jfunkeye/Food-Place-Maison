import { Meal, Category, Extra, Review, GalleryItem, Settings, CartItem } from '../types';
import { applyBrandColors } from '../utils/colors';
import { api } from '../api/client';


const API_BASE = import.meta.env.VITE_API_URL;
const CART_KEY = 'foodplace_cart';

async function apiGet<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE}/${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function apiPut(endpoint: string, data: any): Promise<any> {
  const url = `${API_BASE}/${endpoint}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update ${endpoint}: ${response.status} ${errorText}`);
  }
  return await response.json();
}

export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export async function loadMeals(): Promise<Meal[]> {
  try {
    const meals = await apiGet<Meal[]>('meals');
    return meals;
  } catch (error) {
    console.error('Failed to load meals:', error);
    return [];
  }
}

export async function saveMeals(meals: Meal[]): Promise<void> {
  try {
    await api.put('meals', meals);
  } catch (error) {
    console.error('Failed to save meals:', error);
    throw error;
  }
}

export async function loadCategories(): Promise<Category[]> {
  try {
    const categories = await apiGet<Category[]>('categories');
    return categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await api.put('categories', categories);
  } catch (error) {
    console.error('Failed to save categories:', error);
    throw error;
  }
}

export async function loadExtras(): Promise<Extra[]> {
  try {
    const extras = await apiGet<Extra[]>('extras');
    return extras;
  } catch (error) {
    console.error('Failed to load extras:', error);
    return [];
  }
}

export async function saveExtras(extras: Extra[]): Promise<void> {
  try {
    await api.put('extras', extras);
  } catch (error) {
    console.error('Failed to save extras:', error);
    throw error;
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const settings = await apiGet<Settings>('settings');
    
    if (settings.primaryColor) {
      applyBrandColors(settings.primaryColor, settings.secondaryColor, settings.accentColor);
    }
    
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {} as Settings;
  }
}

let settingsUpdateCallbacks: ((settings: Settings) => void)[] = [];

export function onSettingsUpdate(callback: (settings: Settings) => void) {
  settingsUpdateCallbacks.push(callback);
  return () => {
    settingsUpdateCallbacks = settingsUpdateCallbacks.filter(cb => cb !== callback);
  };
}

function notifySettingsUpdate(settings: Settings) {
  settingsUpdateCallbacks.forEach(callback => {
    try {
      callback(settings);
    } catch (err) {
      console.error('Error in settings callback:', err);
    }
  });
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  try {
    const result = await api.put('settings', settings);
    
    if (settings.primaryColor) {
      applyBrandColors(settings.primaryColor, settings.secondaryColor, settings.accentColor);
    }
    
    const savedSettings = (result && result.settings) ? result.settings : settings;
    
    notifySettingsUpdate(savedSettings);
    
    return savedSettings;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export async function loadReviews(): Promise<Review[]> {
  try {
    const reviews = await apiGet<Review[]>('reviews');
    return reviews;
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return [];
  }
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  try {
    await api.put('reviews', reviews);
  } catch (error) {
    console.error('Failed to save reviews:', error);
    throw error;
  }
}

export async function loadGallery(): Promise<GalleryItem[]> {
  try {
    const gallery = await apiGet<GalleryItem[]>('gallery');
    return gallery;
  } catch (error) {
    console.error('Failed to load gallery:', error);
    return [];
  }
}

export async function saveGallery(gallery: GalleryItem[]): Promise<void> {
  try {
    await api.put('gallery', gallery);
  } catch (error) {
    console.error('Failed to save gallery:', error);
    throw error;
  }
}

export function loadCart(): CartItem[] {
  try {
    const data = localStorage.getItem(CART_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error parsing cart', e);
  }
  return [];
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export async function resetStoreToDefaults(): Promise<void> {
  try {
    const defaultMeals = await import('../../server/data/menu.json');
    const defaultCategories = await import('../../server/data/categories.json');
    const defaultExtras = await import('../../server/data/extras.json');
    const defaultSettings = await import('../../server/data/settings.json');
    const defaultReviews = await import('../../server/data/reviews.json');
    const defaultGallery = await import('../../server/data/gallery.json');

    await api.put('meals', defaultMeals.default);
    await api.put('categories', defaultCategories.default);
    await api.put('extras', defaultExtras.default);
    await api.put('settings', defaultSettings.default);
    await api.put('reviews', defaultReviews.default);
    await api.put('gallery', defaultGallery.default);
  } catch (error) {
    console.error('Failed to reset to defaults:', error);
    throw error;
  }
}

export function subscribeToCollection(collection: string, callback: (data: any) => void) {
  return api.subscribe(collection, callback);
}

export async function refreshCollection(collection: string): Promise<any> {
  return api.refresh(collection);
}

export async function refreshAllData(): Promise<any> {
  return api.getAllData();
}
