import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu as MenuIcon, Phone, MapPin, ShieldAlert, Heart } from 'lucide-react';
import { Settings } from '../../types';
import logo from '../../../assets/logo.jpg';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  cartCount: number;
  onCartOpen: () => void;
  settings: Settings;
  onAdminClick: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  cartCount,
  onCartOpen,
  settings,
  onAdminClick,
  showToast,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'about', label: 'About & Contact' },
  ];

  const handleNavClick = (id: string) => {
    onViewChange(id);
    setMobileMenuOpen(false);
    
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isClosed = settings.status === 'Closed' || settings.status === 'Holiday';

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    let animationId: number;
    let startTime: number | null = null;
    const duration = 15000;
    const contentWidth = banner.scrollWidth;

    if (contentWidth <= banner.clientWidth) return;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      const maxScroll = contentWidth - banner.clientWidth;
      const scrollPosition = progress * maxScroll;
      
      banner.scrollLeft = scrollPosition;
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [settings.dailySpecialsBanner]);

  const logoUrl = settings.logo || logo;

  return (
    <>
      {settings.showDailySpecials && settings.dailySpecialsBanner && !isClosed && (
        <div className="w-full bg-primary text-white text-xs md:text-sm py-2 px-4 text-center font-montserrat tracking-wide flex items-center justify-center gap-2 relative z-50 overflow-hidden">
          <span className="animate-pulse shrink-0">🔥</span>
          <div 
            ref={bannerRef}
            className="flex-1 overflow-x-auto scrollbar-none whitespace-nowrap"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <p className="font-medium inline-block animate-scroll-banner">
              {settings.dailySpecialsBanner}
            </p>
          </div>
          <span className="animate-pulse shrink-0">🔥</span>
        </div>
      )}

      {isClosed && settings.holidayNotice && (
        <div className="w-full bg-amber-600 text-white text-xs md:text-sm py-2 px-4 text-center font-montserrat tracking-wide flex items-center justify-center gap-2 relative z-50 animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <p className="font-medium truncate">{settings.holidayNotice}</p>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full glass transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group text-left shrink-0"
          >
            <img 
              src={logoUrl} 
              alt={settings.restaurantName} 
              className="w-10 h-10 object-contain rounded-full border border-primary/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 bg-primary text-white flex items-center justify-center rounded-full shadow-md font-bebas text-xl group-hover:scale-105 transition-transform';
                  fallback.textContent = settings.restaurantName.charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
            <div className="hidden sm:block">
              <h1 className="font-bebas text-2xl tracking-tighter text-primary leading-none">
                {settings.restaurantName === "FoodPlace Maison" ? (
                  <>
                    FoodPlace <span className="font-light text-secondary">Maison</span>
                  </>
                ) : (
                  settings.restaurantName
                )}
              </h1>
              <p className="font-sans text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                {settings.tagline}
              </p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`font-sans text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer relative py-2 ${
                    isActive ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {isClosed && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{settings.status === 'Holiday' ? 'Holiday' : 'Closed'}</span>
              </div>
            )}

            <button
              onClick={onCartOpen}
              className="relative p-2 text-primary hover:bg-primary/5 rounded-full transition-colors cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5.5 h-5.5" />
              {cartCount > 0 && !isClosed && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isClosed) {
                  showToast?.(settings.holidayNotice || 'We are currently closed. Please check back during business hours!', 'info');
                  return;
                }
                handleNavClick('menu');
              }}
              className={`font-btn px-6 py-2.5 rounded-full text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer ${
                isClosed 
                  ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' 
                  : 'bg-primary text-white shadow-primary/20 hover:bg-secondary hover:-translate-y-0.5'
              }`}
            >
              {isClosed ? 'Currently Closed' : 'Order Now'}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-3 shrink-0">
            <button
              onClick={onCartOpen}
              className="relative p-2 text-primary cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && !isClosed && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-primary cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-lg py-4 px-6 flex flex-col gap-4 animate-fade-in z-50">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left py-2 font-sans text-base font-medium ${
                  currentView === item.id ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <button
              onClick={() => {
                if (isClosed) {
                  showToast?.(settings.holidayNotice || 'We are currently closed.', 'info');
                  return;
                }
                handleNavClick('menu');
                setMobileMenuOpen(false);
              }}
              className={`text-center py-3 rounded-xl font-montserrat text-sm font-semibold tracking-wider uppercase shadow-sm ${
                isClosed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white'
              }`}
            >
              {isClosed ? 'Currently Closed' : 'Browse Menu'}
            </button>
          </div>
        )}
      </header>

      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        @keyframes scrollBanner {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-banner {
          display: inline-block;
          animation: scrollBanner 15s linear infinite;
          padding-right: 2rem;
        }
      `}</style>
    </>
  );
};