import React, { useState, useEffect } from 'react';
import { 
  BundleOffer, 
  GatewaySettings, 
  MediaItem, 
  Order, 
  OrderStatus, 
  ProductVariant, 
  PushNotification, 
  Review, 
  StoreContent 
} from './types';
import { 
  initialBundles, 
  initialFaqs, 
  initialGateways, 
  initialMedia, 
  initialOrders, 
  initialReviews, 
  initialStoreContent, 
  initialVariants 
} from './initialData';
import { Navbar } from './components/Navbar';
import { ProductGallery } from './components/ProductGallery';
import { ProductDetails } from './components/ProductDetails';
import { ProductFeatures } from './components/ProductFeatures';
import { ReviewsSection } from './components/ReviewsSection';
import { FaqSection } from './components/FaqSection';
import { OrderTracking } from './components/OrderTracking';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { SocialPushToast } from './components/SocialPushToast';
import { StickyMobileBar } from './components/StickyMobileBar';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Footer } from './components/Footer';
import { 
  loadMediaFromServer, 
  syncMediaWithServer, 
  loadReviewsFromServer, 
  syncReviewsWithServer 
} from './utils/mediaUtils';

// Fail-safe storage helpers to prevent any QuotaExceededError or JSON parse errors
function safeGet<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.warn(`Could not read ${key} from storage, using fallback:`, e);
    return fallback;
  }
}

