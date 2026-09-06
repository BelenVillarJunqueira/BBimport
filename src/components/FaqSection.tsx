import React, { useState } from 'react';
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import { initialFaqs } from '../initialData';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-24 border-t border-white/10 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            RESPUESTAS CLARAS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-zinc-400 text-sm">
            Resolvemos todas tus dudas para que compres con total tranquilidad y respaldo.
          </p>
        </div>

        <div className="space-y-3">
          {initialFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-[#111111] border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 bg-white/[0.01]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="p-6 bg-[#141414] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">¿Tienes alguna pregunta adicional?</p>
              <p className="text-xs text-zinc-400">Nuestro equipo de soporte por WhatsApp responde en menos de 10 minutos.</p>
            </div>
          </div>
          <a
            href="https://wa.me/?text=Hola%20BB%20IMPORT,%20quiero%20hacer%20una%20consulta%20sobre%20la%20m%C3%A1quina%20cortadora%20EXXTRA%20TECH"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0"
          >
            Chatear por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
