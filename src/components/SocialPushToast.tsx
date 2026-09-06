import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Check } from 'lucide-react';

interface SocialPushToastProps {
  isDisabled?: boolean;
}

const recentSalesData = [
  { name: 'Roberto G.', city: 'Buenos Aires', time: 'Hace 2 minutos', item: 'Pack Dúo 2x EXXTRA TECH' },
  { name: 'Esteban M.', city: 'Córdoba Capital', time: 'Hace 4 minutos', item: 'Máquina EXXTRA TECH (Negro)' },
  { name: 'Agustín V.', city: 'Rosario', time: 'Hace 7 minutos', item: '1x Máquina + Loción' },
  { name: 'Sebastián L.', city: 'Mendoza', time: 'Hace 11 minutos', item: 'Pack Dúo 2x EXXTRA TECH' },
  { name: 'Federico P.', city: 'Mar del Plata', time: 'Hace 15 minutos', item: 'Máquina EXXTRA TECH (Rojo)' },
  { name: 'Nicolás D.', city: 'La Plata', time: 'Hace 18 minutos', item: 'Máquina EXXTRA TECH (Dorado)' },
  { name: 'Lucas R.', city: 'San Miguel de Tucumán', time: 'Hace 22 minutos', item: 'Pack Dúo 2x EXXTRA TECH' }
];

export const SocialPushToast: React.FC<SocialPushToastProps> = ({ isDisabled = false }) => {
  const [saleIndex, setSaleIndex] = useState(0);
  const [showSale, setShowSale] = useState(false);

  // Discrete live purchase notification: shows for 4.5 seconds, then waits 22 seconds
  useEffect(() => {
    if (isDisabled) {
      setShowSale(false);
      return;
    }

    // Initial appearance after 6 seconds
    const initialTimer = setTimeout(() => {
      setShowSale(true);
      setTimeout(() => setShowSale(false), 4500);
    }, 6000);

    // Periodic repeat every 22 seconds
    const interval = setInterval(() => {
      setSaleIndex((prev) => (prev + 1) % recentSalesData.length);
      setShowSale(true);
      setTimeout(() => setShowSale(false), 4500);
    }, 22000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDisabled]);

  if (isDisabled || !showSale) return null;

  const currentSale = recentSalesData[saleIndex];

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-30 max-w-[290px] sm:max-w-xs select-none pointer-events-auto transition-all duration-300">
      <div 
        className="p-3 bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
        role="status"
        aria-live="polite"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-xs shrink-0 shadow-md">
          {currentSale.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            <span>{currentSale.name} acaba de comprar!</span>
          </p>
          <p className="text-[10px] text-zinc-400 truncate">
            {currentSale.item}
          </p>
          <p className="text-[9px] text-amber-400/90 font-mono flex items-center gap-1 mt-0.5">
            <span>{currentSale.time} en {currentSale.city}</span>
            <span className="text-emerald-400 font-bold">• Verificado</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSale(false)}
          className="text-zinc-500 hover:text-white text-xs p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          title="Ocultar aviso"
          aria-label="Cerrar notificación"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
