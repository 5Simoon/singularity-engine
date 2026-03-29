import { motion } from "framer-motion";

const colorMap = {
  primary: { icon: 'text-primary bg-primary/10', glow: 'hover:glow-primary', border: 'hover:border-primary/20' },
  accent: { icon: 'text-accent bg-accent/10', glow: 'hover:glow-accent', border: 'hover:border-accent/20' },
  green: { icon: 'text-green-400 bg-green-400/10', glow: '', border: 'hover:border-green-400/20' },
  orange: { icon: 'text-orange-400 bg-orange-400/10', glow: '', border: 'hover:border-orange-400/20' },
};

export default function StatCard({ icon: Icon, label, value, sublabel, color = "primary" }) {
  const c = colorMap[color] || colorMap.primary;
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`p-4 rounded-2xl glass-card ${c.border} ${c.glow} transition-all duration-300 cursor-default`}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sublabel}</p>}
    </motion.div>
  );
}
