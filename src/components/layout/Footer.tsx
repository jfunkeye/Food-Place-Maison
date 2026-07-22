import React from 'react';
import { Phone, MapPin, Clock, ShieldCheck, Heart, ArrowUp } from 'lucide-react';
import { Settings } from '../../types';

interface FooterProps {
  settings: Settings;
  onViewChange: (view: string) => void;
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onViewChange, onAdminClick }) => {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C1812] text-gray-300 pt-16 pb-24 md:pb-12 border-t border-primary/20 relative">
      {/* Scroll to Top Trigger */}
      <button
        onClick={scrollToTop}
        className="absolute -top-6 right-8 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-all z-10"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bebas text-3xl tracking-tighter text-primary">
              {settings.restaurantName === "FoodPlace Maison" ? (
                <>
                  FoodPlace <span className="font-light text-secondary">Maison</span>
                </>
              ) : (
                settings.restaurantName
              )}
            </h2>
            <p className="font-sans text-sm text-gray-400 max-w-xs">
              {settings.tagline} Enjoy slow-cooked, freshly prepared gourmet Nigerian delicacies, crafted for absolute perfection.
            </p>
            <div className="flex items-center gap-4 mt-2">
              {Object.entries(settings.socialMedia).map(([platform, handle]) => (
                <a
                  key={platform}
                  href={`https://${platform}.com/${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all text-sm font-semibold capitalize"
                >
                  {platform[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-montserrat text-xs font-bold tracking-widest uppercase text-white mb-5">Quick Menu</h3>
            <ul className="flex flex-col gap-3 font-sans text-sm">
              <li>
                <button onClick={() => handleNavClick('home')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Welcome Card
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('menu')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Browse Menu
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('gallery')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Maison Gallery
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('reviews')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Verified Reviews
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('about')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-montserrat text-xs font-bold tracking-widest uppercase text-white mb-5">Get In Touch</h3>
            <ul className="flex flex-col gap-4 font-sans text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed text-xs">{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4.5 h-4.5 text-primary text-center font-bold font-montserrat">W</span>
                <a href={`https://wa.me/234${settings.whatsapp.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>

          {/* Hours details */}
          <div>
            <h3 className="font-montserrat text-xs font-bold tracking-widest uppercase text-white mb-5">Business Hours</h3>
            <ul className="flex flex-col gap-3 font-sans text-sm text-gray-400">
              <li className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Weekdays:</span>
                  <span className="text-[11px]">{settings.businessHours.weekdays}</span>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Saturdays:</span>
                  <span className="text-[11px]">{settings.businessHours.saturdays}</span>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Sundays:</span>
                  <span className="text-[11px]">{settings.businessHours.sundays}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-center gap-4 font-sans text-xs text-gray-500">
          <p className="flex items-center gap-1">
            &copy; 2026 {settings.restaurantName} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};