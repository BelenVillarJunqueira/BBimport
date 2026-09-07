import React, { useState, useRef } from 'react';
import { 
  ShoppingBag, 
  Settings, 
  Image as ImageIcon, 
  BarChart3, 
  Bell, 
  CreditCard, 
  Save, 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Check, 
  Film, 
  Truck, 
  Eye, 
  EyeOff,
  AlertCircle,
  LogOut,
  Key,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Send,
  Instagram,
  Facebook,
  MessageCircle,
  FileText,
  ExternalLink,
  Printer,
  Copy,
  Share2,
  Lock,
  ShieldCheck,
  Loader2,
  Play,
  Star,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { uploadMediaItem, uploadReviewImage } from '../utils/imageOptimizer';
import { isUrlVideo, getMediaEmbedInfo, syncMediaWithServer, syncReviewsWithServer } from '../utils/mediaUtils';
import { 
  GatewaySettings, 
  MediaItem, 
  Order, 
  OrderStatus, 
  ProductVariant, 
  PushNotification, 
  Review, 
  StoreContent 
} from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onUpdateOrder?: (order: Order) => void;
  content: StoreContent;
  onSaveContent: (newContent: StoreContent) => void;
  media: MediaItem[];
  onUpdateMedia: (newMedia: MediaItem[]) => void;
  reviews?: Review[];
  onUpdateReviews?: (newReviews: Review[]) => void;
  onResetReviewsToDefault?: () => void;
  gateways: GatewaySettings;
  onUpdateGateways: (newGateways: GatewaySettings) => void;
  onSendPushNotification: (notification: { title: string; body: string }) => void;
  notifications: PushNotification[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onUpdateOrder,
  content,
  onSaveContent,
  media,
  onUpdateMedia,
  reviews = [],
  onUpdateReviews,
  onResetReviewsToDefault,
  gateways,
  onUpdateGateways,
  onSendPushNotification,
  notifications
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'cms' | 'media' | 'reviews' | 'gateways' | 'analytics' | 'push'>('orders');

  // Admin Authentication State (User and Password protected)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bbimport_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();
    if ((u === 'admin' || u === 'bbimport') && (p === 'bbimport2025' || p === 'admin' || p === 'admin123')) {
      try {
        sessionStorage.setItem('bbimport_admin_auth', 'true');
      } catch {
        // safe
      }
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    }
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('bbimport_admin_auth');
    } catch {
      // safe
    }
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminPassword('');
    onClose();
  };

  // CMS Form State
  const [editableContent, setEditableContent] = useState<StoreContent>(content);
  const [cmsSavedAlert, setCmsSavedAlert] = useState(false);
  const [newBoxItemText, setNewBoxItemText] = useState('');

  // Gateway Form State with Mercado Pago defaults
  const [editableGateways, setEditableGateways] = useState<GatewaySettings>(() => ({
    ...gateways,
    mercadoPago: gateways.mercadoPago || {
      publicKey: 'APP_USR-7a6b980c-bbimport-prod-2025',
      accessToken: '',
      paymentLinkUrl: 'https://mpago.la/2vK8Xqp',
      mpAliasOrCvu: 'bbimport.mp',
      environment: 'production',
      installmentsMax: 12
    }
  }));
  const [gatewaySavedAlert, setGatewaySavedAlert] = useState(false);
  const [testingMp, setTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{ success: boolean; message: string; isProduction?: boolean } | null>(null);

  const handleTestMpCredentials = async () => {
    setTestingMp(true);
    setMpTestResult(null);
    try {
      const res = await fetch('/api/mercadopago/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: editableGateways.mercadoPago?.accessToken })
      });
      const data = await res.json();
      setMpTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Conexión exitosa' : 'Error al conectar con Mercado Pago'),
        isProduction: data.isProduction
      });
    } catch (e: any) {
      setMpTestResult({
        success: false,
        message: e.message || 'Error de conexión con el servidor.'
      });
    } finally {
      setTestingMp(false);
    }
  };

  // Media upload local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState<string | null>(null);

  // Push notification state
  const [pushTitle, setPushTitle] = useState('¡Tu pedido BB IMPORT está en camino!');
  const [pushBody, setPushBody] = useState('Tu paquete fue despachado con Andreani. Consulta tu seguimiento con tu código.');
  const [pushSentAlert, setPushSentAlert] = useState(false);

  // Filter orders
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Selected Order for Real Tracking & Editing
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printRemitoOrder, setPrintRemitoOrder] = useState<Order | null>(null);

  // Timeline addition in order modal
  const [newTimelineStatus, setNewTimelineStatus] = useState<OrderStatus>('En Tránsito');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [newTimelineLoc, setNewTimelineLoc] = useState('');

  // Reviews Form State
  const [editableReviews, setEditableReviews] = useState<Review[]>(() => reviews || []);
  const [reviewsSavedAlert, setReviewsSavedAlert] = useState(false);
  const [reviewsResetAlert, setReviewsResetAlert] = useState(false);
  const [uploadingReviewIdx, setUploadingReviewIdx] = useState<number | null>(null);
  const [targetReviewUploadIdx, setTargetReviewUploadIdx] = useState<number | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when reviews prop updates from outside
  React.useEffect(() => {
    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
      setEditableReviews(reviews);
    }
  }, [reviews]);

  // Handler for Content Save
  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContent(editableContent);
    setCmsSavedAlert(true);
    setTimeout(() => setCmsSavedAlert(false), 2500);
  };

  // Handler for Gateways Save
  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGateways(editableGateways);
    setGatewaySavedAlert(true);
    setTimeout(() => setGatewaySavedAlert(false), 2500);
  };

  // Media Reordering Handlers
  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= media.length) return;

    const copy = [...media];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onUpdateMedia(copy);
  };

  const handleDeleteMedia = (id: string) => {
    if (media.length <= 1) {
      alert('Debes mantener al menos una imagen en el carrusel.');
      return;
    }
    const filtered = media.filter((m) => m.id !== id);
    onUpdateMedia(filtered);
  };

  // File Upload from PC (Image or Video) with automatic compression & optimization
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value safely
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploadingMedia(true);
    setMediaUploadError(null);
    setMediaUploadSuccess(null);

    try {
      const newItem = await uploadMediaItem(file, newMediaTitle);
      const safeMedia = Array.isArray(media) ? media : [];
      // Set newly uploaded reel or image at the beginning so it is immediately visible as #1
      const updated = [newItem, ...safeMedia];
      onUpdateMedia(updated);
      syncMediaWithServer(updated);
      setNewMediaTitle('');
      setMediaUploadSuccess(`¡"${newItem.title}" guardado permanentemente como #1 en el carrusel!`);
      setTimeout(() => setMediaUploadSuccess(null), 4500);
    } catch (err: any) {
      console.error('Error al subir multimedia:', err);
      setMediaUploadError(
        err.message || 'Error al procesar el archivo. Por favor verifica el formato y vuelve a intentar.'
      );
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Add external URL media (Social Reels, YouTube, MP4 or Images)
  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    let url = newMediaUrl.trim();
    if (url.startsWith('/public/')) {
      url = url.replace(/^\/public\//, '/');
    } else if (url.startsWith('public/')) {
      url = url.replace(/^public\//, '/');
    }
    const isVid = isUrlVideo(url) || newMediaType === 'video';
    const cleanTitle = newMediaTitle.trim() || (isVid ? 'Reel de demostración' : 'Foto de producto');

    const newItem: MediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: isVid ? 'video' : 'image',
      url,
      title: cleanTitle,
      alt: cleanTitle
    };

    const safeMedia = Array.isArray(media) ? media : [];
    // Place at the top of the gallery
    const updated = [newItem, ...safeMedia];
    onUpdateMedia(updated);
    syncMediaWithServer(updated);
    setNewMediaUrl('');
    setNewMediaTitle('');
    setMediaUploadSuccess(`¡${isVid ? 'Reel' : 'Elemento'} agregado como principal (#1) en la tienda!`);
    setTimeout(() => setMediaUploadSuccess(null), 4000);
  };

  // ================= REVIEWS HANDLERS =================

  const handleUpdateReviewField = (index: number, field: keyof Review, value: any) => {
    setEditableReviews((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editableReviews.length) return;
    const copy = [...editableReviews];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setEditableReviews(copy);
  };

  const handleDeleteReview = (index: number) => {
    if (editableReviews.length <= 1) {
      alert('Debes mantener al menos 1 reseña en la tienda.');
      return;
    }
    const copy = editableReviews.filter((_, i) => i !== index);
    setEditableReviews(copy);
  };

  const handleAddReview = () => {
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: 'Nuevo Cliente',
      location: 'Buenos Aires',
      rating: 5,
      date: 'Reciente',
      title: 'Excelente máquina y atención rápida',
      comment: 'Compré la máquina y llegó rapidísimo. Funciona de diez y la calidad de corte es impresionante.',
      verifiedBuyer: true
    };
    setEditableReviews([newRev, ...editableReviews]);
  };

  const handleTriggerReviewUpload = (index: number) => {
    setTargetReviewUploadIdx(index);
    if (reviewFileInputRef.current) {
      reviewFileInputRef.current.value = '';
      reviewFileInputRef.current.click();
    }
  };

  const handleReviewFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetReviewUploadIdx === null) return;
    const idx = targetReviewUploadIdx;
    setUploadingReviewIdx(idx);
    try {
      const permanentUrl = await uploadReviewImage(file);
      handleUpdateReviewField(idx, 'imageUrl', permanentUrl);
    } catch (err) {
      console.error('Error subiendo imagen de reseña:', err);
      alert('Hubo un error al procesar la imagen de la reseña.');
    } finally {
      setUploadingReviewIdx(null);
      setTargetReviewUploadIdx(null);
    }
  };

  const handleSaveAllReviews = () => {
    onUpdateReviews?.(editableReviews);
    syncReviewsWithServer(editableReviews);
    setReviewsSavedAlert(true);
    setTimeout(() => setReviewsSavedAlert(false), 3500);
  };

  const handleResetReviewsToCode = () => {
    if (window.confirm('¿Deseas restablecer las reseñas con lo definido en el archivo de código (initialData.ts)? Esto limpiará la memoria local y cargará los textos e imágenes del código.')) {
      onResetReviewsToDefault?.();
      setReviewsResetAlert(true);
      setTimeout(() => setReviewsResetAlert(false), 4000);
    }
  };

  // Push notification dispatch
  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;

    onSendPushNotification({
      title: pushTitle.trim(),
      body: pushBody.trim()
    });

    setPushSentAlert(true);
    setTimeout(() => setPushSentAlert(false), 2500);
  };

  // Analytics calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelado' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const deliveredCount = orders.filter((o) => o.status === 'Entregado').length;
  const pendingCount = orders.filter((o) => o.status === 'Pendiente' || o.status === 'Confirmado').length;
  const avgOrderValue = totalOrdersCount ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return (
        o.trackingCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle saving carrier and tracking info on selected order
  const handleSaveSelectedOrder = () => {
    if (!selectedOrder) return;
    if (onUpdateOrder) {
      onUpdateOrder(selectedOrder);
    } else {
      onUpdateOrderStatus(selectedOrder.id, selectedOrder.status, 'Información de despacho actualizada');
    }
    alert(`¡Datos de envío y guía para el pedido #${selectedOrder.trackingCode} actualizados correctamente!`);
  };

  // Add new milestone to selected order
  const handleAddTimelineMilestone = () => {
    if (!selectedOrder || !newTimelineDesc.trim()) return;

    const nowDisplay = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMilestone = {
      status: newTimelineStatus,
      timestamp: nowDisplay,
      description: newTimelineDesc.trim(),
      location: newTimelineLoc.trim() || `${selectedOrder.carrier} Logística`
    };

    const updatedOrder: Order = {
      ...selectedOrder,
      status: newTimelineStatus,
      timeline: [...selectedOrder.timeline, newMilestone]
    };

    setSelectedOrder(updatedOrder);
    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    } else {
      onUpdateOrderStatus(updatedOrder.id, newTimelineStatus, newTimelineDesc.trim());
    }

    setNewTimelineDesc('');
    setNewTimelineLoc('');
  };

  // Notify WhatsApp directly to customer
  const handleNotifyCustomerWhatsApp = (ord: Order) => {
    const rawPhone = ord.phone.replace(/\D/g, '');
    const carrierName = ord.carrier || 'Andreani';
    const trackingNo = ord.externalTrackingNumber || ord.trackingCode;
    const trackingLink = ord.externalTrackingUrl || 
      (carrierName.toLowerCase().includes('correo')
        ? `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingNo}`
        : `https://www.andreani.com/#!/informacionEnvio/${trackingNo}`);

    const message = `Hola ${ord.customerName}! 💈 Te contactamos desde *${content.storeName}*. 
Tu pedido #${ord.trackingCode} (${ord.items[0]?.bundleTitle || ord.items[0]?.productName}) fue despachado.

📦 *Estado:* ${ord.status}
🚚 *Empresa de Envíos:* ${carrierName}
📍 *Guía Oficial de Rastreo:* ${trackingNo}
🔗 *Seguimiento Oficial:* ${trackingLink}

Cualquier consulta quedamos a tu disposición. ¡Muchas gracias por tu compra!`;

    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen) return null;

  // Password & Username Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="bg-[#121214] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white">
                BB<span className="text-amber-500">IMPORT</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                ADMIN
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Acceso Restringido
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Ingresa usuario y contraseña autorizados para gestionar pedidos, pasarelas de pago y la tienda.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Usuario de Administrador
              </label>
              <input
                type="text"
                required
                autoFocus
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  title={showAdminPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all shadow-lg cursor-pointer"
            >
              Entrar al Panel de Control
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col">
      {/* Admin Topbar */}
      <div className="h-16 bg-[#0D0D0D] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            BB<span className="text-amber-500">IMPORT</span>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
              PANEL ADMIN
            </span>
          </span>
          <span className="hidden lg:flex text-xs text-emerald-400 font-mono items-center gap-1.5">
            <Lock className="w-3 h-3" /> Panel Oculto: Inaccesible para clientes
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Sesión: <strong className="text-white">admin</strong>
          </span>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ✕ Salir
          </button>
        </div>
      </div>

      {/* Hidden Panel Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-8 py-2 text-[11px] text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Panel Privado & Oculto:</strong> No visible en menús públicos. Para ingresar en cualquier momento usa <strong>Ctrl + Shift + A</strong>, agrega <strong>?admin=true</strong> a la URL o haz 5 clics rápidos en el logo o en el copyright.
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-[#111111] border-b border-white/10 px-4 sm:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 py-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pedidos ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'cms'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Editor de Textos & Precios (CMS)</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'media'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Imágenes, Videos & Carrusel ({media.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Reseñas ({editableReviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'gateways'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pasarelas & Bancos</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analíticas de Ventas</span>
        </button>

        <button
          onClick={() => setActiveTab('push')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'push'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notificaciones Push ({notifications.length})</span>
        </button>
      </div>

      {/* Main Admin Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* ================= TAB 1: ORDERS ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">
                  Gestión y Estados de Pedidos
                </h3>
                <p className="text-xs text-zinc-400">
                  Actualiza el estado de los paquetes para que los clientes vean el progreso en tiempo real.
                </p>
              </div>

              {/* Quick Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o ciudad..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 w-full sm:w-64 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {['all', 'Pendiente', 'Confirmado', 'En Preparación', 'En Tránsito', 'En Reparto', 'Entregado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                    orderFilter === st
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? `Todos (${orders.length})` : st}
                </button>
              ))}
            </div>

            {/* Orders List Table */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161616] text-zinc-400 border-b border-white/10 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Guía / ID</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Destino</th>
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4">Pago / Total</th>
                      <th className="py-3 px-4">Estado Actual</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No se encontraron pedidos con ese criterio.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {ord.trackingCode}
                            <div className="text-[10px] text-zinc-500 font-sans">
                              {new Date(ord.createdAt).toLocaleDateString('es-AR')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{ord.customerName}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">{ord.phone}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-white">{ord.city}</p>
                            <p className="text-[10px] text-zinc-500 truncate max-w-37.5">{ord.address}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-zinc-200 font-medium">
                              {ord.items[0]?.bundleTitle || ord.items[0]?.productName}
                            </span>
                            <span className="block text-[10px] text-amber-400">
                              {ord.items[0]?.variantName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-black text-white">
                              ${ord.total.toLocaleString('es-AR')}
                            </span>
                            <span className="block text-[10px] text-zinc-400 capitalize">
                              {ord.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {ord.status}
                            </span>
                            {ord.externalTrackingNumber && (
                              <span className="block font-mono text-[9px] text-zinc-400 mt-1">
                                {ord.carrier}: {ord.externalTrackingNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                title="Gestionar Envío, Correo y WhatsApp"
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Rastrear / Envío</span>
                              </button>

                              <button
                                onClick={() => setPrintRemitoOrder(ord)}
                                title="Imprimir Remito Oficial BB IMPORT"
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-lg text-xs transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <select
                                value={ord.status}
                                onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-[#18181B] border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="En Preparación">En Preparación</option>
                                <option value="En Tránsito">En Tránsito</option>
                                <option value="En Reparto">En Reparto</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CMS / TEXTS ================= */}
        {activeTab === 'cms' && (
          <form onSubmit={handleSaveCMS} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">
                  Editor de Contenidos, Precios y Textos
                </h3>
                <p className="text-xs text-zinc-400">
                  Modifica cualquier texto, título, precio o garantía de la tienda y haz clic en Guardar.
                </p>
              </div>

              <button
                type="submit"
                id="save-cms-button"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>

            {cmsSavedAlert && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4" />
                ¡Cambios guardados con éxito en BB IMPORT! Se actualizaron en toda la tienda.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Store & Banner */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Identidad y Marquesina
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Nombre de la Tienda</label>
                  <input
                    type="text"
                    value={editableContent.storeName}
                    onChange={(e) => setEditableContent({ ...editableContent, storeName: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Eslogan / Submarca</label>
                  <input
                    type="text"
                    value={editableContent.tagline}
                    onChange={(e) => setEditableContent({ ...editableContent, tagline: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Barra Superior de Anuncios</label>
                  <input
                    type="text"
                    value={editableContent.topBannerText}
                    onChange={(e) => setEditableContent({ ...editableContent, topBannerText: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Box 2: Product & Pricing */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Producto Principal y Precios
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Título del Producto</label>
                  <input
                    type="text"
                    value={editableContent.productTitle}
                    onChange={(e) => setEditableContent({ ...editableContent, productTitle: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Subtítulo / Bajada de Ventas</label>
                  <textarea
                    rows={2}
                    value={editableContent.productSubtitle}
                    onChange={(e) => setEditableContent({ ...editableContent, productSubtitle: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Precio Oferta ($)</label>
                    <input
                      type="number"
                      value={editableContent.salePrice}
                      onChange={(e) => setEditableContent({ ...editableContent, salePrice: Number(e.target.value) })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Precio Regular Tachado ($)</label>
                    <input
                      type="number"
                      value={editableContent.regularPrice}
                      onChange={(e) => setEditableContent({ ...editableContent, regularPrice: Number(e.target.value) })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Box 3: Guarantees & Urgency */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Garantía y Conversión
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Título de Garantía</label>
                  <input
                    type="text"
                    value={editableContent.guaranteeTitle}
                    onChange={(e) => setEditableContent({ ...editableContent, guaranteeTitle: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Descripción de la Garantía</label>
                  <textarea
                    rows={3}
                    value={editableContent.guaranteeDescription}
                    onChange={(e) => setEditableContent({ ...editableContent, guaranteeDescription: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Box 4: Specifications */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Especificaciones Técnicas
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Motor y Potencia</label>
                  <input
                    type="text"
                    value={editableContent.motorSpecs}
                    onChange={(e) => setEditableContent({ ...editableContent, motorSpecs: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Batería y Carga</label>
                  <input
                    type="text"
                    value={editableContent.batterySpecs}
                    onChange={(e) => setEditableContent({ ...editableContent, batterySpecs: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Cuchillas y Cabezal</label>
                  <input
                    type="text"
                    value={editableContent.bladesSpecs}
                    onChange={(e) => setEditableContent({ ...editableContent, bladesSpecs: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Ergonomía y Construcción</label>
                  <input
                    type="text"
                    value={editableContent.ergonomicsSpecs}
                    onChange={(e) => setEditableContent({ ...editableContent, ergonomicsSpecs: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Box 5: Redes Sociales & Soporte */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Redes Sociales & Canales de Contacto
                </h4>

                <div>
                  <label className="flex text-xs font-bold text-zinc-400 mb-1 items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Enlace de Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/tu_usuario"
                    value={editableContent.instagramUrl || ''}
                    onChange={(e) => setEditableContent({ ...editableContent, instagramUrl: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Usuario / Arroba de Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@bbimport_oficial"
                    value={editableContent.instagramHandle || ''}
                    onChange={(e) => setEditableContent({ ...editableContent, instagramHandle: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-400" /> Enlace de Facebook
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/tu_pagina"
                    value={editableContent.facebookUrl || ''}
                    onChange={(e) => setEditableContent({ ...editableContent, facebookUrl: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-400" /> Nombre de Página de Facebook
                  </label>
                  <input
                    type="text"
                    placeholder="BB Import Profesional Oficial"
                    value={editableContent.facebookPage || ''}
                    onChange={(e) => setEditableContent({ ...editableContent, facebookPage: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Oficial
                    </label>
                    <input
                      type="text"
                      placeholder="+54 9 11 3840-2911"
                      value={editableContent.whatsappNumber || ''}
                      onChange={(e) => setEditableContent({ ...editableContent, whatsappNumber: e.target.value })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Email de Soporte</label>
                    <input
                      type="email"
                      placeholder="ventas@bbimport.com.ar"
                      value={editableContent.supportEmail || ''}
                      onChange={(e) => setEditableContent({ ...editableContent, supportEmail: e.target.value })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Box 6: Envíos y Logística */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Despacho y Logística
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Titular de Envíos</label>
                  <input
                    type="text"
                    value={editableContent.shippingHeadline}
                    onChange={(e) => setEditableContent({ ...editableContent, shippingHeadline: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Subtítulo de Envíos</label>
                  <textarea
                    rows={2}
                    value={editableContent.shippingSubtext}
                    onChange={(e) => setEditableContent({ ...editableContent, shippingSubtext: e.target.value })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Box 7: Qué Incluye la Caja */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4 md:col-span-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Contenido de la Caja (Qué Incluye el Paquete)
                </h4>

                <div className="space-y-2">
                  {editableContent.boxIncludes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-xs text-zinc-500">{idx + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...editableContent.boxIncludes];
                          updated[idx] = e.target.value;
                          setEditableContent({ ...editableContent, boxIncludes: updated });
                        }}
                        className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editableContent.boxIncludes.filter((_, i) => i !== idx);
                          setEditableContent({ ...editableContent, boxIncludes: updated });
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 cursor-pointer"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nuevo ítem (ej: 1x Capa de Barbero Profesional BB IMPORT)"
                    value={newBoxItemText}
                    onChange={(e) => setNewBoxItemText(e.target.value)}
                    className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBoxItemText.trim()) return;
                      setEditableContent({
                        ...editableContent,
                        boxIncludes: [...editableContent.boxIncludes, newBoxItemText.trim()]
                      });
                      setNewBoxItemText('');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar Ítem
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right pt-4">
              <button
                type="submit"
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center gap-2 ml-auto shadow-xl cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Todos los Textos</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 3: MEDIA & CAROUSEL ================= */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">
                Gestor de Imágenes, Videos y Orden del Carrusel
              </h3>
              <p className="text-xs text-zinc-400">
                Sube fotos y videos directamente desde tu computadora. Puedes reorganizar el orden del carrusel hacia arriba o hacia abajo sin romper la tienda.
              </p>
            </div>

            {/* Upload Feedback Banners */}
            {mediaUploadSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{mediaUploadSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUploadSuccess(null)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            )}

            {mediaUploadError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{mediaUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUploadError(null)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Upload Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload from PC */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Subir Fotos o Reels / Videos (PC o Celular)
                </h4>
                <p className="text-xs text-zinc-400">
                  Selecciona una foto o reel de video (<span className="text-amber-300 font-mono">MP4, MOV, WebM</span>) de tu máquina cortadora. Se guardará de forma permanente en el servidor y se posicionará como contenido principal.
                </p>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Título de la foto/video (Opcional):</label>
                  <input
                    type="text"
                    value={newMediaTitle}
                    disabled={isUploadingMedia}
                    onChange={(e) => setNewMediaTitle(e.target.value)}
                    placeholder="Ej: Demostración corte en acción Barber Pro"
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  disabled={isUploadingMedia}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isUploadingMedia ? (
                    <Loader2 className="w-8 h-8 text-amber-400 mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-amber-400 mb-2" />
                  )}
                  <span className="text-xs font-bold text-white">
                    {isUploadingMedia ? 'Guardando archivo en el servidor...' : 'Haz clic para elegir foto o video reel'}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    {isUploadingMedia ? 'Almacenando de forma permanente en /uploads' : 'Soporta MP4, MOV, WebM, JPG, PNG'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.webm"
                  disabled={isUploadingMedia}
                  onChange={handleFileUpload}
                  className="hidden"
                  style={{ display: 'none' }}
                />
              </div>

              {/* Add from URL */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Film className="w-4 h-4" /> Agregar por URL Web (Reels de Instagram, TikTok, YouTube o Video)
                </h4>
                <p className="text-xs text-zinc-400">
                  Pega un enlace de Instagram Reel (<span className="text-amber-300 font-mono">instagram.com/reel/...</span>), YouTube Shorts o enlace directo de video o imagen.
                </p>

                <div className="flex gap-2">
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                    className="bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="video">Reel / Video</option>
                    <option value="image">Imagen</option>
                  </select>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/C... o https://ejemplo.com/reel.mp4"
                    className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  className="w-full py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Agregar como Principal (#1) al Sitio Web
                </button>
              </div>
            </div>

            {/* Current Carousel Order List */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-black tracking-wider text-zinc-400">
                Elementos Actuales del Carrusel (Arrastra o Mueve el Orden):
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(media) ? media : []).map((item, idx) => {
                  if (!item) return null;
                  const itemKey = item.id || `media-${idx}`;
                  const itemUrl = item.url || '/uploads/media-1788721815153-p1sjl.jpeg';
                  const itemTitle = item.title || 'Foto de producto';
                  const itemEmbed = getMediaEmbedInfo(itemUrl, item.type);
                  const isVideoItem = item.type === 'video' || (item.type !== 'image' && itemEmbed.platform !== 'image');

                  return (
                    <div
                      key={itemKey}
                      className="p-4 bg-[#111] border border-white/10 rounded-2xl flex flex-col justify-between space-y-3 relative group"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-black border border-white/10 relative">
                        {isVideoItem ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-zinc-950">
                            {itemEmbed.platform === 'native_video' ? (
                              <video src={`${itemUrl}#t=0.5`} className="w-full h-full object-cover" muted preload="metadata" />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-3 text-center bg-linear-to-tr from-red-600/30 via-zinc-900 to-black w-full h-full">
                                <Film className="w-8 h-8 text-amber-400 mb-1" />
                                <span className="text-[10px] text-zinc-400 font-mono">{itemEmbed.titleHint || 'Reel / Video'}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={itemUrl}
                            alt={itemTitle}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/uploads/media-1788721815153-p1sjl.jpeg';
                            }}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded font-mono text-[10px] text-amber-400 font-bold">
                          {`#${idx + 1}${idx === 0 ? ' • PRINCIPAL' : ''}`}
                        </span>
                        {isVideoItem && (
                          <span className="absolute top-2 right-2 bg-red-600/90 text-white px-2 py-0.5 rounded font-mono text-[10px] font-black shadow flex items-center gap-1">
                            <Film className="w-2.5 h-2.5" /> REEL
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white truncate">{itemTitle}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-mono">{item.type || 'image'}</p>
                      </div>

                      {/* Video Quick Link if it's a video */}
                      {isVideoItem && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <a
                            href={itemUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Probar enlace / ver video
                          </a>
                        </div>
                      )}

                      {/* Reorder Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveMedia(idx, 'up')}
                            className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-zinc-300 cursor-pointer"
                            title="Mover hacia adelante"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (Array.isArray(media) ? media.length : 1) - 1}
                            onClick={() => handleMoveMedia(idx, 'down')}
                            className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-zinc-300 cursor-pointer"
                            title="Mover hacia atrás"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: GATEWAYS ================= */}
        {activeTab === 'gateways' && (
          <form onSubmit={handleSaveGateways} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">
                  Configuración de Pasarelas de Pago
                </h3>
                <p className="text-xs text-zinc-400">
                  Habilita o deshabilita los métodos de pago y configura tus cuentas bancarias.
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Pasarelas</span>
              </button>
            </div>

            {gatewaySavedAlert && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                ¡Configuración de pasarelas guardada correctamente!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Toggles */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Métodos Habilitados en Tienda
                </h4>

                <label className="flex items-center justify-between p-3 bg-[#18181B] rounded-xl cursor-pointer">
                  <span className="text-xs font-bold text-white">Pago Contra Entrega (Efectivo al Repartidor)</span>
                  <input
                    type="checkbox"
                    checked={editableGateways.enableCod}
                    onChange={(e) => setEditableGateways({ ...editableGateways, enableCod: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#18181B] rounded-xl cursor-pointer">
                  <span className="text-xs font-bold text-white">Transferencia Bancaria Inmediata (CBU/Alias)</span>
                  <input
                    type="checkbox"
                    checked={editableGateways.enableTransfer}
                    onChange={(e) => setEditableGateways({ ...editableGateways, enableTransfer: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#18181B] rounded-xl cursor-pointer">
                  <span className="text-xs font-bold text-white">Mercado Pago (Tarjetas & Dinero en Cuenta)</span>
                  <input
                    type="checkbox"
                    checked={editableGateways.enableMercadoPago}
                    onChange={(e) => setEditableGateways({ ...editableGateways, enableMercadoPago: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#18181B] rounded-xl cursor-pointer">
                  <span className="text-xs font-bold text-white">Tarjetas Directas (Visa, Master, Amex)</span>
                  <input
                    type="checkbox"
                    checked={editableGateways.enableCards}
                    onChange={(e) => setEditableGateways({ ...editableGateways, enableCards: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              </div>

              {/* Bank Transfer Details */}
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Datos de Cuenta Bancaria Oficial BB IMPORT
                </h4>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Nombre del Banco</label>
                  <input
                    type="text"
                    value={editableGateways.bank.bankName}
                    onChange={(e) => setEditableGateways({
                      ...editableGateways,
                      bank: { ...editableGateways.bank, bankName: e.target.value }
                    })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={editableGateways.bank.accountHolder}
                    onChange={(e) => setEditableGateways({
                      ...editableGateways,
                      bank: { ...editableGateways.bank, accountHolder: e.target.value }
                    })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Alias Bancario</label>
                    <input
                      type="text"
                      value={editableGateways.bank.alias}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        bank: { ...editableGateways.bank, alias: e.target.value }
                      })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">CUIT / RUT</label>
                    <input
                      type="text"
                      value={editableGateways.bank.cuit}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        bank: { ...editableGateways.bank, cuit: e.target.value }
                      })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">CBU (22 dígitos)</label>
                  <input
                    type="text"
                    value={editableGateways.bank.cbu}
                    onChange={(e) => setEditableGateways({
                      ...editableGateways,
                      bank: { ...editableGateways.bank, cbu: e.target.value }
                    })}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Mercado Pago Configuration Card */}
              <div className="p-6 bg-[#111] border border-sky-500/30 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-sky-400">
                      Configuración Oficial Mercado Pago (Pasarela #1)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20 font-bold">
                    ONLINE & CUOTAS
                  </span>
                </div>

                <div className="p-3 bg-sky-950/30 border border-sky-500/20 rounded-xl text-xs text-sky-200 space-y-1">
                  <p className="font-bold text-sky-300">
                    💰 ¿Cómo configurar para que el dinero llegue directamente a tu cuenta de Mercado Pago?
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    1. Entra a tu cuenta en mercadopago.com.ar o en la app y genera un <strong>Link de Pago</strong> con el monto de tu producto o copia tu <strong>Alias / CVU</strong>.<br />
                    2. Pégalo en el campo <strong>Enlace de Pago Oficial</strong> o <strong>Alias de Mercado Pago</strong> abajo.<br />
                    3. Al finalizar una compra con Mercado Pago, el cliente podrá pagar directamente a tu cuenta oficial y recibirás el dinero al instante.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Enlace de Pago Oficial (Link de Mercado Pago / Point / Checkout Pro)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editableGateways.mercadoPago?.paymentLinkUrl || ''}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            publicKey: '',
                            accessToken: '',
                            environment: 'production',
                            installmentsMax: 12
                          }),
                          paymentLinkUrl: e.target.value
                        }
                      })}
                      placeholder="https://mpago.la/2vK8Xqp"
                      className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                    />
                    {editableGateways.mercadoPago?.paymentLinkUrl && (
                      <a
                        href={editableGateways.mercadoPago.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Probar Enlace
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Ejemplo: https://mpago.la/2vK8Xqp generado desde tu panel de cobros de Mercado Pago.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Alias o CVU de tu cuenta Mercado Pago
                    </label>
                    <input
                      type="text"
                      value={editableGateways.mercadoPago?.mpAliasOrCvu || ''}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            publicKey: '',
                            accessToken: '',
                            environment: 'production',
                            installmentsMax: 12
                          }),
                          mpAliasOrCvu: e.target.value
                        }
                      })}
                      placeholder="bbimport.mp"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Los clientes podrán transferir dinero en cuenta al instante a este alias.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Máximo de Cuotas Habilitadas
                    </label>
                    <select
                      value={editableGateways.mercadoPago?.installmentsMax || 12}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            publicKey: '',
                            accessToken: '',
                            environment: 'production'
                          }),
                          installmentsMax: Number(e.target.value)
                        }
                      })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    >
                      <option value={1}>1 Cuota (Sin financiación)</option>
                      <option value={3}>Hasta 3 Cuotas</option>
                      <option value={6}>Hasta 6 Cuotas</option>
                      <option value={12}>Hasta 12 Cuotas (Recomendado)</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Se calcularán automáticamente los planes de cuotas en el checkout.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Access Token de Mercado Pago (Privado)
                    </label>
                    <input
                      type="password"
                      value={editableGateways.mercadoPago?.accessToken || ''}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            publicKey: '',
                            environment: 'production',
                            installmentsMax: 12
                          }),
                          accessToken: e.target.value
                        }
                      })}
                      placeholder="APP_USR-xxxxxx-xxxxxx..."
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Si está definido en tu archivo <code className="text-sky-300 font-mono">.env</code> como <code className="text-amber-300 font-mono">MERCADO_PAGO_ACCESS_TOKEN</code>, se cargará automáticamente en el servidor.
                    </p>
                    <div className="mt-2">
                      <button
                        type="button"
                        disabled={testingMp}
                        onClick={handleTestMpCredentials}
                        className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {testingMp ? (
                          <>
                            <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                            <span>Verificando con Mercado Pago...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ Probar Conexión con Mercado Pago</span>
                          </>
                        )}
                      </button>

                      {mpTestResult && (
                        <div
                          className={`mt-2 p-2 rounded-lg text-[11px] border flex items-center gap-2 ${
                            mpTestResult.success
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <span>{mpTestResult.success ? '✓' : '✗'}</span>
                          <span>{mpTestResult.message}</span>
                          {mpTestResult.isProduction && (
                            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto">
                              PRODUCCIÓN
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Public Key (Credencial API Pública)
                    </label>
                    <input
                      type="text"
                      value={editableGateways.mercadoPago?.publicKey || ''}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            accessToken: '',
                            environment: 'production',
                            installmentsMax: 12
                          }),
                          publicKey: e.target.value
                        }
                      })}
                      placeholder="APP_USR-7a6b980c-bbimport-prod-2025"
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Opcional: <code className="text-sky-300 font-mono">VITE_MERCADO_PAGO_PUBLIC_KEY</code> en tu <code className="text-sky-300 font-mono">.env</code>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Ambiente de Operación
                    </label>
                    <select
                      value={editableGateways.mercadoPago?.environment || 'production'}
                      onChange={(e) => setEditableGateways({
                        ...editableGateways,
                        mercadoPago: {
                          ...(editableGateways.mercadoPago || {
                            publicKey: '',
                            accessToken: '',
                            installmentsMax: 12
                          }),
                          environment: e.target.value as 'sandbox' | 'production'
                        }
                      })}
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    >
                      <option value="production">Producción (Cobros Reales)</option>
                      <option value="sandbox">Sandbox (Modo de Pruebas)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                    <p className="text-[11px] text-sky-200 leading-tight">
                      <strong>Servidor Node/Vercel Activo:</strong> Las solicitudes de pago crean preferencias oficiales directamente en la API de Mercado Pago con soporte para 1, 3, 6 y 12 cuotas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ================= TAB 5: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">
                Panel de Analíticas Avanzadas de Ventas
              </h3>
              <p className="text-xs text-zinc-400">
                Métricas en tiempo real sobre facturación, pedidos y rendimiento de la tienda BB IMPORT.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Facturación Bruta
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  ${totalRevenue.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">+18% vs semana previa</p>
              </div>

              <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" /> Total de Pedidos
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {totalOrdersCount} órdenes
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">{deliveredCount} entregadas con éxito</p>
              </div>

              <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-400" /> Ticket Promedio
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  ${avgOrderValue.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">Impulsado por el Pack Dúo</p>
              </div>

              <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" /> Tasa de Conversión
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  4.82%
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">Muy superior a la media de e-commerce</p>
              </div>
            </div>

            {/* Breakdown Visuals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-xs uppercase font-black tracking-wider text-amber-400">
                  Desglose por Método de Pago
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300">Pago Contra Entrega</span>
                      <span className="font-mono text-amber-400">55%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300">Transferencia Bancaria Directa</span>
                      <span className="font-mono text-amber-400">25%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300">Tarjetas y Mercado Pago</span>
                      <span className="font-mono text-amber-400">20%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-xs uppercase font-black tracking-wider text-amber-400">
                  Variantes Más Vendidas
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#18181B] rounded-xl">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-zinc-800 border border-white/20" />
                      Negro Matte (Titanium)
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">58% de las ventas</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#18181B] rounded-xl">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 border border-white/20" />
                      Rojo Carmín (Sport)
                    </span>
                    <span className="font-mono text-amber-400 font-bold">22% de las ventas</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#18181B] rounded-xl">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600 border border-white/20" />
                      Azul Eléctrico & Amarillo
                    </span>
                    <span className="font-mono text-zinc-400 font-bold">20% de las ventas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: PUSH NOTIFICATIONS ================= */}
        {activeTab === 'push' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-xl font-black text-white">
                Sistema de Notificaciones Push a Clientes
              </h3>
              <p className="text-xs text-zinc-400">
                Envía alertas push en vivo que se mostrarán en la pantalla de los clientes que estén navegando la tienda.
              </p>
            </div>

            <form onSubmit={handleSendPush} className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Título de la Notificación</label>
                <input
                  type="text"
                  required
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="Ej: ⚡ Oferta Relámpago: 15% OFF Extra"
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Mensaje / Cuerpo de la Notificación</label>
                <textarea
                  required
                  rows={3}
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  placeholder="Ej: Solo por hoy, agrega un juego de peines gratis a tu pedido..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Notificación Push Inmediata</span>
              </button>

              {pushSentAlert && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl text-xs font-bold text-center">
                  ¡Notificación push emitida a los usuarios conectados!
                </div>
              )}
            </form>

            {/* History of Sent notifications */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-black tracking-wider text-zinc-400">
                Historial de Notificaciones Emitidas:
              </h4>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-[#111] border border-white/10 rounded-xl text-xs flex justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{n.title}</p>
                      <p className="text-zinc-400 text-[11px]">{n.body}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{n.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: GESTIÓN DE RESEÑAS DE CLIENTES ================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Hidden file input for uploading review images */}
            <input
              type="file"
              ref={reviewFileInputRef}
              onChange={handleReviewFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Gestión de Reseñas de Clientes ({editableReviews.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Edita textos, fotos, calificaciones y datos de cada testimonio. Los cambios se aplicarán de inmediato en la tienda.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleResetReviewsToCode}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Recarga las reseñas originales desde src/initialData.ts y limpia la memoria local"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sincronizar con initialData.ts (Código)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddReview}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nueva Reseña</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllReviews}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Reseñas</span>
                </button>
              </div>
            </div>

            {/* Success Notifications */}
            {reviewsSavedAlert && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>¡Todas las reseñas fueron actualizadas y guardadas con éxito! Ya están visibles en la tienda.</span>
              </div>
            )}

            {reviewsResetAlert && (
              <div className="p-4 bg-blue-500/20 border border-blue-500 text-blue-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                <span>¡Reseñas restablecidas con éxito desde el archivo initialData.ts! La memoria local fue actualizada.</span>
              </div>
            )}

            {/* Informational Guidance Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200/90 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <span>💡 ¿Cómo cambiar las fotos y textos de las reseñas?</span>
              </p>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                • <strong>Directo desde el Panel:</strong> Puedes cambiar el nombre, comentario y pegar cualquier URL de imagen o hacer clic en <strong>"Subir Foto desde PC"</strong> en cada reseña a continuación.
              </p>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                • <strong>Desde el archivo de código:</strong> Si modificas los textos o URLs en el archivo <code className="bg-black/50 px-1 py-0.5 rounded text-amber-400">src/initialData.ts</code>, haz clic en el botón <strong>"Sincronizar con initialData.ts (Código)"</strong> de arriba para recargarlos de inmediato.
              </p>
            </div>

            {/* Reviews Cards List */}
            <div className="space-y-5">
              {editableReviews.map((rev, index) => (
                <div
                  key={rev.id || `rev-${index}`}
                  className="p-5 bg-[#18181B] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all shadow-md"
                >
                  {/* Review Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-mono font-bold text-amber-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {rev.author || 'Sin Nombre'}
                      </span>
                      {rev.imageUrl ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                          📸 Con Foto
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full">
                          Solo Texto
                        </span>
                      )}
                      {rev.verifiedBuyer && (
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/30">
                          ✓ Verificado
                        </span>
                      )}
                    </div>

                    {/* Ordering & Delete Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveReview(index, 'up')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg text-zinc-300 transition-colors cursor-pointer"
                        title="Mover arriba"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === editableReviews.length - 1}
                        onClick={() => handleMoveReview(index, 'down')}
                        className="p-1.5 bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg text-zinc-300 transition-colors cursor-pointer"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(index)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer ml-1"
                        title="Eliminar esta reseña"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Nombre del Cliente / Autor
                      </label>
                      <input
                        type="text"
                        value={rev.author}
                        onChange={(e) => handleUpdateReviewField(index, 'author', e.target.value)}
                        placeholder="Ej: Martín Barber"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Ciudad / Ubicación
                      </label>
                      <input
                        type="text"
                        value={rev.location}
                        onChange={(e) => handleUpdateReviewField(index, 'location', e.target.value)}
                        placeholder="Ej: Buenos Aires (Palermo)"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Rol / Ocupación (Opcional)
                      </label>
                      <input
                        type="text"
                        value={rev.role || ''}
                        onChange={(e) => handleUpdateReviewField(index, 'role', e.target.value)}
                        placeholder="Ej: Barbero Profesional"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Fecha / Antigüedad
                      </label>
                      <input
                        type="text"
                        value={rev.date}
                        onChange={(e) => handleUpdateReviewField(index, 'date', e.target.value)}
                        placeholder="Ej: Hace 2 días"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Rating & Verified Buyer Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-zinc-400">Calificación:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleUpdateReviewField(index, 'rating', star)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title={`${star} estrellas`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-zinc-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {rev.rating} / 5
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rev.verifiedBuyer}
                        onChange={(e) => handleUpdateReviewField(index, 'verifiedBuyer', e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-zinc-800 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-300">
                        Badge de "Comprador Verificado"
                      </span>
                    </label>
                  </div>

                  {/* Title & Comment Row */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Título de la Reseña
                      </label>
                      <input
                        type="text"
                        value={rev.title}
                        onChange={(e) => handleUpdateReviewField(index, 'title', e.target.value)}
                        placeholder="Ej: Increíble potencia y cero tirones..."
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Comentario / Opinión Detallada
                      </label>
                      <textarea
                        rows={3}
                        value={rev.comment}
                        onChange={(e) => handleUpdateReviewField(index, 'comment', e.target.value)}
                        placeholder="Escribe la reseña que leerán tus compradores..."
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Image Management Section */}
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-3">
                    <label className="block text-[11px] font-bold text-zinc-300">
                      Foto de la Reseña (Imagen del Cliente / Producto)
                    </label>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Image Thumbnail Preview */}
                      <div className="relative w-20 h-20 rounded-xl bg-zinc-900 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                        {rev.imageUrl ? (
                          <img
                            src={rev.imageUrl}
                            alt={rev.author}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-zinc-500 text-center px-1">
                            Sin foto
                          </span>
                        )}
                      </div>

                      {/* Inputs & Upload triggers */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={rev.imageUrl || ''}
                            onChange={(e) => handleUpdateReviewField(index, 'imageUrl', e.target.value)}
                            placeholder="Pega la URL directa de la imagen (https://...)"
                            className="flex-1 bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleTriggerReviewUpload(index)}
                            disabled={uploadingReviewIdx === index}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                          >
                            {uploadingReviewIdx === index ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Subiendo...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Subir Foto</span>
                              </>
                            )}
                          </button>

                          {rev.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReviewField(index, 'imageUrl', '')}
                              className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                              title="Quitar foto de esta reseña"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Quitar</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-500">
                          Puedes subir una foto desde tu equipo (se optimiza y guarda permanentemente) o pegar cualquier link directo de internet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleSaveAllReviews}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Todas las Reseñas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: DETALLE Y GESTIÓN DE ENVÍO / RASTREO REAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Gestión de Despacho y Seguimiento Real
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Pedido #{selectedOrder.trackingCode}
                </h3>
                <p className="text-xs text-zinc-400">
                  Comprador: <strong className="text-white">{selectedOrder.customerName}</strong> • {selectedOrder.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleNotifyCustomerWhatsApp(selectedOrder)}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> Notificar WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedOrder.externalTrackingUrl) {
                    window.open(selectedOrder.externalTrackingUrl, '_blank');
                  } else {
                    const url = selectedOrder.carrier?.toLowerCase().includes('correo')
                      ? `https://www.correoargentino.com.ar/formularios/e-commerce?id=${selectedOrder.externalTrackingNumber || selectedOrder.trackingCode}`
                      : `https://www.andreani.com/#!/informacionEnvio/${selectedOrder.externalTrackingNumber || selectedOrder.trackingCode}`;
                    window.open(url, '_blank');
                  }
                }}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Rastrear Correo ↗
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintRemitoOrder(selectedOrder);
                }}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Remito
              </button>
            </div>

            {/* Carrier & Tracking Code Form */}
            <div className="p-5 bg-[#18181B] border border-white/10 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Datos de Empresa de Correo & Guía Oficial
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Empresa de Correo / Logística</label>
                  <select
                    value={selectedOrder.carrier || 'Andreani'}
                    onChange={(e) => {
                      const newCarrier = e.target.value;
                      const trackingNo = selectedOrder.externalTrackingNumber || selectedOrder.trackingCode;
                      const defaultUrl = newCarrier.toLowerCase().includes('correo')
                        ? `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingNo}`
                        : newCarrier.toLowerCase().includes('andreani')
                        ? `https://www.andreani.com/#!/informacionEnvio/${trackingNo}`
                        : `https://tracking.oca.com.ar/`;

                      setSelectedOrder({
                        ...selectedOrder,
                        carrier: newCarrier,
                        externalTrackingUrl: defaultUrl
                      });
                    }}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Andreani">Andreani</option>
                    <option value="Correo Argentino">Correo Argentino</option>
                    <option value="OCA">OCA</option>
                    <option value="Moto Mensajería Privada">Moto Mensajería Privada (CABA/GBA)</option>
                    <option value="Retiro en Sucursal BB IMPORT">Retiro en Sucursal BB IMPORT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Número de Guía Oficial del Correo</label>
                  <input
                    type="text"
                    placeholder="Ej: 360000849201948"
                    value={selectedOrder.externalTrackingNumber || ''}
                    onChange={(e) => {
                      const newNum = e.target.value;
                      const carrier = selectedOrder.carrier || 'Andreani';
                      const defaultUrl = carrier.toLowerCase().includes('correo')
                        ? `https://www.correoargentino.com.ar/formularios/e-commerce?id=${newNum}`
                        : `https://www.andreani.com/#!/informacionEnvio/${newNum}`;

                      setSelectedOrder({
                        ...selectedOrder,
                        externalTrackingNumber: newNum,
                        externalTrackingUrl: defaultUrl
                      });
                    }}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Enlace Directo de Seguimiento Oficial</label>
                <input
                  type="url"
                  placeholder="https://www.andreani.com/#!/informacionEnvio/..."
                  value={selectedOrder.externalTrackingUrl || ''}
                  onChange={(e) => setSelectedOrder({ ...selectedOrder, externalTrackingUrl: e.target.value })}
                  className="w-full bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Estado de Entrega</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value as OrderStatus })}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="En Preparación">En Preparación</option>
                    <option value="En Tránsito">En Tránsito</option>
                    <option value="En Reparto">En Reparto</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Fecha de Despacho</label>
                  <input
                    type="text"
                    placeholder="Ej: Hoy 10:30 hs o 2026-09-05"
                    value={selectedOrder.dispatchDate || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, dispatchDate: e.target.value })}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSelectedOrder}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" /> Guardar Información de Guía y Envío
              </button>
            </div>

            {/* Add New Milestone */}
            <div className="p-5 bg-[#18181B] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Agregar Hito al Historial en Tiempo Real
              </h4>
              <p className="text-[11px] text-zinc-400">
                Este mensaje se reflejará de inmediato en la pantalla de seguimiento del cliente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">Estado</label>
                  <select
                    value={newTimelineStatus}
                    onChange={(e) => setNewTimelineStatus(e.target.value as OrderStatus)}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="En Preparación">En Preparación</option>
                    <option value="En Tránsito">En Tránsito</option>
                    <option value="En Reparto">En Reparto</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">Descripción del Movimiento</label>
                  <input
                    type="text"
                    placeholder="Ej: Paquete clasificado en centro logístico..."
                    value={newTimelineDesc}
                    onChange={(e) => setNewTimelineDesc(e.target.value)}
                    className="w-full bg-[#111] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ubicación (Ej: Planta Logística Andreani Avellaneda)"
                  value={newTimelineLoc}
                  onChange={(e) => setNewTimelineLoc(e.target.value)}
                  className="flex-1 bg-[#111] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTimelineMilestone}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  + Agregar Hito
                </button>
              </div>

              {/* Timeline list */}
              <div className="pt-2 space-y-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Línea de tiempo actual ({selectedOrder.timeline.length}):</span>
                {selectedOrder.timeline.map((evt, idx) => (
                  <div key={idx} className="p-2 bg-[#111] rounded-lg text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-amber-400">{evt.status}</span>: {evt.description}
                      {evt.location && <span className="text-zinc-500 block text-[10px]">📍 {evt.location}</span>}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{evt.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Info */}
            <div className="p-4 bg-[#18181B] border border-white/10 rounded-2xl text-xs space-y-1">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Datos de Entrega</span>
              <p><strong className="text-white">Dirección:</strong> {selectedOrder.address}, {selectedOrder.city} ({selectedOrder.postalCode || 'CP s/d'})</p>
              <p><strong className="text-white">Email:</strong> {selectedOrder.email}</p>
              <p><strong className="text-white">Total:</strong> ${selectedOrder.total.toLocaleString('es-AR')} ({selectedOrder.paymentMethod})</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REMITO OFICIAL IMPRIMIBLE BB IMPORT ================= */}
      {printRemitoOrder && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-black max-w-xl w-full p-8 rounded-2xl shadow-2xl space-y-6 font-sans">
            {/* Remito Header */}
            <div className="border-b-2 border-black pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black tracking-tighter">BB IMPORT</h2>
                <p className="text-xs uppercase font-bold tracking-wider text-zinc-600">
                  Herramientas Profesionales de Barbería
                </p>
                <p className="text-[10px] text-zinc-500">
                  {content.whatsappNumber ? `WhatsApp: ${content.whatsappNumber}` : 'Buenos Aires, Argentina'}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-black text-white font-mono font-bold text-xs uppercase">
                  REMITO OFICIAL DE DESPACHO
                </span>
                <p className="text-xs font-mono font-bold mt-1">Nº {printRemitoOrder.trackingCode}</p>
                <p className="text-[10px] text-zinc-500">
                  Fecha: {new Date(printRemitoOrder.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            {/* Destinatario Details */}
            <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-300 text-xs space-y-1">
              <div className="font-bold text-zinc-800 uppercase tracking-wider text-[10px] border-b border-zinc-200 pb-1 mb-2">
                Datos de Entrega y Destinatario:
              </div>
              <p><strong className="text-zinc-700">Destinatario:</strong> {printRemitoOrder.customerName}</p>
              <p><strong className="text-zinc-700">Teléfono:</strong> {printRemitoOrder.phone}</p>
              <p><strong className="text-zinc-700">Dirección:</strong> {printRemitoOrder.address}</p>
              <p><strong className="text-zinc-700">Ciudad / Provincia:</strong> {printRemitoOrder.city} {printRemitoOrder.postalCode ? `(CP: ${printRemitoOrder.postalCode})` : ''}</p>
              <p><strong className="text-zinc-700">Transporte / Correo:</strong> {printRemitoOrder.carrier || 'Andreani'} (Guía: {printRemitoOrder.externalTrackingNumber || printRemitoOrder.trackingCode})</p>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-200 text-zinc-800 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Cant.</th>
                    <th className="p-2.5">Artículo / Variante</th>
                    <th className="p-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {printRemitoOrder.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold font-mono">{it.quantity}x</td>
                      <td className="p-2.5">
                        <span className="font-bold">{it.bundleTitle || it.productName}</span>
                        <span className="block text-[10px] text-zinc-600">Variante: {it.variantName}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        ${(it.price * it.quantity).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total & Payment Method */}
            <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
              <div>
                <span className="font-bold text-zinc-700">Condición de Pago: </span>
                <span className="uppercase font-bold text-black">{printRemitoOrder.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">TOTAL A COBRAR / DECLARADO</span>
                <span className="text-xl font-black font-mono text-black">
                  ${printRemitoOrder.total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Receptor Signature Field */}
            <div className="pt-6 border-t border-dashed border-zinc-400 grid grid-cols-2 gap-8 text-[11px]">
              <div>
                <div className="border-b border-black h-12"></div>
                <p className="pt-1 text-center font-bold text-zinc-700">Firma del Receptor</p>
              </div>
              <div>
                <div className="border-b border-black h-12"></div>
                <p className="pt-1 text-center font-bold text-zinc-700">Aclaración y DNI</p>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setPrintRemitoOrder(null)}
                className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" /> Imprimir Remito Oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
