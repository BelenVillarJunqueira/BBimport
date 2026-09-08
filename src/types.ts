export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  colorHex: string;
  inStock: boolean;
  stockCount: number;
  badge?: string;
  imageIdx?: number;
}

export interface BundleOffer {
  id: string;
  title: string;
  subtitle: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  popular?: boolean;
  badge?: string;
}

export type OrderStatus =
  | 'Pendiente'
  | 'Confirmado'
  | 'En Preparación'
  | 'En Tránsito'
  | 'En Reparto'
  | 'Entregado'
  | 'Cancelado';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  location: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  bundleTitle?: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'contra_entrega' | 'transferencia' | 'mercadopago' | 'tarjeta';
  paymentStatus: 'Aprobado' | 'Pendiente de Comprobante' | 'A Cobrar al Entregar' | 'Preferencia Generada' | 'Pendiente';
  status: OrderStatus;
  createdAt: string;
  timeline: OrderTimelineEvent[];
  carrier: string;
  estimatedDelivery: string;
  externalTrackingNumber?: string;
  externalTrackingUrl?: string;
  dispatchDate?: string;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  role?: string;
  imageUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StoreContent {
  storeName: string;
  tagline: string;
  topBannerText: string;
  productTitle: string;
  productSubtitle: string;
  badgeTag: string;
  regularPrice: number;
  salePrice: number;
  currencySymbol: string;
  currencyCode: string;
  urgencyViewers: number;
  stockLeft: number;
  guaranteeDays: number;
  guaranteeTitle: string;
  guaranteeDescription: string;
  shippingHeadline: string;
  shippingSubtext: string;
  motorSpecs: string;
  batterySpecs: string;
  bladesSpecs: string;
  ergonomicsSpecs: string;
  boxIncludes: string[];
  instagramUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  facebookPage?: string;
  whatsappNumber?: string;
  supportEmail?: string;
  metaPixelId?: string;
  metaPixelEnabled?: boolean;
}

export interface MercadoPagoSettings {
  publicKey: string;
  accessToken: string;
  paymentLinkUrl?: string;
  mpAliasOrCvu?: string;
  environment: 'production' | 'sandbox';
  installmentsMax: number;
}

export interface BankSettings {
  bankName: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cuit: string;
  instructions: string;
}

export interface GatewaySettings {
  enableMercadoPago: boolean;
  enableCod: boolean;
  enableTransfer: boolean;
  enableCards: boolean;
  mercadoPago: MercadoPagoSettings;
  bank: BankSettings;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  linkText?: string;
}
