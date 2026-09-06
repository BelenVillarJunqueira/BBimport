import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { BundleOffer, ProductVariant, StoreContent } from '../types';

interface StickyMobileBarProps {
  content: StoreContent;
  selectedVariant: ProductVariant;
  selectedBundle: BundleOffer;
  onBuyNow: () => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  content,
  selectedVariant,
  selectedBundle,
  onBuyNow
}) => {
  const currentPrice = selectedBundle ? selectedBundle.price : content.salePrice;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-[#0D0D0D]/95 backdrop-blur-lg border-t border-white/10 p-3 shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-lg border border-white/20 shrink-0 shadow-inner"
          style={{ backgroundColor: selectedVariant.colorHex }}
        />
        <div className="leading-tight">
          <p className="text-xs font-bold text-white truncate max-w-[120px]">
            {selectedVariant.name.split(' ')[0]}
          </p>
          <p className="text-sm font-black font-mono text-amber-500">
            {formatPrice(currentPrice)}
          </p>
        </div>
      </div>

      <button
        onClick={onBuyNow}
        id="mobile-sticky-buy-btn"
        className="flex-1 py-3 px-4 bg-white text-black hover:bg-amber-500 hover:text-black font-black uppercase text-xs rounded-xl tracking-tight transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>COMPRAR AHORA</span>
      </button>
    </div>
  );
};
