import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageSquare, Wrench, Sparkles, Menu, LogOut, Users, Activity, BarChart3, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer, BrandLogo, ClockBlock } from "@/components/HeaderWidgets";
import bgImage from "@assets/IMG_20260528_130508_015_1782175582895.jpg";
import { CONFIG } from "@/config";

// Floating particle component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="particle absolute w-1 h-1 rounded-full bg-[#00b4ff]/40"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }}
        />
      ))}
      {/* Larger glow orbs */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`orb-${i}`}
          className="orb absolute rounded-full"
          style={{
            width: `${60 + Math.random() * 80}px`,
            height: `${60 + Math.random() * 80}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(0,180,255,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(30,144,255,0.06) 0%, transparent 70%)',
            animationDelay: `${i * 2}s`,
            animationDuration: `${8 + i * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

// Scan line effect
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00b4ff]/20 to-transparent" />
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: "Home", path: "/" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "WhatsApp", path: "/whatsapp" },
    { icon: <Wrench className="w-5 h-5" />, label: "Tools", path: "/tools" },
    { icon: <Sparkles className="w-5 h-5" />, label: "Anime", path: "/anime" },
  ];

  const adminItems = [
    { icon: <Users className="w-5 h-5" />, label: "Manage Users", path: "/admin/users" },
    { icon: <Activity className="w-5 h-5" />, label: "System Logs", path: "/admin/logs" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Statistics", path: "/admin/stats" },
  ];

  const daysLeft = user?.expiredAt
    ? Math.max(0, Math.ceil((new Date(user.expiredAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex justify-center w-full font-sans text-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-[430px] h-full">
          <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a0e1a]/85 backdrop-blur-[2px]" />
          <FloatingParticles />
          <ScanLine />
        </div>
      </div>

      <div className="mobile-app-container z-10 w-full max-w-[430px] h-[100dvh] flex flex-col relative bg-transparent border-x border-[#00b4ff]/10">
        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00b4ff]/50 z-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00b4ff]/50 z-30 pointer-events-none" />

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 glass-panel shrink-0 z-20 sticky top-0 relative overflow-hidden">
          {/* Header glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00b4ff]/60 to-transparent" />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#00b4ff]/20 hover:text-[#00b4ff] transition-all">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-[#0a0e1a]/97 backdrop-blur-xl border-r border-[#00b4ff]/30 p-0 flex flex-col">
              {/* Profile Header */}
              <SheetHeader className="p-6 border-b border-[#00b4ff]/20 text-left relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00b4ff]/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00b4ff]/40 to-transparent" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-[#00b4ff] shadow-[0_0_20px_rgba(0,180,255,0.5)]">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-[#00b4ff] to-[#1e90ff] text-white font-bold text-xl">
                        {user?.username?.substring(0, 2).toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0e1a] animate-pulse" />
                  </div>
                  <div>
                    <SheetTitle className="text-white text-lg font-bold cyber-glow-text mb-1">{user?.username}</SheetTitle>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-[#0a0e1a] text-[#00b4ff] border-[#00b4ff]/50 w-fit text-[10px] px-2 py-0">
                        ROLE: {user?.role?.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-[#0a0e1a] text-green-400 border-green-500/50 w-fit text-[10px] px-2 py-0">
                        EXPIRED: {daysLeft !== null ? `${daysLeft} DAYS` : "LIFETIME"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Main Nav */}
                <div className="text-[10px] text-gray-500 font-mono mb-2 px-2 tracking-widest">NAVIGASI UTAMA</div>
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#00b4ff]/15 text-[#00b4ff] border border-[#00b4ff]/30 shadow-[0_0_10px_rgba(0,180,255,0.1)]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={isActive ? "text-[#00b4ff]" : "text-gray-400"}>{item.icon}</span>
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto w-1.5 h-1.5 bg-[#00b4ff] rounded-full shadow-[0_0_6px_#00b4ff]"
                        />
                      )}
                    </motion.button>
                  );
                })}

                {/* Admin Nav */}
                {user?.role === "admin" && (
                  <div className="mt-4 pt-4 border-t border-[#00b4ff]/10">
                    <div className="text-[10px] text-gray-500 font-mono mb-2 px-2 tracking-widest flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" /> ADMIN PANEL
                    </div>
                    {adminItems.map((item) => {
                      const isActive = location === item.path;
                      return (
                        <motion.button
                          key={item.path}
                          onClick={() => setLocation(item.path)}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className={isActive ? "text-yellow-400" : "text-gray-500"}>{item.icon}</span>
                          {item.label}
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#00b4ff]/10">
                <div className="text-[10px] text-gray-500 font-mono text-center mb-3">
                  {CONFIG.APP_NAME} v{CONFIG.APP_VERSION}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent text-sm h-10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size={34} />
          </div>

          {/* Right: clock + audio + status + avatar */}
          <div className="flex items-center gap-2">
            <ClockBlock compact />
            <AudioPlayer />
            <Avatar className="w-8 h-8 border border-[#00b4ff]/50">
              <AvatarFallback className="bg-gradient-to-br from-[#00b4ff] to-[#1e90ff] text-white font-bold text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full pb-20"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="h-16 glass-panel border-t border-[#00b4ff]/20 absolute bottom-0 left-0 w-full flex items-center justify-around px-2 z-20 pb-safe">
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00b4ff]/40 to-transparent" />

          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-200 ${
                  isActive ? "text-[#00b4ff]" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-10 h-[2px] bg-[#00b4ff] shadow-[0_0_10px_#00b4ff] rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-1"
                >
                  {item.icon}
                </motion.div>
                <span className={`text-[10px] font-medium transition-all ${isActive ? "opacity-100 font-bold" : "opacity-60"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-[#00b4ff]/5 rounded-lg -z-10 pointer-events-none" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}