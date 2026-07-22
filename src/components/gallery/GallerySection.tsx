import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { GalleryItem } from '../../types';
import { Reveal } from '../ui/Reveal';

interface GallerySectionProps {
  gallery: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);
  const [galleryActiveIdx, setGalleryActiveIdx] = useState(0);
  const galleryScrollRef = useRef<HTMLDivElement>(null);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActivePhotoIdx(index);
  };

  const closeLightbox = () => {
    setActivePhotoIdx(null);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotoIdx === null) return;
    setActivePhotoIdx((prevIdx) => (prevIdx === 0 ? gallery.length - 1 : (prevIdx as number) - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotoIdx === null) return;
    setActivePhotoIdx((prevIdx) => (prevIdx === gallery.length - 1 ? 0 : (prevIdx as number) + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIdx === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIdx, gallery.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleGalleryScroll = () => {
    if (!galleryScrollRef.current) return;
    const container = galleryScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setGalleryActiveIdx(Math.max(0, Math.min(idx, gallery.length - 1)));
    }
  };

  return (
    <section id="gallery" className="py-20 bg-[#F7F3EC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Reveal direction="up" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1.5 px-4 rounded-full">
              Our Kitchen Stories
            </span>
            <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-gray-900 mt-4">
              Maison Culinary Gallery
            </h2>
            <div className="w-16 h-1.5 bg-primary mx-auto rounded-full mt-4" />
            <p className="font-sans text-sm text-gray-500 leading-relaxed mt-4">
              A visual journey through the preparation of premium Nigerian meals. We take hygiene, freshness, and artistry very seriously.
            </p>
          </div>
        </Reveal>

        {gallery.length === 0 ? (
          <Reveal direction="up" delay={0.2}>
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto stroke-1" />
              <h3 className="font-montserrat text-sm font-bold text-gray-800 mt-4">No images in gallery yet</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Our admin hasn't uploaded photos yet. Please check back later.
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal direction="up" delay={0.2}>
            <div className="relative">
              <div
                ref={galleryScrollRef}
                onScroll={handleGalleryScroll}
                className="flex md:grid md:grid-cols-3 gap-6.5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 md:mx-0 md:px-0"
              >
                {gallery.map((item, idx) => (
                  <div
                    key={item.id}
                    className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 snap-center shrink-0 md:shrink"
                  >
                    <div
                      onClick={() => openLightbox(idx)}
                      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1 hover-zoom h-full"
                    >
                      <div className="aspect-square bg-gray-50 overflow-hidden relative">
                        <img
                          src={item.image}
                          alt={item.caption}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-11 h-11 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 text-white shadow-sm transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-center">
                        <p className="text-xs text-gray-600 font-medium text-center leading-relaxed italic truncate">
                          "{item.caption}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-2 mt-4 md:hidden">
                {gallery.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (galleryScrollRef.current) {
                        const container = galleryScrollRef.current;
                        const itemWidth = container.scrollWidth / gallery.length;
                        container.scrollTo({
                          left: idx * itemWidth,
                          behavior: 'smooth'
                        });
                        setGalleryActiveIdx(idx);
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      galleryActiveIdx === idx ? 'bg-primary w-5' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {activePhotoIdx !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/20 transition-colors cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="w-5.5 h-5.5" />
            </button>

            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div
              className="relative max-w-4xl max-h-[75vh] w-full h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={gallery[activePhotoIdx].image}
                alt={gallery[activePhotoIdx].caption}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-scale-in border border-white/10"
              />
            </div>

            <div
              className="text-center text-white max-w-xl mx-auto mt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-sans text-sm font-semibold tracking-wide italic text-gray-200">
                "{gallery[activePhotoIdx].caption}"
              </p>
              <span className="font-montserrat text-[10px] text-primary font-bold tracking-widest uppercase mt-2.5 block">
                Photo {activePhotoIdx + 1} of {gallery.length}
              </span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};