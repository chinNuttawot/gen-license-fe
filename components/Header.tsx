import { ShieldCheck, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="glass sticky top-0 z-20" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container mx-auto px-6 max-w-5xl h-[60px] flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
            }}
          >
            <ShieldCheck size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none tracking-wide text-white">Generate License</p>
            <p className="text-[10px] leading-none mt-1 font-medium" style={{ color: "#64748b" }}>
              License Manager
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
