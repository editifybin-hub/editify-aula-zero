"use client";

import { useState } from "react";
import NotifyPopup from "@/components/NotifyPopup";

export default function Page() {
  const [popupOpen, setPopupOpen] = useState(false);

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
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-12">
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

        {/* CTA Button — always visible */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-editify-muted text-center text-sm sm:text-base max-w-lg">
            Entre na lista para ser notificado e garantir o menor preço no dia
            da abertura.
          </p>
          <button
            onClick={() => setPopupOpen(true)}
            className="group flex items-center justify-center gap-3 bg-editify-accent text-white font-bold text-sm sm:text-base uppercase tracking-wider px-8 py-[18px] rounded-xl min-h-[58px] cursor-pointer transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 w-full sm:w-auto"
            style={{
              boxShadow:
                "0 12px 40px rgba(227,6,19,0.38), 0 0 70px rgba(227,6,19,0.22)",
            }}
          >
            Quero ser notificado quando lançar
          </button>
        </div>
      </main>

      <NotifyPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
}
