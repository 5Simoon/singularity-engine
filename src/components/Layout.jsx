import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, History, User, ChevronLeft, ChevronRight, Shield, Zap, LayoutDashboard, Menu, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/engine", icon: Cpu, label: "Compute Engine" },
  { path: "/history", icon: History, label: "History" },
  { path: "/api-keys", icon: Key, label: "API Keys" },
  { path: "/account", icon: User, label: "Account" },
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/4 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/3 blur-[80px]" />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full flex flex-col
        glass border-r border-white/[0.06] transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-[250px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] shrink-0">
          <div className="h-8 w-8 rounded-xl gradient-border flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="font-black text-lg tracking-widest glow-text-primary text-primary">NEXUS</span>
              <span className="block text-[9px] text-muted-foreground tracking-[0.3em] uppercase -mt-1">Math Engine</span>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${active
                    ? 'bg-primary/15 text-primary border border-primary/20 glow-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05] border border-transparent'}
                `}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {active && !collapsed && (
                  <motion.div layoutId="nav-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-2 space-y-1 shrink-0">
          {user && !collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl glass-lighter">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {user.full_name?.[0] || user.email?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.full_name || 'User'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 glass border-b border-white/[0.06] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-black tracking-widest text-primary">NEXUS</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}