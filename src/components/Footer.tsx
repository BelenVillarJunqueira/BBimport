import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Lock, 
  PackageCheck, 
  Headphones, 
  Instagram, 
  Facebook, 
  MessageCircle 
} from 'lucide-react';
import { StoreContent } from '../types';

interface FooterProps {
  content: StoreContent;
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ content, onOpenAdmin, onOpenTracking }) => {
  const [clickCount, setClickCount] = useState(0);

  // Secret 5 clicks on copyright triggers hidden admin access
  const handleSecretCopyrightClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 5) {
      setClickCount(0);
      onOpenAdmin();
    } else {
      setClickCount(nextCount);
      // Reset counter after 3 seconds of inactivity
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  const instagramUrl = content.instagramUrl || 'https://instagram.com/bbimport_oficial';
  const facebookUrl = content.facebookUrl || 'https://facebook.com/bbimport.profesional';
  const whatsappUrl = `https://wa.me/${(content.whatsappNumber || '+549 3515 05-6742').replace(/\D/g, '')}?text=${encodeURIComponent('Hola BB IMPORT! Quiero consultar sobre sus máquinas cortadoras profesionales.')}`;

  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] text-zinc-400 text-xs">
      {/* Upper Features Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex items-center sm:items-start gap-3 justify-center sm:justify-start">
            <Truck className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-white uppercase text-xs">Envío Gratis a Todo el País</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Por Correo Argentino y Andreani con tracking</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3 justify-center sm:justify-start">
            <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-white uppercase text-xs">Garantía de 30 Días</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Satisfacción garantizada o reembolso total</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3 justify-center sm:justify-start">
            <Lock className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-white uppercase text-xs">Pago Seguro & Contra Entrega</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Pagas al recibir o con tarjetas encriptadas</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3 justify-center sm:justify-start">
            <Headphones className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-white uppercase text-xs">Soporte Técnico Especializado</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Atención personalizada por WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links, Social Networks & Tracking */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
              Despachos: ACTIVOS HOY
            </span>
          </div>
          <button
            onClick={onOpenTracking}
            className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Consultar Guía de Envío</span>
          </button>
        </div>

        {/* Social Networks: Instagram, Facebook & WhatsApp */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">Síguenos:</span>
          
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Instagram oficial de ${content.storeName}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 text-zinc-300 hover:text-white border border-white/10 transition-all font-medium text-xs group"
          >
            <Instagram className="w-4 h-4 text-pink-400 group-hover:text-white transition-colors" />
            <span>{content.instagramHandle || 'Instagram'}</span>
          </a>

          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Facebook oficial de ${content.storeName}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-600 text-zinc-300 hover:text-white border border-white/10 transition-all font-medium text-xs group"
          >
            <Facebook className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
            <span>{content.facebookPage || 'Facebook'}</span>
          </a>

          {content.whatsappNumber && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Atención directa por WhatsApp"
              className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-white/10 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Copyright & Hidden Trigger (No visible admin button) */}
        <div className="flex items-center">
          <span 
            onClick={handleSecretCopyrightClick}
            title="BB IMPORT Barbería Profesional"
            className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors select-none cursor-default"
          >
            © {new Date().getFullYear()} {content.storeName} PROFESIONAL. Todos los derechos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
};
