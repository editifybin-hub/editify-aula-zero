"use client";

import { useState, useEffect } from "react";
import NotifyPopup from "@/components/NotifyPopup";

const DELAY_MS = 30 * 60 * 1000; // 30 minutes

export default function Page() {
  const [showCTA, setShowCTA] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Title / Tags */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-4 sm:pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-editify-accent bg-editify-accent/10 px-3 py-1 rounded-full">
            Aula 0
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-editify-muted bg-white/5 px-3 py-1 rounded-full">
            Treinamento Editify
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] text-white uppercase">
          Aula 0 | Treinamento Editify | Como conseguir seus primeiros clientes
          editando vídeos
        </h1>
      </header>

      {/* YouTube Embed */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-8">
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10"
          style={{
            aspectRatio: "16/9",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(227,6,19,0.08)",
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/wZU75p3hwPY?rel=0"
            title="Aula 0 — Como conseguir seus primeiros clientes editando vídeos"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* CTA Button — appears after 30 min */}
        {showCTA && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPopupOpen(true)}
              className="group flex items-center justify-center gap-3 bg-editify-accent text-white font-bold text-sm sm:text-base uppercase tracking-wider px-8 py-[18px] rounded-xl min-h-[58px] cursor-pointer transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5"
              style={{
                boxShadow:
                  "0 12px 40px rgba(227,6,19,0.38), 0 0 70px rgba(227,6,19,0.22)",
              }}
            >
              Quero ser notificado quando lançar
            </button>
          </div>
        )}
      </main>

      <NotifyPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
}
