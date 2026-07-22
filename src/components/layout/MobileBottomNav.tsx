import React from 'react';
import { Home, Utensils, Image, Star, ShoppingBag } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  cartCount: number;
  onCartOpen: () => void;
  onAdminClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  cartCount,
  onCartOpen,
  onAdminClick,
}) => {
  const handleNavClick = (id: string) => {
    onViewChange(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-4 py-2 flex items-center justify-between pb-safe">
      <button
        onClick={() => handleNavClick('home')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${
          currentView === 'home' ? 'text-primary' : 'text-gray-400'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button
        onClick={() => handleNavClick('menu')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${
          currentView === 'menu' ? 'text-primary' : 'text-gray-400'
        }`}
      >
        <Utensils className="w-5 h-5" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>

      <button
        onClick={onCartOpen}
        className="relative -top-5 bg-primary text-white p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border-4 border-bg-maison"
        aria-label="Shopping Cart"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white">
            {cartCount}
          </span>
        )}
      </button>

      <button
        onClick={() => handleNavClick('gallery')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${
          currentView === 'gallery' ? 'text-primary' : 'text-gray-400'
        }`}
      >
        <Image className="w-5 h-5" />
        <span className="text-[10px] font-medium">Gallery</span>
      </button>

      <button
        onClick={() => handleNavClick('reviews')}
        className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${
          currentView === 'reviews' ? 'text-primary' : 'text-gray-400'
        }`}
      >
        <Star className="w-5 h-5" />
        <span className="text-[10px] font-medium">Reviews</span>
      </button>

    </div>
  );
};