import React from "react";
import { 
  Trophy, 
  Gift, 
  HelpCircle, 
  Award, 
  CheckCircle, 
  Shield,
  Smartphone,
  Watch,
  Headphones,
  Wifi
} from "lucide-react";
import { motion } from "motion/react";

export const RulesAndPrizes: React.FC = () => {
  const prizes = [
    {
      rank: "جوایز برتر رقابت‌ها (سه نفر اول)",
      amount: "۳ دستگاه گوشی هوشمند جدید",
      icon: Smartphone,
      color: "from-amber-400 to-yellow-300 text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      desc: "مخصوص سه کاربر اول جدول مسابقه (نفرات اول، دوم و سوم)."
    },
    {
      rank: "جایزه ویژه مسابقات",
      amount: "ساعت هوشمند دیجیتال",
      icon: Watch,
      color: "from-blue-400 to-indigo-300 text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      desc: "برای برندگان مسابقه شاد کیو."
    },
    {
      rank: "جایزه ویژه برندگان",
      amount: "هدفون بی‌سیم مدرن",
      icon: Headphones,
      color: "from-purple-400 to-pink-300 text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      desc: "برای برندگان مسابقه شاد کیو."
    },
    {
      rank: "طرح جوایز روزانه پویا",
      amount: "بسته‌های اینترنت و هدایای روزانه",
      icon: Wifi,
      color: "from-pink-500 to-rose-400 text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      desc: "شامل بسته‌های اینترنت پرسرعت همراه و جوایز نقدی/غیرنقدی به قید قرعه برای ترغیب کاربران به مشارکت روزانه."
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 select-none text-right"
      dir="rtl"
    >
      {/* Header Promo Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden shadow-xl text-right">
        {/* Colorful World Cup Stripe Highlight at the absolute edge top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-500 via-red-500 via-pink-500 to-blue-500" />
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-pink-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/10 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 px-3 py-1 rounded-full text-xs text-pink-300 font-black Persian-font">
              🎯 جوایز شگفت‌انگیز و هدایای مدرن
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300 tracking-tight Persian-font leading-normal">
              راهنما و جوایز ارزشمند پیش‌بینی جام جهانی ۲۰۲۶
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bold Persian-font max-w-2xl leading-relaxed">
              با پیش‌بینی صحیح مسابقات جام جهانی، شانس خود را برای دریافت یکی از ۳ گوشی همراه برتر، ساعتهای هوشمند، هندزفری‌های بی‌سیم و صدها جایزه و بسته اینترنت روزانه افزایش دهید!
            </p>
          </div>
          <div className="flex -space-x-4 space-x-reverse relative select-none">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-2xl shadow-lg border border-white/20 animate-bounce">
              🏆
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg border border-white/20 animate-pulse mt-4">
              🎁
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* RIGHT COLUMN - RULES CARD (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Top World Cup Grid Deco Bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-pink-550 to-emerald-500" />
          
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-450">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white Persian-font leading-none">
                  راهنمای شرکت در مسابقه
                </h3>
                <span className="text-[10px] text-indigo-300 font-bold tracking-wider uppercase block mt-1 Persian-font">روند ساده ثبت‌نام و دریافت امتیاز</span>
              </div>
            </div>

            {/* Rules Checklist */}
            <ul className="space-y-4 text-right">
              {[
                { text: "شرکت در مسابقه به صورت کاملا رایگان انجام می‌شود.", icon: CheckCircle, iconColor: "text-emerald-400 bg-emerald-500/10" },
                { text: "هر کاربر پس از ثبت‌نام یا ورود و تایید شماره تلفن، می‌تواند پیش‌بینی‌های خود را برای نتایج بازی‌های جام جهانی ثبت کند.", icon: CheckCircle, iconColor: "text-emerald-400 bg-emerald-500/10" },
                { text: "هر کاربر فقط مجاز به داشتن یک حساب کاربری است و تمام پیش‌بینی‌ها باید از طریق همان حساب ثبت شود.", icon: CheckCircle, iconColor: "text-emerald-400 bg-emerald-500/10" },
                { text: "پس از پایان هر بازی، امتیاز کاربر براساس نتیجه بازی و با توجه به جدول امتیازدهی محاسبه خواهد شد و کاربر در جدول لیدربورد رتبه خواهد گرفت.", icon: CheckCircle, iconColor: "text-emerald-400 bg-emerald-500/10" },
                { text: "پس از پایان رقابت‌ها و براساس رتبه نهایی کاربران در لیدربورد، جوایز ارزشمند به صورت مستقیم به برندگان اهدا خواهد شد.", icon: CheckCircle, iconColor: "text-emerald-400 bg-emerald-500/10" }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <li key={idx} className="flex gap-3 items-start group">
                    <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${item.iconColor} border border-white/5`}>
                      <IconComp size={14} />
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm font-bold leading-relaxed Persian-font group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* LEFT COLUMN - PRIZES CARD (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between relative">
          {/* Top World Cup Grid Deco Bar */}
          <div className="h-1 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500" />
          
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white Persian-font leading-none">
                    جوایز نفیس شادکیو
                  </h3>
                  <span className="text-[10px] text-amber-300 font-bold tracking-wider uppercase block mt-1 Persian-font">گوشی همراه، ساعت، هدفون و هدایای روزانه</span>
                </div>
              </div>
            </div>

            {/* Prizes List */}
            <div className="space-y-3.5">
              {prizes.map((prize, idx) => {
                const IconComp = prize.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-155 group"
                  >
                    <div className="text-right">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold block mb-1.5 Persian-font">{prize.rank}</span>
                      <h4 className="text-base sm:text-lg font-black text-white tracking-tight Persian-font group-hover:text-pink-300 duration-150">
                        {prize.amount}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold Persian-font mt-1">{prize.desc}</p>
                    </div>
                    
                    {/* The Prize Icon Container aligned on the left like the screenshot layout */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${prize.bg} shrink-0 shadow-md group-hover:scale-105 duration-200`}>
                      <IconComp size={22} className={prize.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>

      </div>
    </motion.div>
  );
};
