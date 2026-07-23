import React, { useState } from 'react';
import { Star, MessageSquare, Quote, Heart, Send, CheckCircle } from 'lucide-react';
import { Review } from '../../types';
import { Reveal } from '../ui/Reveal';


import starAvatar from '../../../assets/star.png';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, onAddReview }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Use star.png as the default avatar
  const defaultAvatar = starAvatar;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const newReview: Review = {
      id: `rev-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      stars: rating,
      comment: comment.trim(),
      date: todayStr,
      photo: defaultAvatar,
    };

    onAddReview(newReview);
    setName('');
    setComment('');
    setRating(5);
    setFormSubmitted(true);

    setTimeout(() => {
      setFormSubmitted(false);
    }, 4000);
  };

  return (
    <section id="reviews" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Reveal direction="up" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-montserrat text-xs font-bold tracking-widest uppercase bg-primary/5 py-1.5 px-4 rounded-full">
              Customer Testimonials
            </span>
            <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-gray-900 mt-4">
              Verified Customer Reviews
            </h2>
            <div className="w-16 h-1.5 bg-primary mx-auto rounded-full mt-4" />
            <p className="font-sans text-sm text-gray-500 leading-relaxed mt-4">
              See what food lovers in Port Harcourt are saying about FoodPlace Maison. We maintain a near-perfect rating by treating each dish like a masterpiece!
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <Reveal direction="left" delay={0.2} className="lg:col-span-2">
            <div className="flex flex-col gap-6.5">
              {reviews.length === 0 ? (
                <div className="bg-[#F7F3EC] rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 stroke-1" />
                  <h3 className="font-montserrat text-sm font-bold text-gray-800 mt-4">No reviews yet</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Be the very first customer to share your wonderful experience!
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#F7F3EC]/50 border border-gray-200/40 rounded-3xl p-6.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative hover:shadow-md transition-all flex flex-col gap-4"
                  >
                    <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/5 stroke-[1.5]" />

                    <div className="flex items-center gap-4">
                      <img
                        src={rev.photo}
                        alt={rev.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shrink-0"
                      />
                      <div>
                        <h4 className="font-montserrat text-xs font-bold text-gray-900">{rev.name}</h4>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.stars ? 'text-amber-500 fill-amber-500' : 'text-gray-250 fill-transparent'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="font-sans text-sm text-gray-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.3} className="h-full">
            <div className="bg-[#F7F3EC] border border-primary/10 rounded-3xl p-6 md:p-8 shadow-sm h-fit">
              <h3 className="font-montserrat text-sm font-bold text-gray-900 tracking-tight uppercase border-b border-primary/10 pb-4 mb-6">
                Write a Review
              </h3>

              {formSubmitted ? (
                <div className="text-center py-6 animate-scale-in">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 mx-auto mb-4">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-montserrat text-sm font-bold text-emerald-800">Review Submitted!</h4>
                  <p className="text-xs text-emerald-600/80 leading-relaxed mt-1.5 max-w-xs mx-auto">
                    Thank you for sharing your experience. Your feedback keeps us cookin' fresh!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-name" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-450 font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Star Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starVal = i + 1;
                        const isHighlighted = starVal <= rating;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(starVal)}
                            className="text-amber-500 hover:scale-115 active:scale-95 transition-all cursor-pointer p-0.5"
                            aria-label={`Rate ${starVal} stars`}
                          >
                            <Star className={`w-6 h-6 ${isHighlighted ? 'fill-amber-500' : 'fill-transparent'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-comment" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Your Review
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Describe your meal flavor, speed, presentation..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-450 font-sans h-28 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 px-4 rounded-xl font-montserrat text-xs font-semibold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg mt-2"
                  >
                    <Send className="w-4 h-4" /> Post Review
                  </button>
                </form>
              )}
            </div>
          </Reveal>

        </div>

      </div>
    </section>
  );
};
