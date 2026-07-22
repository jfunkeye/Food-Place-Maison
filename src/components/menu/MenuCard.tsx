import React from 'react';
import { Star, Clock, Plus, HelpCircle, Heart, Flame } from 'lucide-react';
import { Meal } from '../../types';

interface MenuCardProps {
  meal: Meal;
  onSelect: (meal: Meal) => void;
  onAddToCartDirect: (meal: Meal) => void;
  currencySymbol: string;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  meal,
  onSelect,
  onAddToCartDirect,
  currencySymbol,
}) => {
  const isSoldOut = !meal.available;
  const showChefRecommends = meal.rating >= 4.9;

  return (
    <div
      className={`group relative bg-white p-4 rounded-[24px] shadow-luxury border-2 border-transparent hover:border-primary/20 transition-all duration-300 flex flex-col food-card ${
        isSoldOut ? 'opacity-85' : ''
      }`}
    >
      
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5">
        {isSoldOut ? (
          <span className="bg-rose-600 text-white text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm font-montserrat">
            Sold Out
          </span>
        ) : (
          <>
            {showChefRecommends && (
              <span className="bg-primary text-white text-[8px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm font-montserrat uppercase tracking-wider">
                <Flame className="w-2.5 h-2.5 fill-white" /> Chef's Choice
              </span>
            )}
            {meal.featured && (
              <span className="bg-[#6B7F3B] text-white text-[8px] font-bold px-2 py-1 rounded shadow-sm font-montserrat uppercase tracking-wider">
                Popular
              </span>
            )}
          </>
        )}
      </div>

   
      <div className="absolute top-6 right-6 z-10">
        <button
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-rose-500 hover:text-white hover:bg-rose-500 transition-all shadow-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Add to favorites"
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      
      <div
        onClick={() => onSelect(meal)}
        className="w-full h-[150px] bg-gray-50 rounded-[18px] mb-4 overflow-hidden relative cursor-pointer hover-zoom"
      >
        {meal.image ? (
          <img
            src={meal.image}
            alt={meal.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isSoldOut ? 'grayscale contrast-75' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <HelpCircle className="w-10 h-10 stroke-1" />
            <span className="text-[10px] font-medium mt-1">Photo coming soon</span>
          </div>
        )}
        
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="font-bebas text-white text-xl tracking-widest uppercase py-1 px-4 border border-white rounded">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 font-sans mb-1 block">
          {meal.category}
        </span>

        <div className="flex justify-between items-start mb-2 gap-2">
          <button
            onClick={() => onSelect(meal)}
            className="font-montserrat font-bold text-sm text-gray-800 hover:text-primary transition-colors text-left line-clamp-1 cursor-pointer outline-none"
          >
            {meal.name}
          </button>
          <span className="text-primary font-bebas text-sm font-bold tracking-tight shrink-0">
            {currencySymbol}{meal.price.toLocaleString()}
          </span>
        </div>

        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-grow font-sans">
          {meal.description}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 mt-auto">
          <span className="text-[9px] font-bold text-[#6B7F3B] bg-[#6B7F3B]/10 px-2 py-0.5 rounded tracking-wider uppercase font-montserrat">
            {meal.preparationTime} MINS
          </span>

          {isSoldOut ? (
            <button
              disabled
              className="bg-gray-100 text-gray-400 p-2 rounded-full cursor-not-allowed"
              title="Currently Unavailable"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onAddToCartDirect(meal)}
              className="bg-primary hover:bg-secondary text-white p-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center"
              title="Quick Add"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
