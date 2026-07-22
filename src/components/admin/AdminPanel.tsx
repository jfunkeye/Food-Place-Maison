import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Eye,
  Check,
  Image as ImageIcon,
  Star,
  Settings as SettingsIcon,
  Download,
  Upload,
  LogOut,
  FolderOpen,
  X,
  RefreshCw,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
  UploadCloud,
  FileCode2,
} from 'lucide-react';
import { Meal, Category, Extra, Review, GalleryItem, Settings } from '../../types';
import { compressImage } from '../../data/store';
import { ConfirmModal } from '../ui/ConfirmModal';

const DEFAULT_MEAL_IMAGE = import.meta.env.VITE_DEFAULT_MEAL_IMAGE;
const DEFAULT_REVIEW_AVATAR = import.meta.env.VITE_DEFAULT_REVIEW_AVATAR;
const DEFAULT_CATEGORY = import.meta.env.VITE_DEFAULT_CATEGORY;
const DEFAULT_PRICE = Number(import.meta.env.VITE_DEFAULT_PRICE);
const DEFAULT_RATING = Number(import.meta.env.VITE_DEFAULT_RATING);
const DEFAULT_PREP_TIME = Number(import.meta.env.VITE_DEFAULT_PREP_TIME);
const DEFAULT_EXTRA_PRICE = Number(import.meta.env.VITE_DEFAULT_EXTRA_PRICE);
const IMAGE_MAX_WIDTH = Number(import.meta.env.VITE_IMAGE_MAX_WIDTH);
const IMAGE_QUALITY = Number(import.meta.env.VITE_IMAGE_QUALITY);
const BACKUP_FILENAME_PREFIX = import.meta.env.VITE_BACKUP_FILENAME_PREFIX;

