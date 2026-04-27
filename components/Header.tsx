import { ShieldCheck, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-20" style={{ background: "transparent" }}>
      <div className="container mx-auto px-10 max-w-7xl h-[100px] flex items-center justify-between">

        {/* Brand/Logo Section */}
        <div className="flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)"
            }}
          >
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl pointer-events-none" />
            <ShieldCheck size={30} className="text-white relative z-10" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[26px] font-bold tracking-tight text-white leading-tight">
              Generate License
            </h1>
            <p className="text-[15px] font-medium opacity-40 text-slate-300">
              License Manager
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
