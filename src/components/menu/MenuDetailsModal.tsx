import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Minus, CheckCircle, Info } from 'lucide-react';
import { Meal, Extra } from '../../types';

interface MenuDetailsModalProps {
  meal: Meal | null;
  onClose: () => void;
  onAddToCart: (meal: Meal, selectedExtras: { extra: Extra; quantity: number }[], quantity: number, instructions: string) => void;
  allExtras: Extra[];
  currencySymbol: string;
}

export const MenuDetailsModal: React.FC<MenuDetailsModalProps> = ({
  meal,
  onClose,
  onAddToCart,
  allExtras,
  currencySymbol,
}) => {
  if (!meal) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    setQuantity(1);
    setSelectedExtras({});
    setExtraQuantities({});
    setSpecialInstructions('');
  }, [meal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const enabledExtras = allExtras.filter((e) => e.enabled);

  const handleToggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const isSelected = !prev[extraId];
      if (isSelected) {
        setExtraQuantities((q) => ({ ...q, [extraId]: 1 }));
      } else {
        setExtraQuantities((q) => {
          const newQ = { ...q };
          delete newQ[extraId];
          return newQ;
        });
      }
      return { ...prev, [extraId]: isSelected };
    });
  };

  const handleAdjustExtraQty = (extraId: string, increment: boolean) => {
    setExtraQuantities((prev) => {
      const currentQty = prev[extraId] || 1;
      const nextQty = increment ? currentQty + 1 : Math.max(1, currentQty - 1);
      return { ...prev, [extraId]: nextQty };
    });
  };

  const getIngredients = (mealName: string): string[] => {
    const name = mealName.toLowerCase();
    if (name.includes('jollof')) {
      return ['Basmati Rice', 'Plum Tomatoes', 'Red Bell Peppers', 'Onions', 'Maison Seasoning', 'Scotch Bonnet', 'Bay Leaves', 'Fried Ripe Plantain'];
    }
    if (name.includes('native')) {
      return ['Local Rice', 'Premium Palm Oil', 'Local Ugba', 'Crayfish', 'Dry Fish', 'Scent Leaves', 'Stockfish', 'Onions', 'Traditional spices'];
    }
    if (name.includes('egusi') || name.includes('yam')) {
      return ['Grounded Melon Seeds (Egusi)', 'Fluffy Pounded Yam', 'Fresh Spinach', 'Tripe (Shaki)', 'Stockfish', 'Locust Beans (Iru)', 'Premium Palm Oil'];
    }
    if (name.includes('shawarma')) {
      return ['Premium Double Wrap Lebanese Bread', 'Grilled Chicken breast chunks', 'Fresh Shredded Cabbage', 'Special Maison Creamy Mayo dressing', 'Chili pepper extract'];
    }
    if (name.includes('gizzard') || name.includes('suya')) {
      return ['Tender Chicken Gizzards', 'Authentic Northern Suya Spice (Yaji)', 'Red Onions', 'Fresh Tomatoes', 'Vegetable Oil brush'];
    }
    if (name.includes('puff')) {
      return ['Unbleached Wheat Flour', 'Active Dry Yeast', 'Granulated Sugar', 'Warm Water blend', 'Deep Fried Vegetable Oil'];
    }
    if (name.includes('chapman')) {
      return ['Fanta Orange', 'Sprite', 'Angostura Bitters', 'Blackcurrant cordial (Ribena)', 'Fresh cucumber slices', 'Orange slices', 'Fresh Mint'];
    }
    if (name.includes('zobo')) {
      return ['Premium Hibiscus Leaves (Zobo)', 'Crushed sweet pineapple', 'Fresh ginger root', 'Whole Cloves', 'Organic Honey touch'];
    }
    return ['Freshly sourced ingredients', 'Maison signature spices', 'Fresh onions & peppers', 'Seasoned stock'];
  };

  const ingredients = getIngredients(meal.name);

  const basePrice = meal.price;
  const extrasTotal = enabledExtras.reduce((sum, extra) => {
    if (selectedExtras[extra.id]) {
      const qty = extraQuantities[extra.id] || 1;
      return sum + extra.price * qty;
    }
    return sum;
  }, 0);

  const singleItemPrice = basePrice + extrasTotal;
  const grandTotal = singleItemPrice * quantity;

  const handleAddClick = () => {
    if (!meal.available) return;
    const finalExtras = enabledExtras
      .filter((e) => selectedExtras[e.id])
      .map((e) => ({
        extra: e,
        quantity: extraQuantities[e.id] || 1,
      }));
    onAddToCart(meal, finalExtras, quantity, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-[24px] sm:rounded-3xl bg-[#F7F3EC] text-left shadow-2xl transition-all sm:my-8 w-full max-w-full sm:max-w-2xl flex flex-col max-h-[92vh] md:max-h-[90vh]">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-700 p-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="overflow-y-auto flex-1">
            <div className="relative w-full h-64 md:h-80 bg-gray-100">
              {meal.image ? (
                <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="text-sm">No photo available</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F7F3EC] via-transparent to-black/20" />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 text-xs font-semibold text-secondary uppercase tracking-wider mb-2.5">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{meal.category}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" /> {meal.preparationTime} Minutes prep time
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2.5 mb-4">
                <h2 className="font-montserrat text-2xl font-bold text-gray-900 tracking-tight">{meal.name}</h2>
                <div className="text-xl md:text-2xl font-bold text-primary font-montserrat">
                  {currencySymbol}
                  {meal.price.toLocaleString()}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">{meal.description}</p>

              <div className="mb-6.5 bg-white/50 border border-gray-200/50 rounded-2xl p-4">
                <h3 className="font-montserrat text-xs font-bold tracking-wider uppercase text-gray-900 mb-2.5 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" /> Ingredients Highlight
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-md">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {enabledExtras.length > 0 && (
                <div className="mb-6.5">
                  <h3 className="font-montserrat text-xs font-bold tracking-wider uppercase text-gray-900 mb-3.5">
                    Customize Extras <span className="text-[10px] text-gray-400 font-normal normal-case">(Add as much as you'd like!)</span>
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {enabledExtras.map((extra) => {
                      const isChecked = !!selectedExtras[extra.id];
                      const extraQty = extraQuantities[extra.id] || 1;

                      return (
                        <div
                          key={extra.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-white border-primary/40 shadow-sm'
                              : 'bg-white/40 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleExtra(extra.id)}
                            className="flex items-center gap-3 cursor-pointer text-left flex-1"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked
                                  ? 'bg-primary border-primary text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isChecked && <CheckCircle className="w-3.5 h-3.5 fill-current" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-800">{extra.name}</span>
                              <span className="text-[11px] text-primary font-medium mt-0.5">
                                +{currencySymbol}
                                {extra.price.toLocaleString()}
                              </span>
                            </div>
                          </button>

                          {isChecked && (
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1 animate-scale-in">
                              <button
                                onClick={() => handleAdjustExtraQty(extra.id, false)}
                                className="w-6 h-6 rounded-md bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center text-xs border border-gray-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-gray-800 px-1">{extraQty}</span>
                              <button
                                onClick={() => handleAdjustExtraQty(extra.id, true)}
                                className="w-6 h-6 rounded-md bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center text-xs border border-gray-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-montserrat text-xs font-bold tracking-wider uppercase text-gray-900 mb-2">
                  Special Instructions
                </h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Example: No pepper, extra spicy, no onions, keep sauce separate..."
                  className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl p-3.5 text-xs text-gray-700 outline-none transition-all placeholder:text-gray-400 resize-none h-20"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200/60 bg-white/95 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
            <div className="flex items-center gap-3.5 bg-gray-50 border border-gray-200 rounded-xl p-1.5 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200 shadow-sm cursor-pointer"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-montserrat text-sm font-bold text-gray-900 w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddClick}
              disabled={!meal.available}
              className={`w-full py-3.5 px-6 rounded-2xl font-montserrat text-xs font-semibold tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
                meal.available
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 hover:shadow-xl cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              }`}
            >
              {meal.available ? (
                <>
                  <span>Add to Cart</span>
                  <span className="opacity-40">|</span>
                  <span>
                    {currencySymbol}
                    {grandTotal.toLocaleString()}
                  </span>
                </>
              ) : (
                'Sold Out'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};