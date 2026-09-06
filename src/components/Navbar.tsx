import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, Truck, PackageCheck, MessageCircle } from 'lucide-react';
import { StoreContent } from '../types';

interface NavbarProps {
  content: StoreContent;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onScrollToReviews: () => void;
  onScrollToFeatures: () => void;
  isAdminOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  content,
  cartCount,
  onOpenCart,
  onOpenTracking,
  onOpenAdmin,
  onScrollToReviews,
  onScrollToFeatures,
  isAdminOpen
}) => {
  const [logoClicks, setLogoClicks] = useState(0);

  // Secret 5 clicks on logo to open the hidden admin panel
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextCount = logoClicks + 1;
    if (nextCount >= 5) {
      setLogoClicks(0);
      onOpenAdmin();
    } else {
      setLogoClicks(nextCount);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black py-1.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 tracking-wide overflow-hidden shadow-sm">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{content.topBannerText}</span>
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand (with hidden 5-click admin trigger) */}
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 group text-left cursor-pointer select-none bg-transparent border-none p-0"
            title={content.storeName}
          >
            <span className="text-2xl font-black tracking-tighter text-white group-hover:opacity-90 transition-opacity">
              BB<span className="text-amber-500">IMPORT</span>
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400 tracking-wider">
            <button
              onClick={onScrollToFeatures}
              className="hover:text-white transition-colors cursor-pointer"
            >
              CARACTERÍSTICAS
            </button>
            <button
              onClick={onScrollToReviews}
              className="hover:text-white transition-colors cursor-pointer"
            >
              RESEÑAS (4.9★)
            </button>
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-bold"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              SEGUIMIENTO EN VIVO
            </button>
          </nav>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Tracking button mobile */}
          <button
            onClick={onOpenTracking}
            id="mobile-tracking-nav-btn"
            title="Seguimiento de Pedidos en Vivo"
            className="md:hidden flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors cursor-pointer active:scale-95"
          >
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-tight">Rastrear</span>
          </button>

          {/* WhatsApp Direct Support button */}
          {content.whatsappNumber && (
            <a
              href={`https://wa.me/${content.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola BB IMPORT, tengo una consulta sobre sus máquinas cortadoras.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Atención por WhatsApp"
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/40 px-3 py-1.5 rounded-xl transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-[11px]">WhatsApp</span>
            </a>
          )}

          {/* Cart Icon & Trigger */}
          <button
            onClick={onOpenCart}
            id="cart-nav-button"
            className="relative p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Abrir carrito de compras"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
