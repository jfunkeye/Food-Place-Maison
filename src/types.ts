export interface Extra {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price: number;
  rating: number;
  featured: boolean;
  available: boolean;
  preparationTime: number;
}

export interface Review {
  id: string;
  name: string;
  stars: number;
  comment: string;
  date: string;
  photo: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption: string;
}

export interface Settings {
  restaurantName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  preparationTime: number;
  status: 'Open' | 'Closed' | 'Holiday';
  holidayNotice: string;
  businessHours: {
    weekdays: string;
    saturdays: string;
    sundays: string;
  };
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  showDailySpecials: boolean;
  dailySpecialsBanner: string;
  logo?: string;
  favicon?: string;
}

export interface CartItem {
  id: string;
  meal: Meal;
  selectedExtras: (Extra & { quantity: number })[];
  quantity: number;
  specialInstructions: string;
}