import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Flame, 
  Package, 
  CreditCard, 
  Banknote, 
  ChevronRight, 
  Zap, 
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { BundleOffer, ProductVariant, StoreContent } from '../types';

interface ProductDetailsProps {
  content: StoreContent;
  variants: ProductVariant[];
  bundles: BundleOffer[];
  selectedVariant: ProductVariant;
  onSelectVariant: (v: ProductVariant) => void;
  selectedBundle: BundleOffer;
  onSelectBundle: (b: BundleOffer) => void;
  onBuyNow: () => void;
  onAddToCart: () => void;
  onScrollToReviews: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  content,
  variants,
  bundles,
  selectedVariant,
  onSelectVariant,
  selectedBundle,
  onSelectBundle,
  onBuyNow,
  onAddToCart,
  onScrollToReviews
}) => {
  // Real-time dynamic countdown timer (e.g. 03h 41m 22s)
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  const currentPrice = selectedBundle ? selectedBundle.price : content.salePrice;
  const currentOriginalPrice = selectedBundle ? selectedBundle.originalPrice : content.regularPrice;
  const savings = currentOriginalPrice - currentPrice;

  return (
    <div className="flex flex-col gap-6 text-white">
      {/* Category & Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
          {content.badgeTag}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Stock disponible para despacho hoy</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <h1 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {content.productTitle}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed">
          {content.productSubtitle}
        </p>
      </div>

      {/* Rating & Social Proof banner */}
      <div className="flex items-center justify-between py-2 border-y border-white/10 flex-wrap gap-2">
        <button
          onClick={onScrollToReviews}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="flex text-amber-400 text-sm tracking-tighter">
            ★★★★★
          </div>
          <span className="text-xs font-bold text-zinc-300 group-hover:text-amber-400 transition-colors underline decoration-zinc-600">
            4.8 / 5.0 (148 reseñas verificadas)
          </span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>{content.urgencyViewers} personas viendo ahora</span>
        </div>
      </div>

      {/* Price & Savings Block */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black font-mono text-amber-500">
            {formatPrice(currentPrice)}
          </span>
          <span className="text-base sm:text-lg text-zinc-500 line-through font-mono">
            {formatPrice(currentOriginalPrice)}
          </span>
          <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
            Ahorras {formatPrice(savings)}
          </span>
        </div>

        {/* Countdown urgency bar */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2">
          <span className="flex items-center gap-1 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            La oferta y envío gratis finalizan en:
          </span>
          <div className="flex items-center gap-1 font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
            <span>{String(timeLeft.hours).padStart(2, '0')}h</span> :
            <span>{String(timeLeft.minutes).padStart(2, '0')}m</span> :
            <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Color Variant Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
            Color: <span className="text-white font-semibold normal-case">{selectedVariant.name}</span>
          </label>
          <span className="text-[11px] text-emerald-400 font-mono">
            {selectedVariant.stockCount} en stock
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {variants.map((v) => {
            const isSelected = v.id === selectedVariant.id;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVariant(v)}
                className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-white/10 bg-[#121212] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shadow-inner"
                    style={{ backgroundColor: v.colorHex }}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 font-bold" />}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-white truncate">{v.name.split(' ')[0]}</p>
                  {v.badge && (
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-tighter">
                      {v.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Package / Bundles Offers Selector */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
          Selecciona tu Promoción (Ahorro Automático):
        </label>

        <div className="space-y-2.5">
          {bundles.map((bundle) => {
            const isSelected = bundle.id === selectedBundle.id;
            return (
              <div
                key={bundle.id}
                onClick={() => onSelectBundle(bundle)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                    : 'border-white/10 bg-[#141414] hover:border-white/20'
                }`}
              >
                {bundle.popular && (
                  <span className="absolute -top-2.5 right-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                    {bundle.badge || 'MÁS POPULAR'}
                  </span>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-black'
                          : 'border-zinc-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">{bundle.title}</p>
                      <p className="text-xs text-zinc-400">{bundle.subtitle}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-black font-mono text-amber-400">
                      {formatPrice(bundle.price)}
                    </p>
                    <p className="text-xs text-zinc-500 line-through font-mono">
                      {formatPrice(bundle.originalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onBuyNow}
          id="buy-now-cta-button"
          className="w-full py-4 px-6 bg-white text-black hover:bg-amber-500 hover:text-black transition-all duration-300 font-black uppercase tracking-tight text-lg rounded-xl shadow-xl flex items-center justify-center gap-3 cursor-pointer group glow-amber"
        >
          <Zap className="w-5 h-5 fill-current text-black group-hover:scale-110 transition-transform" />
          <span>COMPRAR AHORA (PAGA AL RECIBIR)</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onAddToCart}
          id="add-to-cart-button"
          className="w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/15 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Agregar al Carrito</span>
        </button>
      </div>

      {/* Payment Methods Badges */}
      <div className="p-4 bg-[#111] rounded-xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Medios de Pago Disponibles:</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <Check className="w-3 h-3" /> Encriptación SSL 256-bit
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            Pago Contra Entrega
          </span>
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Mercado Pago
          </span>
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-bold text-zinc-300">
            Transferencia Bancaria
          </span>
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-bold text-zinc-300">
            Tarjetas de Crédito / Débito
          </span>
        </div>
      </div>

      {/* Guarantee and Shipping Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              {content.guaranteeTitle}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Prueba la máquina 30 días sin ningún riesgo.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
          <Truck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              Envío Asegurado
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Despacho en 24hs con código de seguimiento en vivo.
            </p>
          </div>
        </div>
      </div>

      {/* What's included in the box */}
      <div className="p-5 bg-[#121212] rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-500" />
          ¿Qué incluye tu paquete BB IMPORT?
        </h3>
        <ul className="space-y-2">
          {content.boxIncludes.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-xs text-zinc-300">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
