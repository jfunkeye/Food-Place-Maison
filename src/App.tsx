import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  loadMeals,
  saveMeals,
  loadCategories,
  saveCategories,
  loadExtras,
  saveExtras,
  loadSettings,
  saveSettings,
  loadReviews,
  saveReviews,
  loadGallery,
  saveGallery,
  loadCart,
  saveCart,
  resetStoreToDefaults,
  subscribeToCollection,
  onSettingsUpdate,
} from './data/store';

import { Meal, Category, Extra, Review, GalleryItem, Settings, CartItem } from './types';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MenuCard } from './components/menu/MenuCard';
import { MenuDetailsModal } from './components/menu/MenuDetailsModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { GallerySection } from './components/gallery/GallerySection';
import { ReviewsSection } from './components/reviews/ReviewsSection';
import { AdminPanel } from './components/admin/AdminPanel';
import { Reveal } from './components/ui/Reveal';
import { applyBrandColors } from './utils/colors';
import { api } from './api/client';

import {
  Star, Clock, Phone, MapPin, Leaf, MessageCircle,
  Search, ChevronDown, ChevronUp, ShieldAlert,
} from 'lucide-react';

import heroBg from '../assets/bg.jpg';
import heroImage from '../assets/saw.jpg';

const ADMIN_PATH = '/queen';

