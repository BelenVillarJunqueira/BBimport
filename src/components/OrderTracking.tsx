import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  X,
  MessageCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderTrackingProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  prefilledCode?: string;
}

const statusSteps: OrderStatus[] = [
  'Confirmado',
  'En Preparación',
  'En Tránsito',
  'En Reparto',
  'Entregado'
];

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  orders,
  isOpen,
  onClose,
  prefilledCode = ''
}) => {
  const [searchInput, setSearchInput] = useState(prefilledCode || '');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state whenever modal opens or prefilledCode changes
  useEffect(() => {
    if (isOpen) {
      const initialCode = prefilledCode.trim();
      setSearchInput(initialCode);
      if (initialCode) {
        const found = orders.find(
          (o) => o.trackingCode.toLowerCase() === initialCode.toLowerCase() ||
            o.id.toLowerCase() === initialCode.toLowerCase()
        );
        setSearchedOrder(found || null);
        setHasSearched(true);
      } else {
        // If no prefill, auto-show the most recent order if available
        if (orders.length > 0 && !hasSearched) {
          setSearchedOrder(orders[0]);
          setSearchInput(orders[0].trackingCode);
          setHasSearched(true);
        }
      }
    }
  }, [isOpen, prefilledCode, orders]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (!clean) return;

    // Search by trackingCode, id, or phone number
    const found = orders.find(
      (o) =>
        o.trackingCode.toUpperCase() === clean ||
        o.id.toUpperCase() === clean ||
        o.phone.replace(/\D/g, '').includes(clean.replace(/\D/g, ''))
    );

    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIndex = (status: OrderStatus) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-2 sm:p-4 md:p-6 flex flex-col items-center justify-start sm:justify-center"
      onClick={(e) => {
        // Close when clicking directly on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto sm:my-4 flex flex-col max-h-[94vh] sm:max-h-[88vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-modal-title"
      >
        {/* Sticky Mobile & Desktop Header */}
        <div className="sticky top-0 z-30 bg-[#111111]/98 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            id="tracking-back-btn"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
            title="Volver a la tienda"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Volver</span>
          </button>

          {/* Title in center */}
          <div className="flex items-center gap-2 text-center min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="truncate text-left">
              <h3
                id="tracking-modal-title"
                className="text-xs sm:text-base font-black text-white uppercase tracking-tight truncate"
              >
                Rastreo de Pedidos
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate">
                BB IMPORT • Logística Nacional 24-48hs
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            id="tracking-close-btn"
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
            title="Cerrar ventana"
            aria-label="Cerrar ventana de seguimiento"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 overscroll-contain">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block">
              Ingresa tu Código de Rastreo o Teléfono:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ejemplo: BB-784291 o BB-9921-X"
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                id="tracking-search-submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Buscar Pedido</span>
              </button>
            </div>

            {/* Quick Demo links */}
            {orders.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 pt-1">
                <span className="text-zinc-500">Ejemplos cargados:</span>
                {orders.slice(0, 3).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSearchInput(o.trackingCode);
                      setSearchedOrder(o);
                      setHasSearched(true);
                    }}
                    className="font-mono text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    #{o.trackingCode} ({o.status})
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Results view */}
          {hasSearched && searchedOrder && (
            <div className="space-y-6 pt-2">
              {/* Status Summary Banner */}
              <div className="p-4 rounded-xl bg-[#18181B] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-zinc-400">Guía de Envío:</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      #{searchedOrder.trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(searchedOrder.trackingCode)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white cursor-pointer bg-white/5 border border-white/10"
                      title="Copiar código"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white">
                    Destinatario: <span className="font-normal text-zinc-200">{searchedOrder.customerName}</span>
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{searchedOrder.city} • {searchedOrder.address}</span>
                  </p>
                </div>

                <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-black shadow-sm">
                    {searchedOrder.status}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">
                    Operador: <strong className="text-zinc-200">{searchedOrder.carrier}</strong>
                  </p>
                  <p className="text-xs text-zinc-400">
                    Entrega estimada: <strong className="text-amber-400">{searchedOrder.estimatedDelivery}</strong>
                  </p>
                </div>
              </div>

              {/* Real Carrier Official Tracking Bar & WhatsApp Support */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-white/5 via-white/[0.07] to-white/5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
                      Seguimiento Postal Oficial ({searchedOrder.carrier})
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      {searchedOrder.externalTrackingNumber || `${searchedOrder.trackingCode}-AR`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={
                      searchedOrder.externalTrackingUrl ||
                      (searchedOrder.carrier.toLowerCase().includes('correo')
                        ? `https://www.correoargentino.com.ar/formularios/e-commerce?id=${searchedOrder.externalTrackingNumber || searchedOrder.trackingCode}`
                        : `https://www.andreani.com/#!/informacionEnvio/${searchedOrder.externalTrackingNumber || searchedOrder.trackingCode}`)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portal del Correo</span>
                  </a>

                  <a
                    href={`https://wa.me/5491138402911?text=${encodeURIComponent(`Hola BB IMPORT, quiero consultar sobre mi paquete con guía #${searchedOrder.trackingCode} a nombre de ${searchedOrder.customerName}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                    title="Consultar por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Stepper Timeline - Fully responsive on all mobile screens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                    Progreso del Envío:
                  </h4>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    Paso {currentStepIdx + 1} de {statusSteps.length}
                  </span>
                </div>

                {/* Stepper Bar */}
                <div className="relative bg-[#18181B] border border-white/10 rounded-2xl p-4 sm:p-5 overflow-x-auto">
                  <div className="relative flex items-center justify-between min-w-[320px] sm:min-w-0 px-2">
                    {/* Background line */}
                    <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-zinc-800 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                        style={{
                          width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%`
                        }}
                      />
                    </div>

                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCurrent
                                ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 font-black shadow-lg scale-110'
                                : isCompleted
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-zinc-800 text-zinc-500 border border-white/5'
                              }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] text-center font-bold tracking-tight max-w-[65px] leading-tight ${isCurrent
                                ? 'text-amber-400 font-extrabold'
                                : isCompleted
                                  ? 'text-white'
                                  : 'text-zinc-500'
                              }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed Timeline Events */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                  Historial de Movimientos y Eventos:
                </h4>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {searchedOrder.timeline && searchedOrder.timeline.length > 0 ? (
                    searchedOrder.timeline.map((evt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{evt.status}</span>
                          </p>
                          <p className="text-zinc-300 leading-relaxed">{evt.description}</p>
                          <p className="text-[10px] text-zinc-400 flex items-center gap-1 pt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{evt.location}</span>
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400 shrink-0 bg-white/5 px-2 py-1 rounded">
                          {evt.timestamp}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500">No hay eventos registrados aún.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasSearched && !searchedOrder && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm font-bold text-white">
                No encontramos ningún pedido con ese código o teléfono.
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Verifica haber escrito correctamente tu código (ej. #{orders[0]?.trackingCode || 'BB-784291'}). Si acabas de realizar la compra, la guía se sincroniza en los primeros minutos.
              </p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-20 px-4 sm:px-6 py-3.5 bg-[#0D0D0D]/98 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Despachos asegurados en todo el país</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              id="tracking-bottom-return-btn"
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Tienda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
