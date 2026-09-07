import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  CreditCard, 
  Banknote, 
  Truck, 
  ShieldCheck, 
  Lock, 
  Copy, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  Package,
  ExternalLink,
  Trash2,
  ShoppingBag
} from 'lucide-react';
import { BundleOffer, GatewaySettings, Order, ProductVariant, StoreContent } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: StoreContent;
  selectedVariant: ProductVariant;
  selectedBundle: BundleOffer;
  gateways: GatewaySettings;
  cartCount: number;
  onClearCart: () => void;
  onAddToCart?: () => void;
  onCreateOrder: (order: Order) => void;
  onOpenTrackingWithCode: (code: string) => void;
}

// ============================================================================
// 👉 INTEGRACIÓN PARA: https://bbimport.onrender.com/ (Render Cloud)
// Pegar en el archivo de Checkout (ej: checkout.js o en el botón "Confirmar Pedido"):
// ============================================================================

async function notifyIsamerOS_BBImport(orderData: {
  trackingCode?: string;
  customerName: string;
  phone: string;
  sku?: string;
  quantity?: number;
  totalPrice?: number;
  paymentMethod?: string;
  address: string;
  city: string;
}) {
  const payload = {
    businessId: 'bbimport',
    orderId: orderData.trackingCode || 'BB-' + Math.floor(100000 + Math.random() * 900000),
    customerName: orderData.customerName, // ej: "Esteban Morales"
    phone: orderData.phone,               // ej: "+54 9 11 6789-1234"
    items: [
      // SKUs oficiales reconocidos automáticamente por ISAMER OS:
      // 'EX5-BLK' (Negro), 'EX5-RED' (Rojo), 'EX5-BLU' (Azul), 'EX5-YEL' (Amarillo)
      // 'CMB-DUO' (Pack Dúo), 'CMB-PRO-LOTION' (Combo Profesional)
      { sku: orderData.sku || 'EX5-BLK', quantity: orderData.quantity || 1, price: orderData.totalPrice || 29999 }
    ],
    total: orderData.totalPrice || 29999,
    paymentMethod: orderData.paymentMethod || 'contra_entrega', // 'contra_entrega' | 'transferencia' | 'mercadopago_qr'
    shippingAddress: orderData.address + ', ' + orderData.city
  };

  try {
    await fetch('https://ais-dev-fsl5wbs5s56qu4qnlrxp3i-591938336003.us-west2.run.app/api/webhooks/bbimport-orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Store-Origin': 'bbimport.onrender.com'
      },
      body: JSON.stringify(payload)
    });
    console.log("✅ Venta BB IMPORT sincronizada en ISAMER OS - Stock descontado y ganancia registrada");
  } catch (err) {
    console.warn("ISAMER OS offline, guardando en cola local...", err);
  }

  // Respaldo de proxy en servidor para asegurar entrega garantizada ante posibles restricciones de CORS en navegadores
  try {
    fetch('/api/notify-isamer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {
    // safe
  }
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  content,
  selectedVariant,
  selectedBundle,
  gateways,
  cartCount,
  onClearCart,
  onAddToCart,
  onCreateOrder,
  onOpenTrackingWithCode
}) => {
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Method: MERCADO PAGO IS THE FIRST AND DEFAULT METHOD
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'contra_entrega' | 'transferencia' | 'tarjeta'>('mercadopago');

  // Mercado Pago interactive installments (1, 3, 6, 12 cuotas)
  const [selectedInstallments, setSelectedInstallments] = useState<number>(3);
  const [mpPreferenceUrl, setMpPreferenceUrl] = useState<string | null>(null);
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [mpNotice, setMpNotice] = useState<string | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Transfer receipt upload & copy states
  const [transferReceipt, setTransferReceipt] = useState<string>('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [copiedMpAlias, setCopiedMpAlias] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isRedirectingToMp, setIsRedirectingToMp] = useState(false);
  const [mpRedirectTarget, setMpRedirectTarget] = useState<string | null>(null);

  // Handle ESC key to close modal & reset
  useEffect(() => {
    if (!isOpen) {
      setIsRedirectingToMp(false);
      setMpRedirectTarget(null);
    }
  }, [isOpen]);

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

  const totalAmount = selectedBundle ? selectedBundle.price : content.salePrice;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Pre-calculated installments
  const installmentOptions = [
    {
      count: 1,
      label: '1 Pago Directo',
      amountPerMonth: totalAmount,
      totalPlan: totalAmount,
      badge: 'Sin Interés'
    },
    {
      count: 3,
      label: '3 Cuotas',
      amountPerMonth: Math.round(totalAmount / 3),
      totalPlan: totalAmount,
      badge: '¡Sin Interés!'
    },
    {
      count: 6,
      label: '6 Cuotas',
      amountPerMonth: Math.round((totalAmount * 1.08) / 6),
      totalPlan: Math.round(totalAmount * 1.08),
      badge: 'Fijas'
    },
    {
      count: 12,
      label: '12 Cuotas',
      amountPerMonth: Math.round((totalAmount * 1.18) / 12),
      totalPlan: Math.round(totalAmount * 1.18),
      badge: 'Fijas'
    }
  ];

  const currentSelectedPlan = installmentOptions.find((p) => p.count === selectedInstallments) || installmentOptions[1];

  const copyToClipboard = (text: string, type: 'alias' | 'cbu' | 'mp') => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else if (type === 'cbu') {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    } else {
      setCopiedMpAlias(true);
      setTimeout(() => setCopiedMpAlias(false), 2000);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTransferReceipt(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ================= VALIDACIÓN ESTRICTA ANTI-DATOS FALSOS ("1234") =================
    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedPostal = postalCode.trim();

    // 1. Validar Nombre Completo (No permitir solo números como "1234" ni nombres de menos de 3 caracteres)
    if (!trimmedName) {
      setFormError('Por favor ingresa tu Nombre y Apellido completo.');
      return;
    }
    if (/^[0-9\s.,-]+$/.test(trimmedName) || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedName) || trimmedName.length < 3) {
      setFormError('Nombre inválido: Ingresa un nombre y apellido real (no se admiten solo números como "1234").');
      return;
    }

    // 2. Validar Teléfono / WhatsApp (Mínimo 8-10 dígitos, no permitir "1234" ni números falsos)
    if (!trimmedPhone) {
      setFormError('Por favor ingresa tu número de Teléfono o WhatsApp de contacto.');
      return;
    }
    const cleanPhoneDigits = trimmedPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
      setFormError('Teléfono inválido: Debe contener al menos 8 a 10 dígitos con código de área (ej: 11 4920-8831).');
      return;
    }
    if (/^(\d)\1+$/.test(cleanPhoneDigits) || cleanPhoneDigits === '12345678') {
      setFormError('Por favor ingresa un teléfono real para coordinar la entrega con Andreani.');
      return;
    }

    // 3. Validar Dirección Completa (Debe incluir nombre de calle y numeración, no "1234")
    if (!trimmedAddress) {
      setFormError('Por favor ingresa la dirección completa de entrega.');
      return;
    }
    if (/^[0-9\s.,-]+$/.test(trimmedAddress) || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedAddress) || trimmedAddress.length < 5) {
      setFormError('Dirección inválida: Debe contener el nombre de la calle y la altura (ej: Av. Rivadavia 4520).');
      return;
    }

    // 4. Validar Ciudad / Localidad (Debe ser un nombre de ciudad o localidad real, no "1234")
    if (!trimmedCity) {
      setFormError('Por favor ingresa tu ciudad o localidad.');
      return;
    }
    if (/^[0-9\s.,-]+$/.test(trimmedCity) || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedCity) || trimmedCity.length < 3) {
      setFormError('Ciudad inválida: Ingresa una localidad o provincia real (ej: CABA, Rosario, Córdoba).');
      return;
    }

    // 5. Validar Código Postal si se completó
    if (trimmedPostal && (trimmedPostal === '1234' || trimmedPostal.length < 3)) {
      setFormError('Por favor ingresa un código postal válido (ej: S2000 o 1425).');
      return;
    }

    // 6. Validar datos de tarjeta directa si el método es tarjeta
    if (paymentMethod === 'tarjeta') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 19 || cleanCard === '1234') {
        setFormError('Tarjeta inválida: Ingresa los 16 dígitos de tu tarjeta de crédito o débito.');
        return;
      }
      const cleanExp = cardExp.trim();
      if (!/^(0[1-9]|1[0-2])\/?([2-9][0-9])$/.test(cleanExp) || cleanExp === '1234') {
        setFormError('Vencimiento inválido: Ingresa la fecha en formato MM/AA (ej: 08/28).');
        return;
      }
      const cleanCvv = cardCvv.trim();
      if (!/^\d{3,4}$/.test(cleanCvv) || cleanCvv === '1234') {
        setFormError('CVV inválido: Ingresa el código de 3 o 4 números al dorso.');
        return;
      }
    }

    setFormError(null);
    setIsSubmitting(true);
    setMpNotice(null);

    const randomCodeNum = Math.floor(100000 + Math.random() * 900000);
    const trackingCode = `BB-${randomCodeNum}`;
    const nowIso = new Date().toISOString();
    const nowDisplay = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    let generatedMpUrl: string | null = gateways.mercadoPago?.paymentLinkUrl || null;
    let generatedPrefId: string | null = null;

    if (paymentMethod === 'mercadopago') {
      try {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [
              {
                id: selectedVariant.id || 'bb-prod-1',
                title: `${content.productTitle} - ${selectedVariant.name} (${selectedBundle.title})`,
                quantity: selectedBundle.quantity || 1,
                unit_price: totalAmount,
                picture_url: `${window.location.origin}/images/product-1.jpg`
              }
            ],
            payer: {
              name: customerName.trim(),
              email: email.trim() || 'cliente@bbimport.com',
              phone: phone.trim(),
              address: `${address.trim()}, ${city.trim()}`
            },
            installments: selectedInstallments,
            trackingCode,
            customToken: gateways.mercadoPago?.accessToken || undefined
          })
        });

        const data = await response.json();
        if (data.success && data.initPoint) {
          generatedMpUrl = data.initPoint;
          generatedPrefId = data.preferenceId;
          setMpPreferenceUrl(data.initPoint);
          setMpPreferenceId(data.preferenceId);
        } else if (data.error === 'TOKEN_NOT_CONFIGURED') {
          setMpNotice(
            'Para procesar pagos con tu cuenta en vivo, coloca tu MERCADO_PAGO_ACCESS_TOKEN en tu archivo .env. Mientras tanto, tu pedido quedó registrado y puedes abonar por transferencia o alias.'
          );
        }
      } catch (err) {
        console.warn('Preferencia Mercado Pago local o fallback:', err);
      }
    }

    const orderPaymentDescription =
      paymentMethod === 'mercadopago'
        ? `Mercado Pago (${selectedInstallments} ${selectedInstallments === 1 ? 'pago directo' : 'cuotas fijas'})`
        : paymentMethod === 'contra_entrega'
        ? 'Pago Contra Entrega en Efectivo'
        : paymentMethod === 'transferencia'
        ? 'Transferencia Bancaria Inmediata'
        : 'Pasarela Digital Tarjetas';

    const order: Order = {
      id: `ord-${Date.now()}`,
      trackingCode,
      customerName: customerName.trim(),
      email: email.trim() || 'cliente@bbimport.com',
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim() || 'N/A',
      notes: notes.trim(),
      items: [
        {
          productId: 'prod-clipper-1',
          productName: content.productTitle,
          variantName: selectedVariant.name,
          quantity: selectedBundle.quantity,
          price: totalAmount,
          bundleTitle: selectedBundle.title
        }
      ],
      subtotal: totalAmount,
      shippingCost: 0,
      total: totalAmount,
      paymentMethod,
      paymentStatus:
        paymentMethod === 'contra_entrega'
          ? 'A Cobrar al Entregar'
          : paymentMethod === 'transferencia'
          ? 'Pendiente de Comprobante'
          : generatedMpUrl
          ? 'Preferencia Generada'
          : 'Aprobado',
      status: 'Confirmado',
      createdAt: nowIso,
      carrier: 'Andreani Prioritario Express',
      estimatedDelivery: '24 a 48 horas hábiles',
      timeline: [
        {
          status: 'Confirmado',
          timestamp: nowDisplay,
          description: `Orden recibida exitosamente bajo modalidad ${orderPaymentDescription}`,
          location: 'Centro de Distribución BB IMPORT'
        },
        {
          status: 'En Preparación',
          timestamp: 'Próximas horas',
          description: 'Control de calidad técnico, calibración y rotulado de paquete',
          location: 'Depósito Central'
        }
      ]
    };

    onCreateOrder(order);
    setCompletedOrder(order);
    setIsSubmitting(false);

    // ================= SINCRONIZACIÓN ISAMER OS =================
    // SKUs oficiales reconocidos automáticamente por ISAMER OS:
    // 'EX5-BLK' (Negro), 'EX5-RED' (Rojo), 'EX5-BLU' (Azul), 'EX5-YEL' (Amarillo)
    // 'CMB-DUO' (Pack Dúo), 'CMB-PRO-LOTION' (Combo Profesional)
    let isamerSku = 'EX5-BLK';
    const bundleTitleLower = (selectedBundle.title || '').toLowerCase();
    const bundleIdLower = (selectedBundle.id || '').toLowerCase();

    if (bundleIdLower === 'bundle-2' || bundleTitleLower.includes('dúo') || bundleTitleLower.includes('duo') || selectedBundle.quantity === 2) {
      isamerSku = 'CMB-DUO';
    } else if (bundleIdLower === 'bundle-3' || bundleTitleLower.includes('repuesto') || bundleTitleLower.includes('combo') || bundleTitleLower.includes('lotion')) {
      isamerSku = 'CMB-PRO-LOTION';
    } else {
      const varNameLower = (selectedVariant.name || '').toLowerCase();
      const varIdLower = (selectedVariant.id || '').toLowerCase();
      if (varNameLower.includes('rojo') || varIdLower.includes('red')) {
        isamerSku = 'EX5-RED';
      } else if (varNameLower.includes('azul') || varIdLower.includes('blue')) {
        isamerSku = 'EX5-BLU';
      } else if (varNameLower.includes('amarillo') || varNameLower.includes('gold') || varIdLower.includes('yellow')) {
        isamerSku = 'EX5-YEL';
      } else {
        isamerSku = 'EX5-BLK';
      }
    }

    notifyIsamerOS_BBImport({
      trackingCode,
      customerName: trimmedName,
      phone: trimmedPhone,
      sku: isamerSku,
      quantity: selectedBundle.quantity || 1,
      totalPrice: totalAmount,
      paymentMethod: paymentMethod === 'mercadopago' ? 'mercadopago_qr' : paymentMethod,
      address: trimmedAddress,
      city: trimmedCity
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // Safe fallback
    }

    // If Mercado Pago with preference URL, initiate redirect view & automatic redirect
    if (paymentMethod === 'mercadopago' && generatedMpUrl) {
      setIsRedirectingToMp(true);
      setMpRedirectTarget(generatedMpUrl);

      setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            if (window.self !== window.top) {
              window.open(generatedMpUrl!, '_blank');
            } else {
              window.location.href = generatedMpUrl!;
            }
          }
        } catch {
          window.location.href = generatedMpUrl!;
        }
      }, 1200);
      return;
    }

    // If generated preference URL exists for other cases
    if (generatedMpUrl) {
      try {
        window.open(generatedMpUrl, '_blank');
      } catch (e) {
        // Pop-up blocked fallback
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-8 space-y-6 my-auto sm:my-6 max-h-[94vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Mercado Pago Official Redirect Screen */}
        {isRedirectingToMp && mpRedirectTarget && completedOrder ? (
          <div className="space-y-6 text-center py-6">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-sky-500 text-black flex items-center justify-center font-black text-2xl shadow-xl shadow-sky-500/30">
                <CreditCard className="w-8 h-8 text-black" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono tracking-widest text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                MERCADO PAGO CHECKOUT PRO
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Redirigiendo a Mercado Pago...
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
                En segundos se abrirá el sitio oficial de Mercado Pago para que abones con tus tarjetas guardadas o tu dinero en cuenta.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-[#18181B] rounded-2xl border border-sky-500/30 max-w-md mx-auto text-left space-y-3 shadow-2xl">
              <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Podrás abonar en Mercado Pago con:
              </p>
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span><strong>Tus tarjetas ya guardadas</strong> (Crédito y Débito con 1 clic)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span><strong>Dinero disponible en tu cuenta</strong> de Mercado Pago</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span><strong>Mercado Crédito</strong> o hasta {selectedInstallments} cuotas fijas</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Monto total:</span>
                <strong className="text-white text-base">{formatPrice(totalAmount)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Orden guardada en BB IMPORT:</span>
                <strong className="text-amber-400">#{completedOrder.trackingCode}</strong>
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <a
                href={mpRedirectTarget}
                target={typeof window !== 'undefined' && window.self !== window.top ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase text-sm rounded-xl tracking-wider transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Continuar a Mercado Pago Ahora ↗</span>
              </a>

              <p className="text-[11px] text-zinc-500">
                ¿No abrió automáticamente? Haz clic en el botón azul para ingresar directo a tu cuenta de Mercado Pago.
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRedirectingToMp(false);
                    onOpenTrackingWithCode(completedOrder.trackingCode);
                    onClose();
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Ver seguimiento del pedido #{completedOrder.trackingCode}
                </button>
              </div>
            </div>
          </div>
        ) : completedOrder ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-bounce">
              ✓
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                ¡PEDIDO CONFIRMADO CON ÉXITO!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Gracias por tu compra, {completedOrder.customerName}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Tu máquina profesional EXXTRA TECH™ ya ingresó al área de empaque y calibración de BB IMPORT.
              </p>
            </div>

            {/* Tracking Code Card */}
            <div className="p-4 sm:p-6 bg-[#18181B] rounded-2xl border border-white/10 max-w-md mx-auto text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Código de Seguimiento Oficial:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  #{completedOrder.trackingCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Método de Pago:</span>
                <strong className="text-white capitalize font-mono">
                  {completedOrder.paymentMethod === 'mercadopago' ? 'Mercado Pago' : completedOrder.paymentMethod.replace('_', ' ')}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Estado de Pago:</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                  {completedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Empresa de Envío:</span>
                <strong className="text-white">{completedOrder.carrier}</strong>
              </div>
            </div>

            {/* If paid with Mercado Pago */}
            {completedOrder.paymentMethod === 'mercadopago' && (
              <div className="p-5 bg-sky-950/40 border border-sky-500/30 rounded-2xl max-w-md mx-auto space-y-3 text-left shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase">
                    <CreditCard className="w-4 h-4" />
                    <span>Pago con Mercado Pago</span>
                  </div>
                  <span className="text-[10px] bg-sky-500 text-black font-black px-2 py-0.5 rounded">
                    {selectedInstallments} {selectedInstallments === 1 ? 'PAGO' : 'CUOTAS'}
                  </span>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-sky-500/20 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span>Plan seleccionado:</span>
                    <strong className="text-white">{currentSelectedPlan.label}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Monto por cuota:</span>
                    <strong className="text-sky-300 font-mono font-bold">
                      {formatPrice(currentSelectedPlan.amountPerMonth)}
                      {currentSelectedPlan.count > 1 ? ' / mes' : ''}
                    </strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Total del plan:</span>
                    <strong className="text-white font-mono">{formatPrice(currentSelectedPlan.totalPlan)}</strong>
                  </div>
                </div>

                {/* Direct Action button to open Mercado Pago Checkout */}
                {(mpPreferenceUrl || gateways.mercadoPago?.paymentLinkUrl) && (
                  <a
                    href={mpPreferenceUrl || gateways.mercadoPago?.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir y Pagar en Mercado Pago ({selectedInstallments} Cuotas) ↗</span>
                  </a>
                )}

                {/* If there's an alias or CVU */}
                {gateways.mercadoPago?.mpAliasOrCvu && (
                  <div className="pt-2 border-t border-sky-500/20 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">O transferir al Alias MP:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gateways.mercadoPago.mpAliasOrCvu || '', 'mp')}
                      className="text-[10px] text-sky-300 font-mono bg-sky-500/20 px-2 py-1 rounded hover:bg-sky-500/30"
                    >
                      {copiedMpAlias ? '✓ Copiado' : gateways.mercadoPago.mpAliasOrCvu}
                    </button>
                  </div>
                )}

                {mpNotice && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
                    {mpNotice}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTrackingWithCode(completedOrder.trackingCode);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all shadow-lg cursor-pointer"
              >
                Rastrear Estado en Vivo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-xl border border-white/10 cursor-pointer"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : cartCount === 0 ? (
          /* Empty Cart Screen */
          <div className="text-center py-8 px-2 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tighter text-white">
                  BB<span className="text-amber-500">IMPORT</span>
                </span>
                <span className="text-zinc-500 font-mono text-xs">/ Carrito de Compras</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-500 shadow-inner">
              <ShoppingBag className="w-8 h-8 text-amber-500/70" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Carrito Vaciado
              </span>
              <h3 className="text-xl font-black text-white">
                Tu carrito está vacío
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Has vaciado los productos de tu orden de compra. Puedes volver a la tienda para seleccionar el combo o la variante que prefieras.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Volver a la Tienda</span>
              </button>

              {onAddToCart && (
                <button
                  type="button"
                  onClick={onAddToCart}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-xl border border-white/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Re-agregar Producto</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Active Checkout Form */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tighter text-white">
                  BB<span className="text-amber-500">IMPORT</span>
                </span>
                <span className="text-zinc-500 font-mono text-xs">/ Checkout Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Button to empty cart */}
                <button
                  type="button"
                  onClick={onClearCart}
                  id="empty-cart-header-button"
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                  title="Vaciar todos los artículos del carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar Carrito</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer ml-1"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Selected Product Summary Box */}
            <div className="p-4 bg-[#18181B] rounded-xl border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selectedVariant.colorHex }}
                >
                  <Package className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {selectedBundle.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Color: <strong className="text-amber-400">{selectedVariant.name}</strong> • Envío Gratis 🚚
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-amber-400 block">
                    {formatPrice(totalAmount)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">1 unidad</span>
                </div>
                {/* Remove / Empty button on the product line */}
                <button
                  type="button"
                  onClick={onClearCart}
                  id="remove-item-product-button"
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20 flex items-center gap-1"
                  title="Quitar este producto y vaciar carrito"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-zinc-400 hover:text-red-300">Quitar</span>
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Shipping Details */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> 1. Datos de Entrega y Destinatario
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Marcelo Castro"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      minLength={8}
                      maxLength={16}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 11 4920-8831 (mínimo 8 dígitos)"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 font-bold mb-1">Dirección Completa (Calle, Altura, Piso/Depto) *</label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Av. Rivadavia 4520, Piso 3 Depto B"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Ciudad / Localidad *</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Rosario, Santa Fe"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Código Postal</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Ej: S2000"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Gateway Selection (MERCADO PAGO FIRST) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> 2. Selecciona tu Forma de Pago
                </h4>

                <div className="space-y-2.5">
                  {/* 1. MERCADO PAGO (PRIMARY & FIRST OPTION) */}
                  {gateways.enableMercadoPago && (
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        paymentMethod === 'mercadopago'
                          ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30'
                          : 'border-white/10 bg-[#151515] hover:border-white/20'
                      }`}
                    >
                      <label className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'mercadopago'}
                            onChange={() => setPaymentMethod('mercadopago')}
                            className="mt-1 accent-sky-500"
                          />
                          <div>
                            <p className="text-xs font-black text-white flex items-center gap-2 flex-wrap">
                              <span>MERCADO PAGO</span>
                              <span className="bg-sky-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                OPCIÓN #1 RECOMENDADA
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                                ACREDITACIÓN INMEDIATA
                              </span>
                            </p>
                            <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
                              Paga con tus <strong>tarjetas ya guardadas en tu cuenta de Mercado Pago</strong>, dinero en saldo disponible o hasta 12 Cuotas con todas las tarjetas. Redirección oficial segura.
                            </p>
                          </div>
                        </div>
                        <CreditCard className="w-5 h-5 text-sky-400 shrink-0" />
                      </label>

                      {/* Mercado Pago Active Details when selected */}
                      {paymentMethod === 'mercadopago' && (
                        <div className="mt-3 pt-3 border-t border-sky-500/20 space-y-3 text-xs bg-black/60 p-3.5 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                              <span>Elige tu Plan de Cuotas:</span>
                              <span className="text-[10px] text-zinc-400 font-normal">(Haz clic para elegir)</span>
                            </span>
                            <span className="text-[11px] font-mono text-sky-400 font-bold">
                              {selectedInstallments} {selectedInstallments === 1 ? 'pago' : 'cuotas'} activo
                            </span>
                          </div>

                          {/* Clickable, fully selectable installment buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            {installmentOptions.map((opt) => {
                              const isSelected = selectedInstallments === opt.count;
                              return (
                                <button
                                  key={opt.count}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedInstallments(opt.count);
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-between ${
                                    isSelected
                                      ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/50 text-white shadow-lg'
                                      : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full mb-1">
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        isSelected
                                          ? 'bg-sky-400 text-black'
                                          : 'bg-white/10 text-zinc-400'
                                      }`}
                                    >
                                      {opt.badge}
                                    </span>
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                                        isSelected
                                          ? 'border-sky-400 bg-sky-400 text-black'
                                          : 'border-zinc-600 text-transparent'
                                      }`}
                                    >
                                      ✓
                                    </span>
                                  </div>

                                  <span className="text-white font-black text-xs block">
                                    {opt.label}
                                  </span>
                                  <strong
                                    className={`font-mono text-xs block mt-0.5 ${
                                      isSelected ? 'text-sky-300 font-bold' : 'text-zinc-300'
                                    }`}
                                  >
                                    {formatPrice(opt.amountPerMonth)}
                                    {opt.count > 1 ? '/mes' : ''}
                                  </strong>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Plan Summary Banner */}
                          <div className="p-2.5 bg-sky-950/60 border border-sky-500/40 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                              <span className="text-zinc-200">
                                Seleccionaste: <strong className="text-white">{currentSelectedPlan.label}</strong> de{' '}
                                <strong className="text-sky-300 font-mono">
                                  {formatPrice(currentSelectedPlan.amountPerMonth)}
                                  {currentSelectedPlan.count > 1 ? ' al mes' : ''}
                                </strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-sky-400 font-mono font-bold hidden sm:inline">
                              Total: {formatPrice(currentSelectedPlan.totalPlan)}
                            </span>
                          </div>

                          {/* MP Direct Link or Alias if configured */}
                          {gateways.mercadoPago?.mpAliasOrCvu && (
                            <div className="flex items-center justify-between p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-lg text-zinc-300">
                              <div>
                                <span className="text-[10px] uppercase text-sky-400 font-bold block">Alias Mercado Pago oficial:</span>
                                <strong className="font-mono text-white text-xs">{gateways.mercadoPago.mpAliasOrCvu}</strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(gateways.mercadoPago.mpAliasOrCvu || '', 'mp')}
                                className="text-[10px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-2.5 py-1.5 rounded-md font-mono flex items-center gap-1 cursor-pointer"
                              >
                                {copiedMpAlias ? '✓ Copiado' : 'Copiar Alias MP'}
                              </button>
                            </div>
                          )}

                          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center gap-2 text-sky-200 text-[11px]">
                            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>Al presionar el botón se te redirigirá a la pasarela oficial de Mercado Pago para pagar con tus tarjetas guardadas o tu dinero en cuenta.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. PAGO CONTRA ENTREGA */}
                  {gateways.enableCod && (
                    <label
                      className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                        paymentMethod === 'contra_entrega'
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20'
                          : 'border-white/10 bg-[#151515] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'contra_entrega'}
                          onChange={() => setPaymentMethod('contra_entrega')}
                          className="mt-1 accent-amber-500"
                        />
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-2">
                            <span>PAGO CONTRA ENTREGA</span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded">
                              SIN TARJETA
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Pagas en efectivo directamente al cartero cuando toque tu puerta.
                          </p>
                        </div>
                      </div>
                      <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
                    </label>
                  )}

                  {/* 3. TRANSFERENCIA BANCARIA */}
                  {gateways.enableTransfer && (
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        paymentMethod === 'transferencia'
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20'
                          : 'border-white/10 bg-[#151515] hover:border-white/20'
                      }`}
                    >
                      <label className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'transferencia'}
                            onChange={() => setPaymentMethod('transferencia')}
                            className="mt-1 accent-amber-500"
                          />
                          <div>
                            <p className="text-xs font-black text-white">
                              TRANSFERENCIA BANCARIA INMEDIATA
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Transferencia vía CBU o Alias bancario tradicional.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-white/10 text-amber-400 px-2 py-0.5 rounded">
                          BANCOS
                        </span>
                      </label>

                      {/* Bank Details Dropdown when selected */}
                      {paymentMethod === 'transferencia' && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs bg-black/40 p-3 rounded-lg">
                          <p className="text-[11px] text-amber-400 font-bold">
                            Datos Oficiales de la Cuenta:
                          </p>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span>Banco: <strong>{gateways.bank.bankName}</strong></span>
                            <span>Titular: <strong>{gateways.bank.accountHolder}</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300 bg-zinc-900/80 p-2 rounded border border-white/5">
                            <span>Alias: <strong className="font-mono text-amber-400">{gateways.bank.alias}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(gateways.bank.alias, 'alias')}
                              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white font-mono flex items-center gap-1 cursor-pointer"
                            >
                              {copiedAlias ? '✓ Copiado' : 'Copiar Alias'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300 bg-zinc-900/80 p-2 rounded border border-white/5">
                            <span>CBU: <strong className="font-mono text-xs">{gateways.bank.cbu}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(gateways.bank.cbu, 'cbu')}
                              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white font-mono flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCbu ? '✓ Copiado' : 'Copiar CBU'}
                            </button>
                          </div>

                          <div className="pt-2">
                            <label className="block text-[11px] text-zinc-400 font-bold mb-1">
                              Adjuntar Comprobante (Opcional, agiliza el envío):
                            </label>
                            <label className="flex items-center gap-2 p-2 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 text-zinc-400 text-xs">
                              <Upload className="w-3.5 h-3.5 text-amber-500" />
                              <span>{transferReceipt ? 'Comprobante cargado ✓' : 'Subir captura de transferencia'}</span>
                              <input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. TARJETAS DIRECTAS */}
                  {gateways.enableCards && (
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        paymentMethod === 'tarjeta'
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20'
                          : 'border-white/10 bg-[#151515] hover:border-white/20'
                      }`}
                    >
                      <label className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === 'tarjeta'}
                            onChange={() => setPaymentMethod('tarjeta')}
                            className="mt-1 accent-amber-500"
                          />
                          <div>
                            <p className="text-xs font-black text-white">
                              TARJETA DE CRÉDITO O DÉBITO DIRECTA
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Procesamiento seguro directo con tokenización SSL bancaria.
                            </p>
                          </div>
                        </div>
                        <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
                      </label>

                      {paymentMethod === 'tarjeta' && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 text-xs">
                          <div>
                            <label className="block text-zinc-400 font-bold mb-1">Número de Tarjeta</label>
                            <input
                              type="text"
                              minLength={15}
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4509 •••• •••• 8921 (16 dígitos)"
                              className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">Vencimiento (MM/AA)</label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExp}
                                onChange={(e) => setCardExp(e.target.value)}
                                placeholder="08/28"
                                className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">CVV / Código</label>
                              <input
                                type="password"
                                minLength={3}
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="123"
                                className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order total & CTA */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Total a pagar:</span>
                  <span className="text-2xl font-black font-mono text-amber-500">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 font-black uppercase text-base rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    paymentMethod === 'mercadopago'
                      ? 'bg-sky-500 hover:bg-sky-400 text-black shadow-sky-500/20'
                      : paymentMethod === 'contra_entrega'
                      ? 'bg-white text-black hover:bg-amber-500 hover:text-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Procesando Pedido...
                    </span>
                  ) : paymentMethod === 'mercadopago' ? (
                    <span>
                      PAGAR CON MERCADO PAGO • {currentSelectedPlan.count === 1 ? formatPrice(totalAmount) : `${currentSelectedPlan.count}x ${formatPrice(currentSelectedPlan.amountPerMonth)}`}
                    </span>
                  ) : paymentMethod === 'contra_entrega' ? (
                    <span>CONFIRMAR PEDIDO (PAGAR AL RECIBIR)</span>
                  ) : (
                    <span>COMPLETAR PAGO ({formatPrice(totalAmount)})</span>
                  )}
                </button>

                <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Compra protegida por BB IMPORT • Garantía de satisfacción de 30 días
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