function AppContent() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<string>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'available' | 'popular'>('all');

  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});

  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const [featuredActiveIdx, setFeaturedActiveIdx] = useState(0);

  // Check if we're on admin route
  const isAdminRoute = location.pathname === ADMIN_PATH || location.pathname.startsWith(`${ADMIN_PATH}/`);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [m, c, e, s, r, g, ct] = await Promise.all([
          loadMeals(),
          loadCategories(),
          loadExtras(),
          loadSettings(),
          loadReviews(),
          loadGallery(),
          loadCart(),
        ]);

        setMeals(m);
        setCategories(c);
        setExtras(e);
        setSettings(s);
        setReviews(r);
        setGallery(g);
        setCart(ct);
      } catch (error) {
        console.error('Failed to load data:', error);
        showToast('Failed to load data from server', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();

    const unsubscribeMeals = subscribeToCollection('meals', (data) => {
      setMeals(data);
    });

    const unsubscribeCategories = subscribeToCollection('categories', (data) => {
      setCategories(data);
    });

    const unsubscribeExtras = subscribeToCollection('extras', (data) => {
      setExtras(data);
    });

    const unsubscribeSettings = subscribeToCollection('settings', (data) => {
      setSettings(data);
      if (data.primaryColor) {
        applyBrandColors(data.primaryColor, data.secondaryColor, data.accentColor);
      }
    });

    const unsubscribeReviews = subscribeToCollection('reviews', (data) => {
      setReviews(data);
    });

    const unsubscribeGallery = subscribeToCollection('gallery', (data) => {
      setGallery(data);
    });

    return () => {
      unsubscribeMeals();
      unsubscribeCategories();
      unsubscribeExtras();
      unsubscribeSettings();
      unsubscribeReviews();
      unsubscribeGallery();
    };
  }, []);

  // Handle admin route
  useEffect(() => {
    if (isAdminRoute) {
      setCurrentView('admin');
      const loggedIn = localStorage.getItem('foodplace_admin_logged') === 'true';
      if (loggedIn) {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
      } else {
        setShowAdminLogin(true);
        setIsAdminLoggedIn(false);
      }
    } else {
      setShowAdminLogin(false);
      if (currentView === 'admin') {
        setCurrentView('home');
      }
    }
  }, [isAdminRoute]);

  useEffect(() => {
    const unsubscribe = onSettingsUpdate((updatedSettings) => {
      setSettings(updatedSettings);
      if (updatedSettings.primaryColor) {
        applyBrandColors(updatedSettings.primaryColor, updatedSettings.secondaryColor, updatedSettings.accentColor);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMealsChange = async (nextMeals: Meal[]) => {
    setMeals(nextMeals);
    await saveMeals(nextMeals);
  };

  const handleCategoriesChange = async (nextCats: Category[]) => {
    setCategories(nextCats);
    await saveCategories(nextCats);
  };

  const handleExtrasChange = async (nextExtras: Extra[]) => {
    setExtras(nextExtras);
    await saveExtras(nextExtras);
  };

  const handleSettingsChange = async (nextSettings: Settings): Promise<Settings> => {
    setSettings(nextSettings);
    try {
      const savedSettings = await saveSettings(nextSettings);
      setSettings(savedSettings);
      if (savedSettings.primaryColor) {
        applyBrandColors(savedSettings.primaryColor, savedSettings.secondaryColor, savedSettings.accentColor);
      }
      return savedSettings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const handleReviewsChange = async (nextReviews: Review[]) => {
    setReviews(nextReviews);
    await saveReviews(nextReviews);
  };

  const handleGalleryChange = async (nextGallery: GalleryItem[]) => {
    setGallery(nextGallery);
    await saveGallery(nextGallery);
  };

  const handleResetToDefaults = async () => {
    await resetStoreToDefaults();
    const [m, c, e, s, r, g] = await Promise.all([
      loadMeals(),
      loadCategories(),
      loadExtras(),
      loadSettings(),
      loadReviews(),
      loadGallery(),
    ]);
    setMeals(m);
    setCategories(c);
    setExtras(e);
    setSettings(s);
    setReviews(r);
    setGallery(g);
    setCart([]);
    saveCart([]);
    showToast('CMS settings restored to defaults!', 'success');
  };

  const handleAddToCart = (
    meal: Meal,
    selectedExtras: { extra: Extra; quantity: number }[],
    quantity: number,
    instructions: string
  ) => {
    const extraIdsString = selectedExtras
      .map((e) => `${e.extra.id}:${e.quantity}`)
      .sort()
      .join(',');
    const cartItemId = `${meal.id}-${extraIdsString}-${instructions.trim().toLowerCase()}`;

    const finalExtrasList = selectedExtras.map((se) => ({
      ...se.extra,
      quantity: se.quantity,
    }));

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.id === cartItemId);
      let nextCart = [...prevCart];

      if (existingIdx > -1) {
        nextCart[existingIdx].quantity += quantity;
      } else {
        nextCart.push({
          id: cartItemId,
          meal,
          selectedExtras: finalExtrasList,
          quantity,
          specialInstructions: instructions.trim(),
        });
      }
      saveCart(nextCart);
      return nextCart;
    });

    showToast(`${quantity}x ${meal.name} added to cart!`, 'success');
  };

  const handleAddToCartDirect = (meal: Meal) => {
    handleAddToCart(meal, [], 1, '');
  };

  const handleUpdateCartQty = (cartItemId: string, nextQty: number) => {
    setCart((prev) => {
      const updated = prev.map((item) => (item.id === cartItemId ? { ...item, quantity: nextQty } : item));
      saveCart(updated);
      return updated;
    });
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== cartItemId);
      saveCart(updated);
      return updated;
    });
    showToast('Item removed from cart.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    saveCart([]);
    showToast('Cart cleared.', 'info');
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.verifyLogin(adminUsername, adminPassword);
      
      if (result.success) {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
        localStorage.setItem('foodplace_admin_logged', 'true');
        navigate(ADMIN_PATH);
        showToast('Welcome back, admin!', 'success');
      } else {
        showToast(result.message || 'Incorrect login credentials.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Failed to connect to server. Please try again.', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminLogin(false);
    localStorage.removeItem('foodplace_admin_logged');
    navigate('/');
    setCurrentView('home');
    showToast('Logged out of admin console.', 'info');
  };

  const triggerAdminPanelRedirect = () => {
    navigate(ADMIN_PATH);
  };

  const handleFeaturedScroll = () => {
    if (!featuredScrollRef.current) return;
    const container = featuredScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setFeaturedActiveIdx(Math.max(0, Math.min(idx, 3)));
    }
  };

  const toggleFaq = (index: number) => {
    setFaqExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const isClosed = settings?.status === 'Closed' || settings?.status === 'Holiday';

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center p-4">
        <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-montserrat text-xs text-primary font-bold tracking-widest uppercase mt-4">Loading Maison...</p>
      </div>
    );
  }

  const activeCategories = categories.filter((c) => c.enabled);
  const activeMeals = meals.filter((meal) => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || meal.category === selectedCategory;
    let matchesFilter = true;
    if (activeFilter === 'featured') matchesFilter = meal.featured;
    if (activeFilter === 'available') matchesFilter = meal.available;
    if (activeFilter === 'popular') matchesFilter = meal.rating >= 4.9;
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const sortedMeals = [...activeMeals].sort((a, b) => {
    if (priceSort === 'asc') return a.price - b.price;
    if (priceSort === 'desc') return b.price - a.price;
    return 0;
  });

  const featuredList = meals.filter((m) => m.featured && m.available).slice(0, 3);

  const getWhatsAppUrl = () => {
    if (!settings.whatsapp) return '#';
    const cleanNumber = settings.whatsapp.replace(/\s+/g, '').replace(/^0/, '');
    return `https://wa.me/234${cleanNumber}`;
  };

  // Render admin or main content
  const renderContent = () => {
    if (isAdminRoute) {
      return (
        <>
          {showAdminLogin && (
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-150 shadow-xl flex flex-col gap-6 animate-scale-in">
                <div className="text-center">
                  <span className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">🔒</span>
                  <h2 className="font-bebas text-3xl tracking-wide text-gray-900 mt-4">Maison Administration</h2>
                  <p className="text-xs text-gray-400 mt-1">Please login using your manager credentials.</p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-montserrat">Username</label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-montserrat">Password</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white py-3.5 px-4 rounded-xl font-montserrat text-xs font-semibold uppercase tracking-wider shadow-md cursor-pointer transition-colors"
                  >
                    Authenticate CMS
                  </button>
                </form>

                <button
                  onClick={() => {
                    navigate('/');
                    setCurrentView('home');
                  }}
                  className="text-xs text-gray-400 hover:text-primary transition-colors text-center cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          )}

          {isAdminLoggedIn && (
            <AdminPanel
              meals={meals}
              setMeals={handleMealsChange}
              categories={categories}
              setCategories={handleCategoriesChange}
              extras={extras}
              setExtras={handleExtrasChange}
              gallery={gallery}
              setGallery={handleGalleryChange}
              reviews={reviews}
              setReviews={handleReviewsChange}
              settings={settings}
              setSettings={handleSettingsChange}
              onLogout={handleAdminLogout}
              onResetToDefaults={handleResetToDefaults}
              showToast={showToast}
            />
          )}
        </>
      );
    }

    // Main storefront
    return (
      <main className="flex-grow flex flex-col">
        <section id="hero" className="relative py-20 md:py-32 overflow-hidden flex flex-col justify-center bg-neutral-900 text-white min-h-[500px]">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroBg} 
              alt="Nigerian culinary backdrop" 
              className="w-full h-full object-cover filter blur-[3px] scale-105 brightness-[0.35]" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-transparent" />
          </div>

          {isClosed ? (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-6 py-12 bg-white/10 rounded-3xl border border-white/20 animate-fade-in">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="font-bebas text-4xl md:text-5xl text-white uppercase tracking-wide">
                  {settings.status === 'Holiday' ? 'Holiday Notice' : 'Temporarily Closed'}
                </h2>
                <p className="text-white/80 text-sm md:text-base mt-4 max-w-lg mx-auto leading-relaxed">
                  {settings.holidayNotice || 'We are currently taking a short break. We\'ll be back soon with more delicious meals!'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 text-white/60 text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Regular hours resume: {settings.businessHours.weekdays}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#6B7F3B]/35 text-[#d0e599] border border-[#6B7F3B]/40 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-montserrat flex items-center gap-1.5 backdrop-blur-md">
                    <Leaf className="w-3.5 h-3.5" /> Fresh Ingredients
                  </span>
                  <span className="bg-primary/25 text-primary border border-primary/30 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-montserrat flex items-center gap-1.5 backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5" /> 30 Min Preparation
                  </span>
                </div>

                <h1 className="font-bebas text-5xl md:text-7.5xl leading-[0.9] text-white tracking-tight uppercase">
                  Freshly Prepared<br />
                  <span className="text-primary">Meals</span> You'll Love
                </h1>

                <p className="font-sans text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
                  Experience the heart of Nigerian hospitality. FoodPlace Maison prepares premium, bespoke traditional and contemporary dishes made fresh every day with hand-picked organic ingredients.
                </p>

                <div className="flex flex-wrap gap-4 mt-2">
                  <button
                    onClick={() => {
                      const element = document.getElementById('menu');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-montserrat px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transition-all cursor-pointer bg-primary hover:bg-primary/95 text-white shadow-primary/20 hover:scale-105"
                  >
                    Browse Menu
                  </button>
                  <button
                    onClick={() => {
                      const phone = (settings.whatsapp || '').replace(/\s+/g, '').replace(/^0/, '');
                      if (phone) {
                        window.open(`https://wa.me/234${phone}`, '_blank');
                      } else {
                        showToast('WhatsApp number is not configured.', 'info');
                      }
                    }}
                    className="font-montserrat border-2 border-white/80 hover:bg-white hover:text-black px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-white hover:bg-white hover:text-black"
                  >
                    Order on WhatsApp
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:block animate-fade-in py-6">
                <div className="w-[440px] h-[340px] relative mx-auto z-10">
                  <div className="absolute inset-0 bg-primary rounded-[40px] rotate-3 opacity-15"></div>
                  <div className="absolute inset-0 overflow-hidden rounded-[32px] shadow-2xl shadow-primary/30 border border-white/10">
                    <img
                      src={heroImage}
                      alt="Signature smoky jollof and fresh chicken"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {!isClosed && featuredList.length > 0 && (
          <section className="py-20 bg-[#F7F3EC]/40 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal direction="up" delay={0.1}>
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1 px-4.5 rounded-full">
                    Chef's Recommendations
                  </span>
                  <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-gray-900 mt-4">
                    Popular Dishes This Week
                  </h2>
                  <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-3.5" />
                </div>
              </Reveal>

              <Reveal direction="up" delay={0.2}>
                <div className="relative">
                  <div
                    ref={featuredScrollRef}
                    onScroll={handleFeaturedScroll}
                    className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                  >
                    {featuredList.map((meal) => (
                      <div 
                        key={meal.id} 
                        className="min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center shrink-0 md:shrink w-full"
                      >
                        <MenuCard
                          meal={meal}
                          onSelect={setSelectedMeal}
                          onAddToCartDirect={handleAddToCartDirect}
                          currencySymbol={settings.currencySymbol}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-2 mt-4 md:hidden">
                    {featuredList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (featuredScrollRef.current) {
                            const container = featuredScrollRef.current;
                            const itemWidth = container.scrollWidth / featuredList.length;
                            container.scrollTo({ left: idx * itemWidth, behavior: 'smooth' });
                            setFeaturedActiveIdx(idx);
                          }
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          featuredActiveIdx === idx ? 'bg-primary w-5' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        <section id="menu" className="py-24 bg-white border-b border-gray-150 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isClosed ? (
              <div className="text-center py-16">
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-12 max-w-2xl mx-auto">
                  <span className="text-5xl mb-4 block">🌴</span>
                  <h3 className="font-bebas text-3xl text-gray-800">
                    {settings.status === 'Holiday' ? 'We\'re on Holiday Break' : 'Temporarily Closed'}
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    {settings.holidayNotice || 'FoodPlace Maison is currently closed. Our kitchen will be back soon, serving your favorite meals with love.'}
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-2 text-sm text-gray-400">
                    <span>📅 Regular hours resume:</span>
                    <span className="font-semibold text-gray-600">{settings.businessHours.weekdays}</span>
                  </div>
                  <button
                    onClick={() => {
                      const phone = (settings.whatsapp || '').replace(/\s+/g, '').replace(/^0/, '');
                      if (phone) {
                        window.open(`https://wa.me/234${phone}`, '_blank');
                      } else {
                        showToast('WhatsApp number is not configured.', 'info');
                      }
                    }}
                    className="mt-6 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Contact Us for Inquiries
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Reveal direction="up" delay={0.1}>
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between border-b border-gray-150 pb-8 mb-12 gap-6">
                    <div>
                      <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1 px-4.5 rounded-full">
                        Gourmet Catalog
                      </span>
                      <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-gray-900 mt-4">
                        Explore Our Food Menu
                      </h2>
                      <p className="text-xs text-gray-400 mt-2.5 max-w-md">
                        Filter by categories, search matching flavors, and customize extras to build your perfect meal order.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for Jollof, Suya, Drink..."
                          className="w-full bg-[#F7F3EC]/60 border border-gray-200/60 rounded-full pl-10 pr-4 py-2.5 text-xs text-gray-800 outline-none focus:border-primary/50 transition-colors placeholder:text-gray-400 font-sans"
                        />
                      </div>

                      <select
                        value={priceSort}
                        onChange={(e) => setPriceSort(e.target.value as 'none' | 'asc' | 'desc')}
                        className="w-full sm:w-auto bg-[#F7F3EC]/60 border border-gray-200/60 rounded-full px-5 py-2.5 text-xs text-gray-700 outline-none cursor-pointer focus:border-primary/50 font-sans"
                      >
                        <option value="none">Sort by Price</option>
                        <option value="asc">Price: Low to High</option>
                        <option value="desc">Price: High to Low</option>
                      </select>
                    </div>
                  </div>
                </Reveal>

                <Reveal direction="up" delay={0.15}>
                  <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-10 border-b border-gray-100 max-w-full">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`px-5 py-2.5 rounded-full font-montserrat text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 cursor-pointer ${
                        selectedCategory === 'All'
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'bg-[#F7F3EC] text-gray-600 hover:bg-primary/5'
                      }`}
                    >
                      All Items
                    </button>
                    {activeCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-5 py-2.5 rounded-full font-montserrat text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 cursor-pointer ${
                          selectedCategory === cat.name
                            ? 'bg-primary text-white shadow-md shadow-primary/10'
                            : 'bg-[#F7F3EC] text-gray-600 hover:bg-primary/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </Reveal>

                <Reveal direction="up" delay={0.18}>
                  <div className="flex items-center gap-3.5 mb-8 flex-wrap font-sans text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Filters:</span>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeFilter === 'all'
                          ? 'bg-[#333333] border-[#333333] text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => setActiveFilter('featured')}
                      className={`px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeFilter === 'featured'
                          ? 'bg-primary border-primary text-white shadow-sm shadow-primary/10'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      ★ Chef's Specials
                    </button>
                    <button
                      onClick={() => setActiveFilter('available')}
                      className={`px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeFilter === 'available'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      🟢 Available Now
                    </button>
                    <button
                      onClick={() => setActiveFilter('popular')}
                      className={`px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeFilter === 'popular'
                          ? 'bg-[#6B7F3B] border-[#6B7F3B] text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      🔥 Popular (4.9+)
                    </button>
                  </div>
                </Reveal>

                <Reveal direction="up" delay={0.2}>
                  <div>
                    {sortedMeals.length === 0 ? (
                      <div className="bg-[#F7F3EC]/50 rounded-3xl p-16 text-center border border-gray-150 shadow-sm max-w-md mx-auto flex flex-col items-center justify-center">
                        <Search className="w-10 h-10 text-gray-300 stroke-1 mb-4" />
                        <h3 className="font-montserrat text-sm font-bold text-gray-800">No dishes match</h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                          Try adjusting your keyword query or switching filter tabs to locate meals.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6.5">
                        {sortedMeals.map((meal) => (
                          <MenuCard
                            key={meal.id}
                            meal={meal}
                            onSelect={setSelectedMeal}
                            onAddToCartDirect={handleAddToCartDirect}
                            currencySymbol={settings.currencySymbol}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              </>
            )}
          </div>
        </section>

        {!isClosed && <GallerySection gallery={gallery} />}

        <ReviewsSection reviews={reviews} onAddReview={(newReview) => handleReviewsChange([newReview, ...reviews])} />

        <section className="py-20 bg-[#F7F3EC]/40 border-b border-gray-150 overflow-hidden">
          <Reveal direction="up" delay={0.1}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1 px-4 rounded-full">Faq</span>
                <h2 className="font-bebas text-4xl tracking-wide text-gray-900 mt-3">Frequently Asked Questions</h2>
                <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-3" />
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { q: "How fast is delivery inside Port Harcourt?", a: "We package and hand over meals to third-party riders within 30 minutes. The total delivery duration depends on your physical location, and delivery rates are negotiated transparently on WhatsApp." },
                  { q: "What payment options do you support?", a: "We currently accept bank transfers and secure mobile payments. Payments are confirmed directly in our WhatsApp support thread before the kitchen starts preparation." },
                  { q: "Can I pre-order meals for corporate events or family gatherings?", a: "Absolutely! For large-scale premium catering, contact us on WhatsApp at least 24 hours in advance to arrange dynamic menus, pricing structures, and deliveries." },
                  { q: "What ingredients do you cook with?", a: "We prioritize local organic produce, premium oils, fresh tomatoes, and certified proteins (Turkey, Chicken, Beef, Snails). Every recipe is slow-cooked from scratch with zero added artificial preservatives." }
                ].map((faq, idx) => {
                  const isOpen = !!faqExpanded[idx];
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between p-5 text-left font-montserrat font-bold text-xs md:text-sm text-gray-800 hover:text-primary cursor-pointer transition-colors outline-none"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="p-5 border-t border-gray-50 text-xs md:text-sm text-gray-500 leading-relaxed bg-[#F7F3EC]/20 animate-scale-in">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </section>

        <section id="about" className="py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal direction="left" delay={0.1}>
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1 px-4.5 rounded-full">
                    Physical Location
                  </span>
                  <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-gray-900 mt-4">
                    Our Maison Kitchen
                  </h2>
                </div>

                <p className="font-sans text-sm text-gray-500 leading-relaxed">
                  FoodPlace Maison operates from our hygienic commercial kitchen in Port Harcourt. We invite you to pre-order, trace your delivery status, or request custom-tailored ingredients lists for special dietary rules.
                </p>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-start gap-3 bg-[#F7F3EC] p-4.5 rounded-2xl border border-primary/5">
                    <MapPin className="w-5.5 h-5.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-montserrat text-xs font-bold text-gray-800 uppercase tracking-wide">Street Address</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{settings.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-[#F7F3EC] p-4.5 rounded-2xl border border-primary/5">
                    <Phone className="w-5.5 h-5.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-montserrat text-xs font-bold text-gray-800 uppercase tracking-wide">Call support</h4>
                      <p className="text-xs text-gray-500 mt-1">{settings.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={0.2} className="w-full h-full">
              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-gray-150 shadow-md relative bg-gray-50">
                <iframe
                  title="FoodPlace Maison Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.3995648834645!2d6.9859265747631845!3d4.872477895103681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2sNo.15%20Okwu%20Amadi%20Close%2C%20Rumuagholu%2C%20Port%20Harcourt%20Rivers%20State!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                  className="w-full h-full border-0 absolute inset-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20 selection:text-primary">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartOpen={() => setCartOpen(true)}
        settings={settings}
        onAdminClick={triggerAdminPanelRedirect}
        showToast={showToast}
      />

      {renderContent()}

      <Footer
        settings={settings}
        onViewChange={setCurrentView}
        onAdminClick={triggerAdminPanelRedirect}
      />

      <MobileBottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartOpen={() => setCartOpen(true)}
        onAdminClick={triggerAdminPanelRedirect}
      />

      <a
        href={!isClosed && settings.whatsapp ? getWhatsAppUrl() : '#'}
        target={!isClosed ? '_blank' : undefined}
        rel={!isClosed ? 'noopener noreferrer' : undefined}
        onClick={(e) => {
          if (isClosed) {
            e.preventDefault();
            showToast(settings.holidayNotice || 'We are currently closed. Please try again during business hours!', 'info');
          } else if (!settings.whatsapp) {
            e.preventDefault();
            showToast('WhatsApp number is not configured.', 'info');
          }
        }}
        className={`fixed bottom-22 md:bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all hover:scale-110 cursor-pointer flex items-center justify-center z-40 group border border-white/20 ${
          !isClosed && settings.whatsapp
            ? 'bg-[#25D366] hover:bg-[#128C7E]' 
            : 'bg-gray-400 cursor-not-allowed hover:scale-100'
        }`}
      >
        <MessageCircle className="w-6 h-6 text-white fill-current shrink-0" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all text-[11px] font-semibold font-montserrat uppercase tracking-wider text-white pl-0 group-hover:pl-2">
          {!isClosed ? 'Chat support' : 'Currently Closed'}
        </span>
      </a>

      <MenuDetailsModal
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onAddToCart={handleAddToCart}
        allExtras={extras}
        currencySymbol={settings.currencySymbol}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateCartQty={handleUpdateCartQty}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        settings={settings}
        showToast={showToast}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