function safeSet(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage quota exceeded or write failed for ${key}:`, e);
  }
}

/**
 * Intelligent loader:
 * - If the developer or user changes the data in the code (initialData.ts),
 *   it detects the fingerprint change and IMMEDIATELY uses the updated code data
 *   without forcing the user to go to the Admin and click "Restablecer tienda".
 * - If the code hasn't changed, it uses any customized data saved in localStorage (from Admin edits).
 */
function loadInitialOrCodeUpdated<T>(key: string, codeValue: T, customValidator?: (data: any) => boolean): T {
  try {
    const codeFingerprint = JSON.stringify(codeValue);
    const savedFingerprint = localStorage.getItem(`${key}_code_fp`);
    const stored = localStorage.getItem(key);

    // If code was edited, update immediately in the moment!
    if (savedFingerprint !== codeFingerprint) {
      localStorage.setItem(`${key}_code_fp`, codeFingerprint);
      localStorage.setItem(key, JSON.stringify(codeValue));
      return codeValue;
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed !== null && parsed !== undefined) {
        if (!customValidator || customValidator(parsed)) {
          return parsed as T;
        }
      }
    }
  } catch (e) {
    console.warn(`Error synchronizing ${key} with storage:`, e);
  }
  return codeValue;
}

export default function App() {
  // Persistence states - Auto-sync with code changes in real time
  const [content, setContent] = useState<StoreContent>(() => {
    return loadInitialOrCodeUpdated<StoreContent>('bbimport_content', initialStoreContent);
  });

  const [media, setMedia] = useState<MediaItem[]>(() => {
    return loadInitialOrCodeUpdated<MediaItem[]>('bbimport_media', initialMedia, (m) => {
      if (!Array.isArray(m) || m.length === 0) return false;
      return m.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          item.url &&
          !item.url.includes('mixkit.co') &&
          !item.url.startsWith('data:video/') &&
          !item.url.includes('xbqz5') &&
          !item.url.includes('images.unsplash.com') &&
          !item.url.includes('/images/product-')
      );
    });
  });

  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    return loadInitialOrCodeUpdated<ProductVariant[]>('bbimport_variants', initialVariants);
  });

  const [bundles, setBundles] = useState<BundleOffer[]>(() => {
    return loadInitialOrCodeUpdated<BundleOffer[]>('bbimport_bundles', initialBundles);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return safeGet<Order[]>('bbimport_orders', initialOrders);
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    return loadInitialOrCodeUpdated<Review[]>('bbimport_reviews', initialReviews, (r) => Array.isArray(r) && r.length > 0);
  });

  const [gateways, setGateways] = useState<GatewaySettings>(() => {
    return loadInitialOrCodeUpdated<GatewaySettings>('bbimport_gateways', initialGateways);
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    return safeGet<PushNotification[]>('bbimport_notifications', [
      {
        id: 'push-welcome',
        title: '🚚 Envío Gratis en todo el país',
        body: 'Aprovecha el 40% OFF en la línea EXXTRA TECH™ de BB IMPORT. Pagas en mano al recibir.',
        timestamp: 'Ahora',
        read: false
      }
    ]);
  });

  // Active selections
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0] || initialVariants[0]);
  const [selectedBundle, setSelectedBundle] = useState<BundleOffer>(bundles[1] || bundles[0] || initialBundles[0]);
  const [cartCount, setCartCount] = useState<number>(0);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingPrefill, setTrackingPrefill] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check URL param ?admin=true on mount or keyboard shortcut Ctrl+Shift+A
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }

    // Detect return from Mercado Pago Checkout Pro
    const mpStatus = params.get('status') || params.get('collection_status');
    const mpTracking = params.get('tracking') || params.get('external_reference');

    if (mpStatus === 'approved' || mpStatus === 'success') {
      if (mpTracking) {
        setOrders((prev) =>
          prev.map((o) =>
            o.trackingCode === mpTracking
              ? {
                  ...o,
                  status: 'Confirmado',
                  paymentStatus: 'Aprobado',
                  timeline: [
                    ...o.timeline,
                    {
                      status: 'Confirmado',
                      timestamp: 'Recién',
                      description: 'Pago acreditado exitosamente por Mercado Pago Checkout Pro',
                      location: 'Mercado Pago Oficial'
                    }
                  ]
                }
              : o
          )
        );
        setTrackingPrefill(mpTracking);
        setIsTrackingOpen(true);
      }

      const push: PushNotification = {
        id: `push-mp-${Date.now()}`,
        title: '🎉 ¡Pago Acreditado en Mercado Pago!',
        body: mpTracking
          ? `Tu pedido #${mpTracking} fue pagado con éxito. Ya estamos preparando tu paquete en BB IMPORT.`
          : 'Tu pago fue acreditado exitosamente.',
        timestamp: 'Ahora',
        read: false
      };
      setNotifications((prev) => [push, ...prev]);

      // Clean URL params without reloading
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // safe
      }
    } else if (mpStatus === 'failure' || mpStatus === 'rejected') {
      const push: PushNotification = {
        id: `push-mp-fail-${Date.now()}`,
        title: '⚠️ Pago no completado',
        body: 'El pago en Mercado Pago no se completó. Puedes reintentarlo o abonar por transferencia.',
        timestamp: 'Ahora',
        read: false
      };
      setNotifications((prev) => [push, ...prev]);
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // safe
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load persistent media & reviews from server on startup
  useEffect(() => {
    loadMediaFromServer().then((serverMedia) => {
      if (serverMedia && Array.isArray(serverMedia) && serverMedia.length > 0) {
        setMedia(serverMedia);
      }
    });

    loadReviewsFromServer().then((serverReviews) => {
      if (serverReviews && Array.isArray(serverReviews) && serverReviews.length > 0) {
        setReviews(serverReviews);
      }
    });
  }, []);

  // Save to localStorage safely when state changes
  useEffect(() => {
    safeSet('bbimport_content', content);
  }, [content]);

  useEffect(() => {
    safeSet('bbimport_media', media);
  }, [media]);

  useEffect(() => {
    safeSet('bbimport_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeSet('bbimport_reviews', reviews);
  }, [reviews]);

  useEffect(() => {
    safeSet('bbimport_gateways', gateways);
  }, [gateways]);

  useEffect(() => {
    safeSet('bbimport_notifications', notifications);
  }, [notifications]);

  // Handlers
  const handleBuyNow = () => {
    if (cartCount === 0) {
      setCartCount(1);
    }
    setIsCheckoutOpen(true);
  };

  const handleAddToCart = () => {
    setCartCount((prev) => (prev === 0 ? 1 : prev + 1));
    setIsCheckoutOpen(true);
  };

  const handleClearCart = () => {
    setCartCount(0);
  };

  const handleCreateOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    setCartCount(0);

    // Trigger in-app push notification
    const push: PushNotification = {
      id: `push-${Date.now()}`,
      title: `✅ Pedido #${newOrder.trackingCode} Registrado`,
      body: `Gracias ${newOrder.customerName}. Tu paquete está preparándose para despacho en BB IMPORT.`,
      timestamp: 'Recién',
      read: false
    };
    setNotifications((prev) => [push, ...prev]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const updated = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updated);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const nowDisplay = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const newTimelineEvent = {
          status: newStatus,
          timestamp: nowDisplay,
          description: note || `Estado actualizado a ${newStatus} por logística BB IMPORT`,
          location: 'Depósito Central BB IMPORT'
        };

        return {
          ...o,
          status: newStatus,
          timeline: [...o.timeline, newTimelineEvent]
        };
      }
      return o;
    });

    setOrders(updated);

    // Trigger push notification to alert client
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const push: PushNotification = {
        id: `push-status-${Date.now()}`,
        title: `📦 Actualización de Pedido #${targetOrder.trackingCode}`,
        body: `Tu orden cambió a estado: ${newStatus}.`,
        timestamp: 'Recién',
        read: false
      };
      setNotifications((prev) => [push, ...prev]);
    }
  };

  const handleAddReview = (newReview: Review) => {
    const updated = [newReview, ...reviews];
    setReviews(updated);
    safeSet('bbimport_reviews', updated);
    syncReviewsWithServer(updated);
  };

  const handleUpdateReviews = (newReviews: Review[]) => {
    setReviews(newReviews);
    safeSet('bbimport_reviews', newReviews);
    syncReviewsWithServer(newReviews);
  };

  const handleResetReviewsToDefault = () => {
    setReviews(initialReviews);
    safeSet('bbimport_reviews', initialReviews);
    try {
      const codeFingerprint = JSON.stringify(
        initialReviews.map((r) => ({ id: r.id, img: r.imageUrl, text: r.comment, title: r.title, author: r.author }))
      );
      localStorage.setItem('bbimport_reviews_code_fp', codeFingerprint);
    } catch {
      // safe
    }
    syncReviewsWithServer(initialReviews);
  };

  const handleSendPushFromAdmin = (push: { title: string; body: string }) => {
    const newPush: PushNotification = {
      id: `push-${Date.now()}`,
      title: push.title,
      body: push.body,
      timestamp: 'Ahora mismo',
      read: false
    };
    setNotifications([newPush, ...notifications]);
  };

  const handleUpdateMedia = (newMedia: MediaItem[]) => {
    setMedia(newMedia);
    safeSet('bbimport_media', newMedia);
    syncMediaWithServer(newMedia);
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenTrackingWithCode = (code: string) => {
    setTrackingPrefill(code);
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Navigation Bar */}
      <Navbar
        content={content}
        cartCount={cartCount}
        onOpenCart={() => setIsCheckoutOpen(true)}
        onOpenTracking={() => {
          setTrackingPrefill('');
          setIsTrackingOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onScrollToReviews={scrollToReviews}
        onScrollToFeatures={scrollToFeatures}
        isAdminOpen={isAdminOpen}
      />

      {/* Main Single-Product High-Converting Shopify Hero Layout */}
      <main className="flex-1 pb-24 sm:pb-0">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Interactive Product Gallery (static on mobile/tablet to avoid overlapping text/prices) */}
            <div className="w-full lg:col-span-7 static lg:sticky lg:top-24 z-0">
              <ProductGallery
                media={media}
                selectedVariantIndex={selectedVariant.imageIdx ?? 0}
              />
            </div>

            {/* Right Column: High-Converting Buy Box & Details */}
            <div className="lg:col-span-5">
              <ProductDetails
                content={content}
                variants={variants}
                bundles={bundles}
                selectedVariant={selectedVariant}
                onSelectVariant={setSelectedVariant}
                selectedBundle={selectedBundle}
                onSelectBundle={setSelectedBundle}
                onBuyNow={handleBuyNow}
                onAddToCart={handleAddToCart}
                onScrollToReviews={scrollToReviews}
              />
            </div>
          </div>
        </section>

        {/* Product Features & Demonstration Highlights */}
        <ProductFeatures
          content={content}
          onBuyNow={handleBuyNow}
        />

        {/* Customer Reviews Section */}
        <ReviewsSection
          reviews={reviews}
          onAddReview={handleAddReview}
        />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        content={content}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracking={() => {
          setTrackingPrefill('');
          setIsTrackingOpen(true);
        }}
      />

      {/* Floating WhatsApp Support Button */}
      <WhatsAppButton
        whatsappNumber={content.whatsappNumber}
        storeName={content.storeName}
        productTitle={content.productTitle}
      />

      {/* Sticky Mobile Purchase Bar (only when modals are closed) */}
      {!isTrackingOpen && !isCheckoutOpen && !isAdminOpen && (
        <StickyMobileBar
          content={content}
          selectedVariant={selectedVariant}
          selectedBundle={selectedBundle}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Live Social Proof: Solo notificación de "... acaba de comprar!" */}
      <SocialPushToast
        isDisabled={isTrackingOpen || isCheckoutOpen || isAdminOpen}
      />

      {/* Real-Time Order Tracking Modal */}
      <OrderTracking
        orders={orders}
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        prefilledCode={trackingPrefill}
      />

      {/* Functional Checkout & Payment Gateways Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        content={content}
        selectedVariant={selectedVariant}
        selectedBundle={selectedBundle}
        gateways={gateways}
        cartCount={cartCount}
        onClearCart={handleClearCart}
        onAddToCart={handleAddToCart}
        onCreateOrder={handleCreateOrder}
        onOpenTrackingWithCode={handleOpenTrackingWithCode}
      />

      {/* Hidden Admin Management Control Panel */}
      {isAdminOpen && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateOrder={handleUpdateOrder}
          content={content}
          onSaveContent={setContent}
          media={media}
          onUpdateMedia={handleUpdateMedia}
          reviews={reviews}
          onUpdateReviews={handleUpdateReviews}
          onResetReviewsToDefault={handleResetReviewsToDefault}
          gateways={gateways}
          onUpdateGateways={setGateways}
          onSendPushNotification={handleSendPushFromAdmin}
          notifications={notifications}
        />
      )}
    </div>
  );
}