export function compressAdminImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > IMAGE_MAX_WIDTH) {
          height = Math.round((height * IMAGE_MAX_WIDTH) / width);
          width = IMAGE_MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

interface AdminPanelProps {
  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  extras: Extra[];
  setExtras: (extras: Extra[]) => void;
  gallery: GalleryItem[];
  setGallery: (items: GalleryItem[]) => void;
  reviews: Review[];
  setReviews: (reviews: Review[]) => void;
  settings: Settings;
  setSettings: (settings: Settings) => Promise<Settings>;
  onLogout: () => void;
  onResetToDefaults: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'dashboard' | 'meals' | 'categories' | 'extras' | 'gallery' | 'reviews' | 'settings' | 'backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  meals,
  setMeals,
  categories,
  setCategories,
  extras,
  setExtras,
  gallery,
  setGallery,
  reviews,
  setReviews,
  settings,
  setSettings,
  onLogout,
  onResetToDefaults,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  const openConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [mealForm, setMealForm] = useState<{
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
  }>({
    id: '',
    name: '',
    description: '',
    category: '',
    image: '',
    price: 3500,
    rating: 4.8,
    featured: false,
    available: true,
    preparationTime: 30,
  });

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catFormName, setCatFormName] = useState('');

  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [extraForm, setExtraForm] = useState({
    id: '',
    name: '',
    price: 500,
    enabled: true,
  });

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    id: '',
    image: '',
    caption: '',
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    id: '',
    name: '',
    comment: '',
    stars: 5,
    photo: '',
    date: '',
  });

  const [tempSettings, setTempSettings] = useState<Settings>({ ...settings });

  const mealImageRef = useRef<HTMLInputElement>(null);
  const galleryImageRef = useRef<HTMLInputElement>(null);
  const reviewPhotoRef = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);
  const settingsLogoRef = useRef<HTMLInputElement>(null);

  const openAddMeal = () => {
    setEditingMeal(null);
    setMealForm({
      id: `meal-${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      description: '',
      category: categories[0]?.name || DEFAULT_CATEGORY,
      image: '',
      price: DEFAULT_PRICE,
      rating: DEFAULT_RATING,
      featured: false,
      available: true,
      preparationTime: DEFAULT_PREP_TIME,
    });
    setMealModalOpen(true);
  };

  const openEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setMealForm({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      category: meal.category,
      image: meal.image,
      price: meal.price,
      rating: meal.rating,
      featured: meal.featured,
      available: meal.available,
      preparationTime: meal.preparationTime,
    });
    setMealModalOpen(true);
  };

  const handleDuplicateMeal = (meal: Meal) => {
    const duplicated: Meal = {
      ...meal,
      id: `meal-${Math.random().toString(36).substring(2, 9)}`,
      name: `${meal.name} (Copy)`,
      featured: false,
    };
    const nextMeals = [...meals, duplicated];
    setMeals(nextMeals);
    showToast('Meal duplicated and broadcasted to all users!', 'success');
  };

  const handleToggleAvailable = (mealId: string) => {
    const next = meals.map((m) => (m.id === mealId ? { ...m, available: !m.available } : m));
    setMeals(next);
    showToast('Meal availability updated and broadcasted to all users!', 'success');
  };

  const handleDeleteMeal = (mealId: string) => {
    openConfirmModal(
      'Delete Meal',
      'Are you absolutely sure you want to delete this meal? This cannot be undone.',
      () => {
        setMeals(meals.filter((m) => m.id !== mealId));
        showToast('Meal deleted and broadcasted to all users!', 'success');
        closeConfirmModal();
      }
    );
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim() || !mealForm.description.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const nextMeal: Meal = {
      id: mealForm.id,
      name: mealForm.name.trim(),
      description: mealForm.description.trim(),
      category: mealForm.category,
      image: mealForm.image || DEFAULT_MEAL_IMAGE,
      price: Number(mealForm.price),
      rating: Number(mealForm.rating),
      featured: mealForm.featured,
      available: mealForm.available,
      preparationTime: Number(mealForm.preparationTime),
    };

    if (editingMeal) {
      setMeals(meals.map((m) => (m.id === editingMeal.id ? nextMeal : m)));
      showToast('Meal updated and broadcasted to all users!', 'success');
    } else {
      setMeals([...meals, nextMeal]);
      showToast('New meal added and broadcasted to all users!', 'success');
    }
    setMealModalOpen(false);
  };

  const handleMealImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        showToast('Uploading & compressing image to high resolution...', 'info');
        const base64 = await compressAdminImage(file);
        setMealForm((prev) => ({ ...prev, image: base64 }));
        showToast('Image uploaded successfully!', 'success');
      } catch (err) {
        showToast('Failed to upload image.', 'error');
      }
    }
  };

  const openAddCategory = () => {
    setEditingCat(null);
    setCatFormName('');
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatFormName(cat.name);
    setCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      showToast('Please enter a category name.', 'error');
      return;
    }

    if (editingCat) {
      const updatedList = categories.map((c) =>
        c.id === editingCat.id ? { ...c, name: catFormName.trim() } : c
      );
      setCategories(updatedList);
      showToast('Category renamed and broadcasted to all users!', 'success');
    } else {
      const newCat: Category = {
        id: `cat-${Math.random().toString(36).substring(2, 9)}`,
        name: catFormName.trim(),
        enabled: true,
        sortOrder: categories.length + 1,
      };
      setCategories([...categories, newCat]);
      showToast('Category created and broadcasted to all users!', 'success');
    }
    setCatModalOpen(false);
  };

  const handleToggleCatEnable = (catId: string) => {
    const next = categories.map((c) => (c.id === catId ? { ...c, enabled: !c.enabled } : c));
    setCategories(next);
    showToast('Category status updated and broadcasted to all users!', 'success');
  };

  const handleDeleteCategory = (catId: string) => {
    const category = categories.find((c) => c.id === catId);
    if (!category) return;
    openConfirmModal(
      'Delete Category',
      `Do you want to delete category "${category.name}"? Meals in this category won't be deleted but will have a missing category match.`,
      () => {
        setCategories(categories.filter((c) => c.id !== catId));
        showToast('Category deleted and broadcasted to all users!', 'success');
        closeConfirmModal();
      }
    );
  };

  const openAddExtra = () => {
    setEditingExtra(null);
    setExtraForm({
      id: `ext-${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      price: DEFAULT_EXTRA_PRICE,
      enabled: true,
    });
    setExtraModalOpen(true);
  };

  const openEditExtra = (extra: Extra) => {
    setEditingExtra(extra);
    setExtraForm({
      id: extra.id,
      name: extra.name,
      price: extra.price,
      enabled: extra.enabled,
    });
    setExtraModalOpen(true);
  };

  const handleSaveExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraForm.name.trim()) {
      showToast('Please enter an extra name.', 'error');
      return;
    }

    const nextExtra: Extra = {
      id: extraForm.id,
      name: extraForm.name.trim(),
      price: Number(extraForm.price),
      enabled: extraForm.enabled,
    };

    if (editingExtra) {
      setExtras(extras.map((ex) => (ex.id === editingExtra.id ? nextExtra : ex)));
      showToast('Extra updated and broadcasted to all users!', 'success');
    } else {
      setExtras([...extras, nextExtra]);
      showToast('Extra added and broadcasted to all users!', 'success');
    }
    setExtraModalOpen(false);
  };

  const handleToggleExtraStatus = (extraId: string) => {
    setExtras(extras.map((ex) => (ex.id === extraId ? { ...ex, enabled: !ex.enabled } : ex)));
    showToast('Extra availability updated and broadcasted to all users!', 'success');
  };

  const handleDeleteExtra = (extraId: string) => {
    openConfirmModal(
      'Delete Extra',
      'Delete this extra modifier permanently?',
      () => {
        setExtras(extras.filter((ex) => ex.id !== extraId));
        showToast('Extra deleted and broadcasted to all users!', 'success');
        closeConfirmModal();
      }
    );
  };

  const openAddGallery = () => {
    setGalleryForm({
      id: `gal-${Math.random().toString(36).substring(2, 9)}`,
      image: '',
      caption: '',
    });
    setGalleryModalOpen(true);
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        showToast('Compressing image to high resolution...', 'info');
        const base64 = await compressAdminImage(file);
        setGalleryForm((prev) => ({ ...prev, image: base64 }));
        showToast('Gallery image compressed!', 'success');
      } catch (err) {
        showToast('Failed to parse gallery image.', 'error');
      }
    }
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image) {
      showToast('Please upload an image first.', 'error');
      return;
    }

    const newItem: GalleryItem = {
      id: galleryForm.id,
      image: galleryForm.image,
      caption: galleryForm.caption.trim() || 'FoodPlace Maison premium prepared meal.',
    };

    setGallery([...gallery, newItem]);
    setGalleryModalOpen(false);
    showToast('Gallery item added and broadcasted to all users!', 'success');
  };

  const handleDeleteGalleryItem = (id: string) => {
    openConfirmModal(
      'Delete Photo',
      'Remove this photo from the gallery?',
      () => {
        setGallery(gallery.filter((item) => item.id !== id));
        showToast('Gallery photo deleted and broadcasted to all users!', 'success');
        closeConfirmModal();
      }
    );
  };

  const openAddReview = () => {
    setEditingReview(null);
    setReviewForm({
      id: `rev-${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      comment: '',
      stars: 5,
      photo: DEFAULT_REVIEW_AVATAR,
      date: new Date().toISOString().split('T')[0],
    });
    setReviewModalOpen(true);
  };

  const openEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewForm({
      id: review.id,
      name: review.name,
      comment: review.comment,
      stars: review.stars,
      photo: review.photo,
      date: review.date,
    });
    setReviewModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const nextReview: Review = {
      id: reviewForm.id,
      name: reviewForm.name.trim(),
      comment: reviewForm.comment.trim(),
      stars: Number(reviewForm.stars),
      photo: reviewForm.photo || DEFAULT_REVIEW_AVATAR,
      date: reviewForm.date,
    };

    if (editingReview) {
      setReviews(reviews.map((r) => (r.id === editingReview.id ? nextReview : r)));
      showToast('Review updated and broadcasted to all users!', 'success');
    } else {
      setReviews([...reviews, nextReview]);
      showToast('Review created and broadcasted to all users!', 'success');
    }
    setReviewModalOpen(false);
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 200, 200, 0.6);
        setReviewForm((prev) => ({ ...prev, photo: base64 }));
        showToast('Review photo uploaded and broadcasted to all users!', 'success');
      } catch (err) {
        showToast('Error uploading review photo.', 'error');
      }
    }
  };

  const handleDeleteReview = (id: string) => {
    openConfirmModal(
      'Delete Review',
      'Delete this customer review?',
      () => {
        setReviews(reviews.filter((r) => r.id !== id));
        showToast('Review deleted and broadcasted to all users!', 'success');
        closeConfirmModal();
      }
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showToast('Saving settings...', 'info');
      const savedSettings = await setSettings({ ...tempSettings });
      setTempSettings(savedSettings);
      showToast('Global settings updated and broadcasted to all users!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings. Please try again.', 'error');
    }
  };

  const handleSettingsLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 300, 300, 0.8);
        setTempSettings((prev) => ({ ...prev, logo: base64 }));
        showToast('Logo updated in active buffers.', 'info');
      } catch (err) {
        showToast('Error uploading logo.', 'error');
      }
    }
  };

  const handleExportData = () => {
    const fullBackup = {
      meals,
      categories,
      extras,
      reviews,
      gallery,
      settings,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${BACKUP_FILENAME_PREFIX}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('CMS database exported to JSON file!', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.meals) setMeals(parsed.meals);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.extras) setExtras(parsed.extras);
          if (parsed.reviews) setReviews(parsed.reviews);
          if (parsed.gallery) setGallery(parsed.gallery);
          if (parsed.settings) {
            setSettings(parsed.settings);
            setTempSettings(parsed.settings);
          }
          showToast('CMS databases restored and broadcasted to all users!', 'success');
        } catch (err) {
          showToast('Failed to import database. Check file integrity.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const totalMenuCount = meals.length;
  const availableMenuCount = meals.filter((m) => m.available).length;
  const featuredMenuCount = meals.filter((m) => m.featured).length;
  const activeReviewsCount = reviews.length;
  const avgStarRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <>
      <div className="bg-[#1C1812] text-gray-150 min-h-screen py-10 px-4 md:px-8 font-sans">
        <div className="max-w-7xl mx-auto bg-[#13110E] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[80vh]">
          
          <aside className="w-full md:w-64 bg-[#1C1812] p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-5 md:gap-8 shrink-0">
            <div className="flex items-center justify-between md:flex-col md:items-start gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <span className="w-6.5 h-6.5 bg-primary rounded-lg flex items-center justify-center font-bebas text-sm font-bold text-white">FM</span>
                  <h1 className="font-bebas text-lg md:text-xl text-white tracking-wide">Maison Admin</h1>
                </div>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-semibold tracking-wider uppercase font-montserrat">Shopify SaaS Portal</p>
              </div>
              <div className="md:hidden">
                <button
                  onClick={onLogout}
                  className="py-1.5 px-3 text-[10px] text-rose-500 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all font-semibold uppercase tracking-wider font-montserrat cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            </div>

            <nav className="flex flex-row overflow-x-auto md:flex-col gap-1.5 md:gap-1 flex-1 pb-2 md:pb-0 scrollbar-none max-w-full">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>

              <button
                onClick={() => setActiveTab('meals')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'meals' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Utensils className="w-4 h-4" /> Meals Manager
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'categories' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4" /> Categories
              </button>

              <button
                onClick={() => setActiveTab('extras')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'extras' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" /> Extras Modifiers
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'gallery' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Gallery Manager
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'reviews' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Star className="w-4 h-4" /> Review Moderation
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'settings' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <SettingsIcon className="w-4 h-4" /> Settings CMS
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-3 py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider font-montserrat uppercase cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'backup' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4" /> Import / Export
              </button>
            </nav>

            <div className="hidden md:flex border-t border-white/5 pt-6 flex-col gap-2">
              <button
                onClick={() => {
                  openConfirmModal(
                    'Reset to Defaults',
                    'Restore ALL default JSON files? This will clear all customizations.',
                    () => {
                      onResetToDefaults();
                      closeConfirmModal();
                    },
                    'warning'
                  );
                }}
                className="text-left py-2 px-4 text-[11px] text-amber-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Defaults
              </button>
              <button
                onClick={onLogout}
                className="text-left py-2 px-4 text-[11px] text-rose-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all font-semibold uppercase tracking-wider font-montserrat cursor-pointer flex items-center gap-2 mt-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout CMS
              </button>
            </div>
          </aside>

          <main className="flex-1 p-6 md:p-10 bg-[#13110E] overflow-y-auto max-h-[85vh]">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6 mb-8 gap-4">
              <div>
                <h2 className="font-bebas text-3xl tracking-wide text-white uppercase">{activeTab} Console</h2>
                <p className="text-xs text-gray-400">Manage, edit, and optimize your restaurant's digital storefront instantly.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Storefront
                </span>
                <span className="text-[10px] text-gray-500 font-montserrat uppercase tracking-wider">
                  <span className="text-primary">⚡</span> Real-time sync
                </span>
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-montserrat">Total Meals</span>
                      <h3 className="font-bebas text-3xl text-white mt-1">{totalMenuCount} Items</h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Utensils className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-montserrat">Available / Active</span>
                      <h3 className="font-bebas text-3xl text-emerald-400 mt-1">{availableMenuCount} Items</h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-montserrat">Featured Items</span>
                      <h3 className="font-bebas text-3xl text-primary mt-1">{featuredMenuCount} Items</h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                  <div className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-montserrat">Reviews / Stars</span>
                      <h3 className="font-bebas text-3xl text-amber-400 mt-1">{avgStarRating} ★ <span className="text-sm font-sans lowercase text-gray-400">({activeReviewsCount})</span></h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                      <Star className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#1C1812] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                    <h3 className="font-montserrat text-xs font-bold tracking-wider uppercase text-white">Current Store Status</h3>
                    <div className="flex items-center gap-4 py-2 border-y border-white/5">
                      <span className={`w-3.5 h-3.5 rounded-full ${settings.status === 'Open' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                      <div>
                        <h4 className="text-sm font-bold text-white">Maison is {settings.status}</h4>
                        <p className="text-[11px] text-gray-400">Adjust the store open/closed/holiday status inside the settings panel.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="bg-primary hover:bg-primary-dark text-white text-[11px] font-bold tracking-wider font-montserrat uppercase py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-all text-center mt-2"
                    >
                      Modify Shop Settings
                    </button>
                  </div>

                  <div className="bg-[#1C1812] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                    <h3 className="font-montserrat text-xs font-bold tracking-wider uppercase text-white">Cloud Run Standby Database</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This website operates fully inside the browser as a CMS. Make sure to download a database backup (`.json`) periodically to store your meals, extras, and configuration permanently. You can restore this backup on any device instantly.
                    </p>
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={handleExportData}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold tracking-wider font-montserrat uppercase py-3.5 px-4 rounded-xl cursor-pointer transition-all text-center border border-white/10 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Export DB
                      </button>
                      <button
                        onClick={() => backupImportRef.current?.click()}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold tracking-wider font-montserrat uppercase py-3.5 px-4 rounded-xl cursor-pointer transition-all text-center border border-white/10 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" /> Import DB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meals' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    onClick={openAddMeal}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add New Meal
                  </button>
                </div>

                <div className="bg-[#1C1812] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-4.5 px-6">Meal Details</th>
                          <th className="py-4.5 px-6">Category</th>
                          <th className="py-4.5 px-6">Price</th>
                          <th className="py-4.5 px-6 text-center">Featured</th>
                          <th className="py-4.5 px-6 text-center">Available</th>
                          <th className="py-4.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meals.map((meal) => (
                          <tr key={meal.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-6 flex items-center gap-3.5 min-w-[280px]">
                              <img src={meal.image} alt={meal.name} className="w-10 h-10 rounded-lg object-cover bg-black" />
                              <div className="min-w-0">
                                <h4 className="font-bold text-white truncate max-w-[200px]">{meal.name}</h4>
                                <span className="text-[10px] text-gray-500 mt-0.5 block italic">{meal.preparationTime} Minutes prep time</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-400">{meal.category}</td>
                            <td className="py-4 px-6 font-bold text-primary">{settings.currencySymbol}{meal.price.toLocaleString()}</td>
                            
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${meal.featured ? 'bg-primary' : 'bg-gray-700'}`} />
                            </td>

                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleToggleAvailable(meal.id)}
                                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title="Toggle Availability"
                              >
                                {meal.available ? (
                                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="w-7 h-7 text-gray-600" />
                                )}
                              </button>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditMeal(meal)}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                  title="Edit Meal"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateMeal(meal)}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                  title="Duplicate Meal"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(meal.id)}
                                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                  title="Delete Meal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    onClick={openAddCategory}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add Category
                  </button>
                </div>

                <div className="bg-[#1C1812] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 bg-[#13110E] rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">
                            Order Priority: {cat.sortOrder}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleCatEnable(cat.id)}
                          className="text-xs font-semibold uppercase font-montserrat flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors"
                        >
                          {cat.enabled ? (
                            <span className="text-emerald-400">● Visible</span>
                          ) : (
                            <span className="text-gray-600">● Hidden</span>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCategory(cat)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                            title="Rename Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'extras' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    onClick={openAddExtra}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add Extra Modifier
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extras.map((extra) => (
                    <div
                      key={extra.id}
                      className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">{extra.name}</h4>
                        <span className="text-xs text-primary font-bold block mt-1">
                          +{settings.currencySymbol}
                          {extra.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleExtraStatus(extra.id)}
                          className="cursor-pointer"
                          title="Toggle status"
                        >
                          {extra.enabled ? (
                            <ToggleRight className="w-8 h-8 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-600" />
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditExtra(extra)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExtra(extra.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    onClick={openAddGallery}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4.5 h-4.5" /> Upload Photo
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#1C1812] border border-white/5 rounded-2xl overflow-hidden relative group"
                    >
                      <div className="aspect-square bg-black overflow-hidden relative">
                        <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 text-[11px] text-gray-400 italic font-medium truncate">
                        "{item.caption}"
                      </div>

                      <button
                        onClick={() => handleDeleteGalleryItem(item.id)}
                        className="absolute top-2 right-2 bg-black/65 hover:bg-rose-600 text-white p-2 rounded-full cursor-pointer transition-all"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    onClick={openAddReview}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add Mock Review
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-[#1C1812] border border-white/5 rounded-2xl p-5 flex items-start gap-4"
                    >
                      <img src={rev.photo} alt={rev.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-white text-sm">{rev.name}</h4>
                          <span className="text-[10px] text-gray-500">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 italic mt-2 leading-relaxed">"{rev.comment}"</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                          onClick={() => openEditReview(rev)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="bg-[#1C1812] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-xs text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={tempSettings.restaurantName}
                      onChange={(e) => setTempSettings({ ...tempSettings, restaurantName: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Tagline</label>
                    <input
                      type="text"
                      required
                      value={tempSettings.tagline}
                      onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Phone Support</label>
                    <input
                      type="text"
                      required
                      value={tempSettings.phone}
                      onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">WhatsApp Contact</label>
                    <input
                      type="text"
                      required
                      value={tempSettings.whatsapp}
                      onChange={(e) => setTempSettings({ ...tempSettings, whatsapp: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Operational Status</label>
                    <select
                      value={tempSettings.status}
                      onChange={(e) => setTempSettings({ ...tempSettings, status: e.target.value as 'Open' | 'Closed' | 'Holiday' })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors cursor-pointer font-sans"
                    >
                      <option value="Open">🟢 Restaurant Open</option>
                      <option value="Closed">🔴 Restaurant Closed</option>
                      <option value="Holiday">🟡 Holiday Notice Mode</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Avg prep time (mins)</label>
                    <input
                      type="number"
                      required
                      value={tempSettings.preparationTime}
                      onChange={(e) => setTempSettings({ ...tempSettings, preparationTime: Number(e.target.value) })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Branding Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tempSettings.primaryColor}
                        onChange={(e) => setTempSettings({ ...tempSettings, primaryColor: e.target.value })}
                        className="w-11 h-11 bg-transparent border-0 cursor-pointer outline-none"
                      />
                      <input
                        type="text"
                        value={tempSettings.primaryColor}
                        onChange={(e) => setTempSettings({ ...tempSettings, primaryColor: e.target.value })}
                        className="flex-1 bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white font-mono uppercase focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Branding Secondary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tempSettings.secondaryColor}
                        onChange={(e) => setTempSettings({ ...tempSettings, secondaryColor: e.target.value })}
                        className="w-11 h-11 bg-transparent border-0 cursor-pointer outline-none"
                      />
                      <input
                        type="text"
                        value={tempSettings.secondaryColor}
                        onChange={(e) => setTempSettings({ ...tempSettings, secondaryColor: e.target.value })}
                        className="flex-1 bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white font-mono uppercase focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Daily Specials Banner</label>
                    <select
                      value={tempSettings.showDailySpecials ? 'on' : 'off'}
                      onChange={(e) => setTempSettings({ ...tempSettings, showDailySpecials: e.target.value === 'on' })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="on">✨ Banner Enabled</option>
                      <option value="off">🚫 Banner Disabled</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Specials Banner Text</label>
                    <input
                      type="text"
                      value={tempSettings.dailySpecialsBanner}
                      onChange={(e) => setTempSettings({ ...tempSettings, dailySpecialsBanner: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3 px-4 outline-none text-white focus:border-primary transition-colors"
                      placeholder="Enter special offers banner text"
                    />
                  </div>

                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="font-montserrat font-bold text-gray-500 uppercase text-[10px] tracking-wider">Physical Address</label>
                  <textarea
                    value={tempSettings.address}
                    onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
                    className="w-full bg-[#13110E] border border-white/10 rounded-xl py-3.5 px-4 outline-none text-white focus:border-primary transition-colors h-20 resize-none font-sans"
                  />
                </div>

                {tempSettings.status === 'Holiday' && (
                  <div className="flex flex-col gap-1.5 bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl animate-fade-in text-amber-300">
                    <label className="font-montserrat font-bold text-amber-500 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Holiday / Shutdown Notice Banner
                    </label>
                    <input
                      type="text"
                      value={tempSettings.holidayNotice}
                      onChange={(e) => setTempSettings({ ...tempSettings, holidayNotice: e.target.value })}
                      className="w-full bg-[#13110E] border border-amber-500/20 rounded-xl py-3 px-4 outline-none text-white focus:border-amber-400 transition-colors"
                    />
                  </div>
                )}

                <div className="flex justify-end border-t border-white/5 pt-6 mt-4">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold tracking-wider font-montserrat uppercase py-3.5 px-6 rounded-xl shadow-lg cursor-pointer transition-all"
                  >
                    Save Active Settings
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'backup' && (
              <div className="bg-[#1C1812] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-10">
                <div className="max-w-2xl">
                  <h3 className="font-bebas text-2xl text-white tracking-wide uppercase mb-3">Backup & Migration Utilities</h3>
                  <p className="text-xs text-gray-450 leading-relaxed">
                    FoodPlace Maison operates on client-side sandboxed states. This dashboard allows you to export your customized menus, catalog structures, extras prices, customer reviews, and general operational values as a single compressed file, which you can load back anytime.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#13110E] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center text-primary">
                      <FileCode2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-montserrat text-xs font-bold text-white uppercase tracking-wider">Export JSON Buffer</h4>
                      <p className="text-[11px] text-gray-500 mt-1">Download your current configuration to local storage disks.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="bg-primary hover:bg-primary-dark text-white text-[11px] font-bold tracking-wider font-montserrat uppercase py-3.5 px-4 rounded-xl cursor-pointer transition-all text-center mt-4 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4.5 h-4.5" /> Download CMS backup
                    </button>
                  </div>

                  <div className="bg-[#13110E] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-montserrat text-xs font-bold text-white uppercase tracking-wider">Restore / Import JSON</h4>
                      <p className="text-[11px] text-gray-500 mt-1">Select and parse a previously downloaded FoodPlace JSON backup file.</p>
                    </div>
                    <input
                      type="file"
                      ref={backupImportRef}
                      onChange={handleImportData}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => backupImportRef.current?.click()}
                      className="bg-[#2E7D32] hover:bg-emerald-800 text-white text-[11px] font-bold tracking-wider font-montserrat uppercase py-3.5 px-4 rounded-xl cursor-pointer transition-all text-center mt-4 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4.5 h-4.5" /> Upload backup file
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {mealModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-xs" onClick={() => setMealModalOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <div className="relative transform overflow-hidden rounded-3xl bg-[#1C1812] border border-white/15 text-left shadow-2xl transition-all w-full max-w-lg p-6 flex flex-col gap-5 text-xs text-gray-300 max-h-[92vh] overflow-y-auto">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-bebas text-2xl text-white tracking-wide uppercase">
                    {editingMeal ? 'Edit Selected Meal' : 'Create New Meal'}
                  </h3>
                  <button onClick={() => setMealModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMeal} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Meal Name *</label>
                    <input
                      type="text"
                      required
                      value={mealForm.name}
                      onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                      placeholder="e.g. Smoky Jollof Rice Premium"
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Meal Description *</label>
                    <textarea
                      required
                      value={mealForm.description}
                      onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })}
                      placeholder="Write a tasty descriptive overview of this dish..."
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary transition-colors h-16 resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Category</label>
                      <select
                        value={mealForm.category}
                        onChange={(e) => setMealForm({ ...mealForm, category: e.target.value })}
                        className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3 outline-none text-white cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Base Price (₦) *</label>
                      <input
                        type="number"
                        required
                        value={mealForm.price}
                        onChange={(e) => setMealForm({ ...mealForm, price: Number(e.target.value) })}
                        className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Mock Rating (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={mealForm.rating}
                        onChange={(e) => setMealForm({ ...mealForm, rating: Number(e.target.value) })}
                        className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Prep Duration (mins) *</label>
                      <input
                        type="number"
                        required
                        value={mealForm.preparationTime}
                        onChange={(e) => setMealForm({ ...mealForm, preparationTime: Number(e.target.value) })}
                        className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 bg-[#13110E]/50 border border-white/5 p-4 rounded-2xl">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Meal Illustration image</label>
                    <div className="flex items-center gap-4">
                      {mealForm.image && (
                        <img src={mealForm.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-black" />
                      )}
                      <input
                        type="file"
                        ref={mealImageRef}
                        onChange={handleMealImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => mealImageRef.current?.click()}
                        className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold py-2 px-4 rounded-xl cursor-pointer border border-white/10 flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-4 h-4" /> Choose File / Upload Image
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Images undergo immediate compression before saving to LocalStorage.</p>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h5 className="font-bold text-white text-xs">Featured Dish</h5>
                      <p className="text-[10px] text-gray-500">Enable this to flag with 'Chef's Choice' or show on hero populars.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMealForm((prev) => ({ ...prev, featured: !prev.featured }))}
                      className="cursor-pointer"
                    >
                      {mealForm.featured ? (
                        <ToggleRight className="w-8 h-8 text-primary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-700" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white font-montserrat font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl cursor-pointer text-center text-xs mt-2 transition-all shadow-md"
                  >
                    Save Meal Options
                  </button>
                </form>

              </div>
            </div>
          </div>
        )}

        {catModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/85" onClick={() => setCatModalOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-3xl bg-[#1C1812] border border-white/15 p-6 w-full max-w-sm flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
                <h3 className="font-bebas text-xl text-white tracking-wider uppercase border-b border-white/5 pb-2">
                  {editingCat ? 'Rename Category' : 'Create Category'}
                </h3>
                
                <form onSubmit={handleSaveCategory} className="flex flex-col gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={catFormName}
                      onChange={(e) => setCatFormName(e.target.value)}
                      placeholder="e.g. Shawarma, Deserts..."
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-montserrat font-bold uppercase cursor-pointer"
                  >
                    Save Category
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {extraModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/85" onClick={() => setExtraModalOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-3xl bg-[#1C1812] border border-white/15 p-6 w-full max-w-sm flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
                <h3 className="font-bebas text-xl text-white tracking-wider uppercase border-b border-white/5 pb-2">
                  {editingExtra ? 'Edit Extra Modifier' : 'Add Extra Modifier'}
                </h3>
                
                <form onSubmit={handleSaveExtra} className="flex flex-col gap-4 text-xs text-gray-300">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Modifier Name *</label>
                    <input
                      type="text"
                      required
                      value={extraForm.name}
                      onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })}
                      placeholder="e.g. Turkey, Extra Spicy Egg"
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Modifier Price (₦) *</label>
                    <input
                      type="number"
                      required
                      value={extraForm.price}
                      onChange={(e) => setExtraForm({ ...extraForm, price: Number(e.target.value) })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label className="font-bold text-white text-xs">Enabled & Active</label>
                    <button
                      type="button"
                      onClick={() => setExtraForm({ ...extraForm, enabled: !extraForm.enabled })}
                      className="cursor-pointer"
                    >
                      {extraForm.enabled ? (
                        <ToggleRight className="w-8 h-8 text-primary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-700" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-montserrat font-bold uppercase cursor-pointer"
                  >
                    Save Extra Modifier
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {galleryModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/85" onClick={() => setGalleryModalOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-3xl bg-[#1C1812] border border-white/15 p-6 w-full max-w-sm flex flex-col gap-4 text-xs text-gray-300 max-h-[92vh] overflow-y-auto">
                <h3 className="font-bebas text-xl text-white tracking-wider uppercase border-b border-white/5 pb-2">
                  Add Photo to Gallery
                </h3>

                <form onSubmit={handleSaveGallery} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 bg-[#13110E] p-4 rounded-xl border border-white/5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-2">Gallery Image *</label>
                    <div className="flex items-center gap-4">
                      {galleryForm.image && (
                        <img src={galleryForm.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-black" />
                      )}
                      <input
                        type="file"
                        ref={galleryImageRef}
                        onChange={handleGalleryImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => galleryImageRef.current?.click()}
                        className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold py-2 px-4 rounded-xl cursor-pointer border border-white/10"
                      >
                        Upload Photo
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Photo Caption</label>
                    <input
                      type="text"
                      value={galleryForm.caption}
                      onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                      placeholder="e.g. Traditional egusi soup crafted fresh."
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-montserrat font-bold uppercase cursor-pointer"
                  >
                    Post to Gallery
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/85" onClick={() => setReviewModalOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-3xl bg-[#1C1812] border border-white/15 p-6 w-full max-w-sm flex flex-col gap-4 text-xs text-gray-300 max-h-[92vh] overflow-y-auto">
                <h3 className="font-bebas text-xl text-white tracking-wider uppercase border-b border-white/5 pb-2">
                  {editingReview ? 'Moderate Review' : 'Add Custom Review'}
                </h3>

                <form onSubmit={handleSaveReview} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Reviewer Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Star Rating (1-5)</label>
                    <select
                      value={reviewForm.stars}
                      onChange={(e) => setReviewForm({ ...reviewForm, stars: Number(e.target.value) })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3 outline-none text-white cursor-pointer"
                    >
                      <option value="5">★★★★★ 5 Stars</option>
                      <option value="4">★★★★☆ 4 Stars</option>
                      <option value="3">★★★☆☆ 3 Stars</option>
                      <option value="2">★★☆☆☆ 2 Stars</option>
                      <option value="1">★☆☆☆☆ 1 Star</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider">Review Comments *</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="w-full bg-[#13110E] border border-white/10 rounded-xl py-2.5 px-3.5 text-white outline-none h-20 resize-none font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 bg-[#13110E] p-4 rounded-xl border border-white/5">
                    <label className="font-montserrat font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-2">Reviewer Avatar</label>
                    <div className="flex items-center gap-4">
                      {reviewForm.photo && (
                        <img src={reviewForm.photo} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <input
                        type="file"
                        ref={reviewPhotoRef}
                        onChange={handleReviewPhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => reviewPhotoRef.current?.click()}
                        className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border border-white/10"
                      >
                        Choose Avatar
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-montserrat font-bold uppercase cursor-pointer text-center"
                  >
                    Save Review Details
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </>
  );
};