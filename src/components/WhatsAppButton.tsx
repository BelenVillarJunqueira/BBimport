import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  whatsappNumber?: string;
  storeName?: string;
  productTitle?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  whatsappNumber = '+549 3515 05-6742',
  storeName = 'BB IMPORT',
  productTitle = 'Máquina cortadora EXXTRA TECH'
}) => {
  // Clean phone number for wa.me URL
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `¡Hola ${storeName}! 👋 Quiero consultar sobre la ${productTitle}. ¿Tienen stock para despacho inmediato?`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone || '549 3515 05-6742'}?text=${message}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 pointer-events-auto">
      {/* Main Floating WhatsApp Button - Clean, no popups */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="floating-whatsapp-btn"
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none"
        title="Contactar por WhatsApp a BB IMPORT"
        aria-label="Contactar por WhatsApp"
      >
        {/* Pulsing outer aura ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />
        
        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-[#25D366] drop-shadow-md" />

        {/* Hover Label on Desktop */}
        <span className="absolute right-16 bg-black/90 text-white font-bold text-xs py-1.5 px-3 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:inline-block shadow-lg">
          Hablar con BB IMPORT
        </span>
      </a>
    </div>
  );
};
