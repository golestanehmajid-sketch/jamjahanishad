import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  Search, 
  Download, 
  Check, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Trophy, 
  Settings, 
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Calendar,
  User,
  Heart,
  Crown,
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Trash,
  HelpCircle,
  Zap,
  Target,
  Flame,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TEAMS } from "../data";
import { getUserLevel, BADGE_CONFIG, deriveBadgesForScore } from "../utils/scoring";

const badgeIconMap: Record<string, React.ReactNode> = {
  FIRST_KICK: <Zap size={11} />,
  EXACT_MASTER: <Target size={11} />,
  STREAK_3: <Flame size={11} />,
  GROUP_WIZARD: <Sparkles size={11} />,
  KNOCKOUT_NINJA: <Award size={11} />,
  CHAMPION_PROPHET: <Crown size={11} />,
};

export interface Participant {
  id: string;
  name: string;
  favoriteTeam: string;
  predictedChampion: string;
  predScore: number;
  status: "active" | "completed" | "pending";
  phoneOrEmail?: string;
  isPublished: boolean;
  registeredAt: string;
  predictionsCount: number;
}

export const ParticipantsDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and visual filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pubFilter, setPubFilter] = useState<string>("all");

  // Admin access mode states
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [adminError, setAdminError] = useState<string | null>(null);

  // Form states for Create/Edit
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  
  // Custom dialog notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  // Custom confirm dialogs
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
  } | null>(null);

  // Form input fields
  const [formName, setFormName] = useState<string>("");
  const [formFavTeam, setFormFavTeam] = useState<string>("ایران");
  const [formChamp, setFormChamp] = useState<string>("برزیل");
  const [formScore, setFormScore] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<"active" | "completed" | "pending">("completed");
  const [formContact, setFormContact] = useState<string>("");
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formPredCount, setFormPredCount] = useState<number>(48);

  // Campaign Ultimate Champion States
  const [campaignChamp, setCampaignChamp] = useState<string>(() => localStorage.getItem("predictor_campaign_champ") || "");
  const [isChampSelectorOpen, setIsChampSelectorOpen] = useState<boolean>(false);
  const [champSearchQuery, setChampSearchQuery] = useState<string>("");

  const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Load participants from API
  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/participants");
      if (!res.ok) throw new Error("خطا در دریافت لیست شرکت‌کنندگان از سرور");
      const data = await res.json();
      setParticipants(data);
    } catch (err: any) {
      setError(err.message || "امکان برقراری ارتباط با بانک اطلاعاتی وجود ندارد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    if (!isAdminMode) {
      setSearchQuery("");
    }
  }, [isAdminMode]);

  // Save or Create entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast("لطفاً نام شرکت‌کننده را وارد کنید", "error");
      return;
    }

    const payload = {
      name: formName,
      favoriteTeam: formFavTeam,
      predictedChampion: formChamp,
      predScore: Number(formScore) || 0,
      status: formStatus,
      phoneOrEmail: formContact,
      isPublished: formIsPublished,
      predictionsCount: Number(formPredCount) || 48
    };

    try {
      let res;
      if (editingParticipant) {
        // Edit existing
        res = await fetch(`/api/participants/${editingParticipant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        res = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error("خطا در ذخیره‌سازی اطلاعات روی سرور");
      
      triggerToast(
        editingParticipant ? "مشخصات شرکت‌کننده با موفقیت بروزرسانی شد" : "شرکت‌کننده جدید با موفقیت اضافه شد",
        "success"
      );
      await loadParticipants();
      closeForm();
    } catch (err: any) {
      triggerToast(err.message || "خطا در برقراری ارتباط", "error");
    }
  };

  // Open Form for Adding
  const openAddForm = () => {
    setEditingParticipant(null);
    setFormName("");
    setFormFavTeam("ایران");
    setFormChamp("برزیل");
    setFormScore(0);
    setFormStatus("completed");
    setFormContact("");
    setFormIsPublished(true);
    setFormPredCount(48);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const openEditForm = (p: Participant) => {
    setEditingParticipant(p);
    setFormName(p.name);
    setFormFavTeam(p.favoriteTeam);
    setFormChamp(p.predictedChampion);
    setFormScore(p.predScore);
    setFormStatus(p.status);
    setFormContact(p.phoneOrEmail || "");
    setFormIsPublished(p.isPublished);
    setFormPredCount(p.predictionsCount || 48);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingParticipant(null);
  };

  // Custom Confirm wrapper
  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "بله، انجام شود") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      },
      confirmText
    });
  };

  // Delete participant
  const handleDelete = async (id: string) => {
    showCustomConfirm(
      "حذف شرکت‌کننده",
      "آیا از حذف دائم این شرکت‌کننده اطمینان دارید؟ این عملیات غیر قابل بازگشت است.",
      async () => {
        try {
          const res = await fetch(`/api/participants/${id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw new Error("امکان حذف رکورد وجود نداشت");
          triggerToast("شرکت‌کننده مورد نظر با موفقیت حذف شد", "success");
          await loadParticipants();
        } catch (err: any) {
          triggerToast(err.message, "error");
        }
      },
      "حذف قطعی"
    );
  };

  // Toggle publish status instantly
  const handleTogglePublish = async (p: Participant) => {
    try {
      const res = await fetch(`/api/participants/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !p.isPublished })
      });
      if (!res.ok) throw new Error("خطا در تغییر وضعیت انتشار");
      triggerToast(
        p.isPublished ? "انتشار رکورد لغو شد" : "رکورد در جدول عمومی منتشر شد",
        "success"
      );
      await loadParticipants();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  // Bulk Seed Mock Data
  const handleSeedSamples = async () => {
    const samples: Participant[] = [
      { id: "p-s1", name: "امیر قلعه‌نویی", favoriteTeam: "ایران", predictedChampion: "برزیل", predScore: 88, status: "completed", phoneOrEmail: "ghalenoei@teammelli.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۸", predictionsCount: 48 },
      { id: "p-s2", name: "پیمان یوسفی", favoriteTeam: "انگلستان", predictedChampion: "فرانسه", predScore: 62, status: "completed", phoneOrEmail: "yousefi@irib.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 },
      { id: "p-s3", name: "سردار آزمون", favoriteTeam: "ایران", predictedChampion: "آلمان", predScore: 92, status: "completed", phoneOrEmail: "sardar@roma.it", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 },
      { id: "p-s4", name: "علیرضا بیرانوند", favoriteTeam: "ایران", predictedChampion: "آرژانتین", predScore: 71, status: "completed", phoneOrEmail: "beyro@tractor.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۲۰", predictionsCount: 44 },
      { id: "p-s5", name: "عادل فردوسی‌پور", favoriteTeam: "انگلستان", predictedChampion: "ایتالیا", predScore: 85, status: "completed", phoneOrEmail: "adel@football360.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۲۰", predictionsCount: 48 },
      { id: "p-s6", name: "مهرداد محمدی", favoriteTeam: "پرتغال", predictedChampion: "پرتغال", predScore: 49, status: "active", phoneOrEmail: "mehrdad@esteghlal.ir", isPublished: false, registeredAt: "۱۴۰۵/۰۳/۲۱", predictionsCount: 30 }
    ];

    showCustomConfirm(
      "بارگذاری داده‌های نمونه پیش‌فرض",
      "آیا مایلید لیست پیش‌فرض شرکت‌کنندگان مشهور (علی دایی، فردوسی‌پور، قلعه‌نویی و...) را مجدداً بارگذاری کنید؟ (این کار نمونه‌های باکیفیت و دیدنی به دیتابیس اضافه می‌کند.)",
      async () => {
        try {
          const res = await fetch("/api/participants/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(samples)
          });
          if (!res.ok) throw new Error("بارگذاری با خطا مواجه شد");
          triggerToast("به‌روزبودن داده‌های نمونه تفریحی اعمال شد", "success");
          await loadParticipants();
        } catch (err: any) {
          triggerToast("خطا در ایجاد داده‌های نمونه روی بانک اطلاعاتی", "error");
        }
      },
      "تایید بارگذاری"
    );
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(participants, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "world_cup_participants.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast("پشتیبان‌گیری و خروجی فایل JSON با موفقیت انجام شد", "success");
  };

  // Custom Admin passcode processor
  const handleAdminVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === "boghchi_iran1405@21339876") {
      setIsAdminMode(true);
      setIsAdminModalOpen(false);
      setAdminPasswordInput("");
      setAdminError(null);
      triggerToast("دسترسی کاربری مدیر مسابقات با موفقیت تایید شد", "success");
    } else {
      setAdminError("رمز عبور صحیح نیست");
    }
  };

  // Filtering calculations
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.favoriteTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.predictedChampion.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    let matchesPub = true;
    if (pubFilter === "published") matchesPub = p.isPublished;
    if (pubFilter === "unpublished") matchesPub = !p.isPublished;

    return matchesSearch && matchesStatus && matchesPub;
  });

  // Sort by score descending (high to low rank)
  const sortedParticipants = [...filteredParticipants].sort((a, b) => b.predScore - a.predScore);

  // Aggregate Stats
  const totalCount = participants.length;
  const publishedCount = participants.filter(p => p.isPublished).length;
  const averageScore = totalCount > 0 ? Math.round(participants.reduce((acc, curr) => acc + curr.predScore, 0) / totalCount) : 0;
  
  return (
    <div className="space-y-6 text-right relative" dir="rtl">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 max-w-md ${
              toastType === "success" 
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
                : toastType === "error"
                ? "bg-rose-950/80 border-rose-500/30 text-rose-300"
                : "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toastType === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : toastType === "error" ? (
                <AlertCircle size={18} className="text-rose-400" />
              ) : (
                <Info size={18} className="text-indigo-400" />
              )}
            </div>
            <div className="flex-grow space-y-1">
              <span className="block text-xs font-bold leading-relaxed">{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white duration-150 p-0.5 rounded-lg hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setConfirmConfig(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-905/70 backdrop-blur-xl bg-slate-900/85 p-6 shadow-2xl space-y-5 text-right font-sans"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <AlertCircle size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-100">{confirmConfig.title}</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {confirmConfig.message}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmConfig(null)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-white/5 text-slate-400 font-bold text-xs hover:bg-slate-900 duration-150 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-rose-500/10"
                >
                  {confirmConfig.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Admin Login Overlay Gate */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={() => setIsAdminModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 shadow-2xl space-y-5 text-right"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <Lock size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-100">کاربری مدیر کل مسابقات</h3>
                </div>
                <button 
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 duration-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                جهت دسترسی به ویرایش امتیازات، حذف، لغو انتشار یا تزریق خودکار شرکت‌کنندگان فانتزی، گذرواژه ابری مدیریت را وارد نمایید.
              </p>

              <form onSubmit={handleAdminVerifySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold">گذرواژه اصلی مدیریت:</label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="رمز ورود"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-center text-slate-200 tracking-widest outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 duration-150"
                  />
                  {adminError && (
                    <span className="block text-[10px] font-bold text-rose-400 mt-1">{adminError}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="w-1/2 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-400 font-bold text-xs hover:bg-slate-900 duration-150 cursor-pointer text-center"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg hover:shadow-pink-500/20 text-center"
                  >
                    تایید رمز عبور
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Ultimate Champion Selector Modal */}
      <AnimatePresence>
        {isChampSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsChampSelectorOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-6 shadow-2xl space-y-4 text-right flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <Trophy size={16} className="text-yellow-400 rotate-12" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100">انتخاب قهرمان طلایی جام</h3>
                    <p className="text-[10px] text-slate-400">یک تیم را به عنوان پیش‌بینی فاتح جام انتخاب کنید</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChampSelectorOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 duration-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="جستجوی نام کشور یا کلمه کلیدی..."
                  value={champSearchQuery}
                  onChange={(e) => setChampSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40"
                />
              </div>

              {/* Grid of Teams */}
              <div className="overflow-y-auto pr-1 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                  {Array.from(new Map(Object.values(TEAMS).map(t => [t.id, t])).values())
                    .filter(t => 
                      t.name.includes(champSearchQuery) || 
                      t.nameEn.toLowerCase().includes(champSearchQuery.toLowerCase())
                    )
                    .map(t => {
                      const isSelected = campaignChamp === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCampaignChamp(t.id);
                            localStorage.setItem("predictor_campaign_champ", t.id);
                            setIsChampSelectorOpen(false);
                            triggerToast(`تیم ${t.name} به عنوان قهرمان نهایی ثبت شد! ۱۵۰ امتیاز ویژه هدیه برای شما فعال گشت. 🏆🔥`, "success");
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-150 text-right w-full cursor-pointer hover:scale-[1.02] ${
                            isSelected 
                              ? "bg-gradient-to-l from-pink-500/25 to-indigo-500/25 border-pink-500 text-white font-black" 
                              : "bg-slate-950/40 hover:bg-slate-950/90 border-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          <span className="text-xl select-none">{t.flag}</span>
                          <div className="flex flex-col text-right leading-none min-w-0 flex-1">
                            <span className="text-xs font-black truncate">{t.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono truncate">{t.nameEn}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={13} className="text-pink-400 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-500 pt-2 border-t border-white/5">
                🎁 با انتخاب قهرمان زودهنگام، <span className="text-pink-400 font-bold">۱۵۰ امتیاز بونس</span> ویژه به محاسبات کلوپ ورزشی شما افزوده می‌شود.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Removed various stats, campaign, and description sections as requested by the user */}

      {/* Stats Summary Panel - Sleek glass buttons with glow - ONLY FOR ADMIN */}
      {isAdminMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-4 flex items-center gap-4 shadow-xl transition-all hover:border-white/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/[0.03] rounded-full blur-xl pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/10">
              <Users size={18} />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold mb-0.5">کل شرکت‌کنندگان پرونده شده</span>
              <span className="text-lg font-mono font-black text-slate-100">{totalCount} نفر</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-4 flex items-center gap-4 shadow-xl transition-all hover:border-white/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/[0.03] rounded-full blur-xl pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
              <Eye size={18} />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold mb-0.5">موارد منتشر شده در جدول عمومی</span>
              <span className="text-lg font-mono font-black text-emerald-400">{publishedCount} نفر</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-4 flex items-center gap-4 shadow-xl transition-all hover:border-white/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/[0.03] rounded-full blur-xl pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/10">
              <Trophy size={18} className="text-teal-400" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-bold mb-0.5">میانگین امتیاز پیش‌بینی پیشتازان</span>
              <span className="text-lg font-mono font-black text-teal-400">{averageScore} امتیاز</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Panel Zone */}
      <div className="bg-slate-905/30 border border-white/10 bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search Input Custom Glass */}
            {isAdminMode && (
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} className="text-slate-400" />
                </span>
                <input
                  id="search-participants-input"
                  type="text"
                  placeholder="جستجو نام، تیم یا قهرمان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl pr-9 pl-3.5 py-2 text-xs font-bold text-slate-200 placeholder-slate-500 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 duration-150 transition-all text-right"
                />
              </div>
            )}

            {/* Filter by Status */}
            <div>
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="completed">ثبت نهایی کامل</option>
                <option value="active">در حال نگارش</option>
                <option value="pending">در انتظار تایید</option>
              </select>
            </div>

            {/* Filter by Publication */}
            {isAdminMode && (
              <div>
                <select
                  id="filter-publication-select"
                  value={pubFilter}
                  onChange={(e) => setPubFilter(e.target.value)}
                  className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20"
                >
                  <option value="all">همه انتشارها</option>
                  <option value="published">منتقل شده به جدول عمومی</option>
                  <option value="unpublished">پیش‌نویس / منتشر نشده</option>
                </select>
              </div>
            )}

            <button 
              id="reload-participants-btn"
              onClick={loadParticipants}
              className="p-2 sm:p-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-slate-400 hover:text-slate-200 duration-150 cursor-pointer hover:bg-slate-900/60"
              title="بارگذاری مجدد"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Admin Operations Quick Buttons */}
          {isAdminMode && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                id="add-participant-btn"
                onClick={openAddForm}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
              >
                <UserPlus size={13} />
                <span>افزودن شرکت‌کننده جدید</span>
              </button>

              <button
                id="seed-samples-btn"
                onClick={handleSeedSamples}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-xs hover:bg-indigo-500/20 duration-150 cursor-pointer shadow-md"
                title="تولید داده‌های نمونه برای دمو"
              >
                <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                <span>بارگذاری نمونه</span>
              </button>

              <button
                id="export-participants-btn"
                onClick={handleExportJSON}
                className="p-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-slate-400 hover:text-slate-200 duration-150 cursor-pointer hover:bg-slate-900"
                title="خروجی فایل پشتیبان JSON"
              >
                <Download size={14} className="text-slate-400" />
              </button>
            </div>
          )}

        </div>

        {/* Create/Edit Modal Form Glass inline */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-slate-950/50 border border-pink-500/20 rounded-2xl p-5 mb-5 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <h4 className="text-xs font-black text-pink-400 flex items-center gap-1.5">
                  <FileText size={15} />
                  <span>{editingParticipant ? `ویرایش اطلاعات شرکت‌کننده: ${editingParticipant.name}` : "افزودن ورودی جدید"}</span>
                </h4>
                <button 
                  onClick={closeForm}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <form id="participant-manage-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">نام و نام خانوادگی:</label>
                  <input
                    id="form-input-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: علیرضا فغانی"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40"
                  />
                </div>

                {/* Favorite Team */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">تیم محبوب:</label>
                  <input
                    id="form-input-favteam"
                    type="text"
                    required
                    value={formFavTeam}
                    onChange={(e) => setFormFavTeam(e.target.value)}
                    placeholder="مثال: ایران، بلژیک"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40"
                  />
                </div>

                {/* Predicted Champion */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">قهرمان پیش‌بینی شده:</label>
                  <input
                    id="form-input-champ"
                    type="text"
                    required
                    value={formChamp}
                    onChange={(e) => setFormChamp(e.target.value)}
                    placeholder="مثال: برزیل، فرانسه"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40"
                  />
                </div>

                {/* Score */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">امتیاز فعلی کارشناسی:</label>
                  <input
                    id="form-input-score"
                    type="number"
                    min="0"
                    max="1000"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none font-mono focus:border-pink-500/40"
                  />
                </div>

                {/* Contact Information (visible for admins only) */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">تماس / ایمیل (غیرعمومی):</label>
                  <input
                    id="form-input-contact"
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none text-left font-mono focus:border-pink-500/40"
                    dir="ltr"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">وضعیت پیش‌بینی:</label>
                  <select
                    id="form-input-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40"
                  >
                    <option value="completed">ثبت نهایی کامل</option>
                    <option value="active">در حال نگارش (فعال)</option>
                    <option value="pending">در انتظار تایید</option>
                  </select>
                </div>

                {/* Predictions Count */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">تعداد پیش‌بینی مسابقات:</label>
                  <input
                    id="form-input-predcount"
                    type="number"
                    min="0"
                    max="64"
                    value={formPredCount}
                    onChange={(e) => setFormPredCount(Number(e.target.value) || 48)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none font-mono focus:border-pink-500/40"
                  />
                </div>

                {/* Published status toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="form-input-ispublished"
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="h-4 w-4 bg-slate-900 border-white/10 rounded text-pink-500 focus:ring-transparent cursor-pointer"
                  />
                  <label htmlFor="form-input-ispublished" className="text-xs font-bold text-slate-200 select-none cursor-pointer">
                    انتشار مستقیم در جدول عمومی اپ
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t border-white/5 mt-2">
                  <button
                    id="cancel-form-btn"
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-slate-400 font-bold text-xs hover:bg-slate-800 duration-150 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    id="save-participant-form-btn"
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs duration-150 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {editingParticipant ? "بروزرسانی تغییرات" : "ثبت و اضافه‌سازی شرکت‌کننده"}
                  </button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Table View */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="relative mx-auto h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-pink-500/10 mb-1"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-pink-500 animate-spin"></div>
            </div>
            <p className="text-slate-400 font-bold text-xs animate-pulse">دریافت لیست شرکت‌کنندگان مسابقه پیش‌بینی...</p>
          </div>
        ) : error ? (
          <div className="border border-red-500/20 bg-red-505/[0.04] backdrop-blur-md rounded-2xl p-8 text-center space-y-3 max-w-xl mx-auto my-6">
            <AlertCircle className="mx-auto text-red-400 animate-pulse" size={32} />
            <p className="text-slate-350 font-bold text-xs leading-relaxed">{error}</p>
            <button
              id="retry-participants-loading-btn"
              onClick={loadParticipants}
              className="mx-auto flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black cursor-pointer hover:bg-red-500/20 duration-150"
            >
              <RefreshCw size={12} />
              <span>تلاش دوباره و همگام‌سازی</span>
            </button>
          </div>
        ) : sortedParticipants.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl space-y-3 text-slate-500 bg-slate-950/10">
            <Users size={40} className="mx-auto text-slate-600 mb-1" />
            <p className="text-xs font-bold text-slate-400">هیچ مورد مشارکت‌کننده‌ای با این شروط فیلتر یافت نشد.</p>
            {isAdminMode ? (
              <button
                id="add-first-participant-btn"
                onClick={openAddForm}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 font-black text-xs hover:bg-pink-500/20 duration-150"
              >
                <PlusCircle size={12} />
                <span>اولین شرکت‌کننده را بسازید</span>
              </button>
            ) : (
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                مدیران سامانه می‌توانند با استفاده از دکمه «ورود کاربری مدیر» در بالا سمت چپ، شرکت‌کننده جدید ثبت کنند یا نمونه‌های فانتزی بارگذاری نمایند.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/20 shadow-xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-xs font-black border-b border-white/10 backdrop-blur-md">
                  <th className="p-4 text-center w-14">رتبه</th>
                  <th className="p-4">نام و مشخصات شرکت‌کننده</th>
                  <th className="p-4">لول و نشان‌های افتخار</th>
                  <th className="p-4">تیم محبوب</th>
                  <th className="p-4">قهرمان پیش‌بینی شده</th>
                  <th className="p-4 text-center">تعداد پیش‌بینی</th>
                  <th className="p-4 text-center">امتیاز کارشناسی</th>
                  <th className="p-4 text-center">وضعیت</th>
                  {isAdminMode && <th className="p-4 text-center w-[180px]">مدیریت رکورد</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-semibold">
                {sortedParticipants.map((p, index) => {
                  // If it's not published and we are NOT admin, do not show it!
                  if (!p.isPublished && !isAdminMode) return null;

                  const isTopRank = index < 3;
                  const rankColors = [
                    "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10", // Rank 1
                    "bg-slate-300/20 text-slate-200 border-slate-300/40 shadow-slate-300/10", // Rank 2
                    "bg-amber-700/20 text-amber-500 border-amber-800/40 shadow-amber-700/10"  // Rank 3
                  ];

                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-white/[0.03] transition-all border-white/5 ${
                        !p.isPublished ? "opacity-45 bg-slate-950/40" : ""
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center font-mono font-bold h-7 w-7 rounded-lg text-[11px] border shadow-md ${
                          isTopRank ? rankColors[index] : "bg-slate-950/80 text-slate-400 border-white/5"
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Participant Name detail */}
                      <td className="p-4 font-bold text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-pink-500/[0.06] text-pink-400">
                            <User size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-sans text-slate-100 font-black tracking-tight flex items-center gap-1">
                              {p.name}
                              {index === 0 && <Crown size={12} className="text-amber-400 fill-amber-400 animate-bounce" />}
                            </span>
                            <div className="flex flex-col gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider flex items-center gap-1">
                                <Calendar size={10} className="text-slate-600" />
                                {p.registeredAt || "۱۴۰۵/۰۳/۱۵"}
                              </span>
                              <span className="inline-flex self-start text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-black max-w-max">
                                {getUserLevel(p.predScore).title}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Achievements Badges */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {deriveBadgesForScore(p.predScore, p.predictionsCount || 48).map((badgeKey) => {
                            const config = BADGE_CONFIG[badgeKey as keyof typeof BADGE_CONFIG];
                            if (!config) return null;
                            const icon = badgeIconMap[badgeKey] || <Zap size={11} />;
                            return (
                              <span 
                                key={badgeKey}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black cursor-help transform hover:scale-105 duration-100 transition-all ${config.color}`}
                                title={`${config.label}: ${config.desc}`}
                              >
                                {icon}
                                <span>{config.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Favorite Team */}
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/[0.04] border border-indigo-500/10 text-indigo-300 font-black">
                          <Heart size={11} className="text-pink-500 fill-pink-500/20" />
                          <span>{p.favoriteTeam}</span>
                        </div>
                      </td>

                      {/* Predicted Champion */}
                      <td className="p-4 text-slate-300 font-black">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm backdrop-blur-md">
                          <Trophy size={11} className="text-amber-400" />
                          <span className="text-slate-100">{p.predictedChampion}</span>
                        </span>
                      </td>

                      {/* Predictions Count */}
                      <td className="p-4 text-center font-mono font-bold text-slate-400">
                        <div className="inline-flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5">
                          <span className="text-slate-100 font-black">{p.predictionsCount || 48}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-500">۴۸ بازی</span>
                        </div>
                      </td>

                      {/* Score point */}
                      <td className="p-4 text-center font-mono font-black text-sm">
                        <span className="inline-flex items-center gap-1 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                          <span>{p.predScore}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-500/70">pts</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          p.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : p.status === "active" 
                            ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            p.status === "completed" ? "bg-emerald-400" : p.status === "active" ? "bg-teal-400" : "bg-amber-400"
                          } animate-pulse`}></span>
                          {p.status === "completed" ? "ثبت کامل" :
                           p.status === "active" ? "درحال پیش‌بینی" : "در انتظار تایید"}
                        </span>
                      </td>

                      {/* Admin Operations Row buttons */}
                      {isAdminMode && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Contact display for admin check */}
                            {p.phoneOrEmail && (
                              <span 
                                className="px-2 py-1 rounded bg-slate-950 border border-white/5 font-mono text-[9px] text-slate-400 tracking-tight"
                                title={p.phoneOrEmail}
                              >
                                {p.phoneOrEmail.length > 12 ? p.phoneOrEmail.substring(0, 11) + "..." : p.phoneOrEmail}
                              </span>
                            )}

                            {/* Un/Publish button toggle */}
                            <button
                              id={`togglepub-${p.id}`}
                              onClick={() => handleTogglePublish(p)}
                              className={`p-1.5 rounded-lg border cursor-pointer duration-150 transform hover:scale-105 ${
                                p.isPublished 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25" 
                                  : "bg-slate-900 border-white/10 text-slate-500 hover:text-slate-300"
                              }`}
                              title={p.isPublished ? "لغو انتشار عمومی" : "انتشار در جدول عمومی"}
                            >
                              {p.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>

                            {/* Edit button */}
                            <button
                              id={`edit-${p.id}`}
                              onClick={() => openEditForm(p)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/25 hover:border-indigo-400/40 cursor-pointer duration-150 transform hover:scale-105"
                              title="ویرایش اطلاعات"
                            >
                              <Edit3 size={12} />
                            </button>

                            {/* Delete button */}
                            <button
                              id={`delete-${p.id}`}
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/25 hover:border-rose-400/40 cursor-pointer duration-150 transform hover:scale-105"
                              title="حذف کامل رکورد"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tip section glass with a yellow left-accent border */}
        <div className="p-4 mt-6 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 border-l-2 border-l-pink-500 flex gap-3 text-slate-400 text-xs">
          <Info size={16} className="text-pink-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="font-bold text-slate-300">راهنمای انتشار در جدول عمومی مسابقه:</p>
            <p className="leading-relaxed text-[11px] text-slate-400">
              جدول رتبه‌بندی فوق محل ثبت و نمایش امتیازات شرکت‌کنندگانی است که پیش‌بینی خود را تا روز افتتاحیه نهایی کرده‌اند. محاسبات امتیازات کماکان بر اساس تعداد تخمین‌های درست در بازی‌های گروهی پس از هر مسابقه زنده با همکاری ردیاب رسمی سنکرون پلتفرم، بروز می‌شود.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
