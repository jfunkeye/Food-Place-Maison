import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { CartItem, Settings } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateCartQty: (cartItemId: string, newQty: number) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onClearCart: () => void;
  settings: Settings;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  settings,
  showToast,
}) => {
  if (!isOpen) return null;

  const currencySymbol = settings.currencySymbol;
  const isClosed = settings.status === 'Closed' || settings.status === 'Holiday';

  const grandTotal = cart.reduce((total, item) => {
    const extrasPrice = item.selectedExtras.reduce((sum, extra) => {
      return sum + extra.price * (extra.quantity || 1);
    }, 0);
    return total + (item.meal.price + extrasPrice) * item.quantity;
  }, 0);

  const estimatedPrepTime = cart.length > 0
    ? Math.max(...cart.map(item => item.meal.preparationTime))
    : settings.preparationTime;

  const handleCheckoutWhatsApp = () => {
    if (isClosed) {
      showToast?.(settings.holidayNotice || 'We are currently closed. Please try again during business hours!', 'info');
      return;
    }

    let orderDetailsText = '';

    cart.forEach((item, index) => {
      const itemExtrasPrice = item.selectedExtras.reduce((sum, ext) => sum + ext.price * ext.quantity, 0);
      const itemSubtotal = (item.meal.price + itemExtrasPrice) * item.quantity;

      orderDetailsText += `${item.quantity} × ${item.meal.name}\n${currencySymbol}${itemSubtotal.toLocaleString()}\n`;
      
      if (item.selectedExtras.length > 0) {
        orderDetailsText += `Extras:\n`;
        item.selectedExtras.forEach((ext) => {
          orderDetailsText += `+ ${ext.name} (x${ext.quantity}) — ${currencySymbol}${(ext.price * ext.quantity).toLocaleString()}\n`;
        });
      }

      if (item.specialInstructions.trim()) {
        orderDetailsText += `Special Instructions: "${item.specialInstructions.trim()}"\n`;
      }

      if (index < cart.length - 1) {
        orderDetailsText += `\n`;
      }
    });

    const msg = `Hello ${settings.restaurantName},

I would like to place the following order.

Order Details:
${orderDetailsText}

Total Amount:
${currencySymbol}${grandTotal.toLocaleString()}

Estimated Preparation Time:
${estimatedPrepTime} Minutes

Please let me know the delivery options, payment method, and estimated arrival time.

Thank you.`;

    const cleanNumber = settings.whatsapp.replace(/\s+/g, '').replace(/^0/, '');
    const waUrl = `https://wa.me/234${cleanNumber}?text=${encodeURIComponent(msg)}`;
    
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#F7F3EC] flex flex-col shadow-2xl h-full animate-slide-in relative">
          
          <div className="px-6 py-5 bg-white border-b border-gray-150 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5.5 h-5.5 text-primary" />
              <h2 className="font-montserrat text-base font-bold text-gray-900 tracking-tight">Your Cart</h2>
              {cart.length > 0 && !isClosed && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
              {isClosed && (
                <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Closed
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {cart.length > 0 && !isClosed && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 transition-colors font-medium cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1 h-full">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 mb-4 animate-pulse">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-montserrat text-sm font-bold text-gray-800">Your cart is empty</h3>
                <p className="text-xs text-gray-400 mt-1.5 max-w-[240px] leading-relaxed">
                  Browse our premium dishes and add your favorites to start your order.
                </p>
                <button
                  onClick={onClose}
                  className="bg-primary hover:bg-primary-dark text-white text-[11px] font-semibold font-montserrat uppercase px-6 py-3.5 rounded-xl shadow-md mt-6 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const extrasPrice = item.selectedExtras.reduce((sum, ext) => sum + ext.price * ext.quantity, 0);
                const itemSubtotal = (item.meal.price + extrasPrice) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-gray-100 flex items-start gap-4 animate-scale-in"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                      <img src={item.meal.image} alt={item.meal.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-gray-900 truncate pr-2 font-montserrat leading-tight">
                          {item.meal.name}
                        </h4>
                        {!isClosed && (
                          <button
                            onClick={() => onRemoveFromCart(item.id)}
                            className="text-gray-300 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {item.selectedExtras.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Extras:</span>
                          {item.selectedExtras.map((ext) => (
                            <span key={ext.id} className="text-[10px] text-gray-600 flex justify-between">
                              <span>+ {ext.name} (x{ext.quantity})</span>
                              <span className="font-semibold">{currencySymbol}{(ext.price * ext.quantity).toLocaleString()}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions.trim() && (
                        <p className="text-[10px] text-primary italic font-medium mt-2 leading-tight">
                          📝 "{item.specialInstructions}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-3">
                        <div className={`flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-0.5 ${isClosed ? 'opacity-50' : ''}`}>
                          <button
                            onClick={() => !isClosed && onUpdateCartQty(item.id, Math.max(1, item.quantity - 1))}
                            className={`w-5 h-5 rounded bg-white text-gray-600 flex items-center justify-center text-[10px] ${isClosed ? 'cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                            disabled={isClosed}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[11px] font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => !isClosed && onUpdateCartQty(item.id, item.quantity + 1)}
                            className={`w-5 h-5 rounded bg-white text-gray-600 flex items-center justify-center text-[10px] ${isClosed ? 'cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                            disabled={isClosed}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <span className="font-montserrat text-sm font-bold text-primary">
                          {currencySymbol}
                          {itemSubtotal.toLocaleString()}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <div className="bg-white border-t border-gray-150 p-6 flex flex-col gap-4">
              {!isClosed && (
                <div className="flex items-center justify-between text-xs text-secondary font-medium bg-secondary/5 py-2 px-3 rounded-lg border border-secondary/10">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" /> Estimated Preparation Time:
                  </span>
                  <span className="font-bold text-primary">{estimatedPrepTime} Minutes</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Delivery fee</span>
                  <span className="italic text-primary text-[11px]">Discussed on WhatsApp</span>
                </div>
                <hr className="border-gray-100 my-1" />
                <div className="flex justify-between text-sm text-gray-900 font-bold">
                  <span>Total Due</span>
                  <span className="font-montserrat text-lg text-primary">{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleCheckoutWhatsApp}
                  className={`w-full py-3.5 px-4 rounded-xl font-montserrat text-xs font-semibold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isClosed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-[#128C7E] hover:bg-[#075E54] text-white'
                  }`}
                  disabled={isClosed}
                >
                  <MessageSquare className="w-4.5 h-4.5 fill-current" /> 
                  {isClosed ? 'Currently Closed' : 'Order on WhatsApp'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl font-montserrat text-xs font-medium tracking-wide transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};