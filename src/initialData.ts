import { BundleOffer, GatewaySettings, MediaItem, Order, ProductVariant, Review, StoreContent } from './types';

export const initialMedia: MediaItem[] = [
  {
    id: 'media-1788641987383-1awt',
    type: 'image',
    url: '/uploads/media-1788641987383-1awt.webp',
    title: 'Kit Completo EXXTRA TECH - BB IMPORT',
    alt: 'Máquina cortadora EXXTRA TECH Barber Pro kit completo'
  },
  {
    id: 'media-1788721814982-oydm',
    type: 'image',
    url: '/uploads/media-1788721815153-p1sjl.jpeg',
    title: 'Corte y Perfilado de Alta Precisión',
    alt: 'Detalle de corte degradado y fade profesional'
  },
  {
    id: 'media-1788642092496-maao',
    type: 'image',
    url: '/uploads/media-1788642092496-maao.webp',
    title: 'Cuchillas T-Blade Acero Carbono Zero-Gap',
    alt: 'Cabezal T-Blade para corte al ras 0mm'
  },
  {
    id: 'media-1788642063456-2sps',
    type: 'image',
    url: '/uploads/media-1788642063456-2sps.webp',
    title: 'Perfilado de Barba y Patillas',
    alt: 'Perfilado nítido al ras sin irritación'
  },
  {
    id: 'media-1788642043761-5s0w',
    type: 'image',
    url: '/uploads/media-1788642043761-5s0w.webp',
    title: 'Presentación Oficial BB IMPORT',
    alt: 'Cortadora BB IMPORT profesional'
  },
  {
    id: 'media-1788723814416-7z7q',
    type: 'image',
    url: '/uploads/media-1788723814677-q75fs.jpeg',
    title: 'Cuerpo Metálico Ergonómico Antideslizante',
    alt: 'Textura antideslizante con agarre firme'
  },
  {
    id: 'media-1788645273754-5m7v',
    type: 'video',
    url: '/uploads/media-1788645273759-uqv5n.mp4',
    title: 'Video Demostrativo EXXTRA TECH',
    alt: 'Video en acción de la cortadora EXXTRA TECH'
  }
];

export const initialVariants: ProductVariant[] = [
  {
    id: 'var-black',
    name: 'Negro Matte (Titanium Black)',
    colorHex: '#18181B',
    inStock: true,
    stockCount: 14,
    badge: 'MÁS ELEGIDO',
    imageIdx: 0
  },
  {
    id: 'var-red',
    name: 'Rojo Carmín (Sport Racing)',
    colorHex: '#DC2626',
    inStock: true,
    stockCount: 6,
    badge: 'ÚLTIMAS UNIDADES',
    imageIdx: 1
  },
  {
    id: 'var-blue',
    name: 'Azul Eléctrico (Deep Ocean)',
    colorHex: '#2563EB',
    inStock: true,
    stockCount: 9,
    imageIdx: 2
  },
  {
    id: 'var-yellow',
    name: 'Amarillo Neón (Gold Special Edition)',
    colorHex: '#EAB308',
    inStock: true,
    stockCount: 5,
    badge: 'EDICIÓN LIMITADA',
    imageIdx: 3
  }
];

export const initialBundles: BundleOffer[] = [
  {
    id: 'bundle-1',
    title: '1x Máquina EXXTRA TECH™ EX5',
    subtitle: 'Incluye Kit Completo (4 peines + cable USB + aceite + cepillo)',
    quantity: 1,
    price: 29999,
    originalPrice: 39999,
    discountPercentage: 40,
    badge: 'OFERTA INDIVIDUAL'
  },
  {
    id: 'bundle-2',
    title: '2x Máquinas EXXTRA TECH™ EX5 (Pack Dúo)',
    subtitle: 'El favorito de Barberos y Regalos. Ahorras $49.990 extra',
    quantity: 2,
    price: 54999,
    originalPrice: 75999,
    discountPercentage: 40,
    popular: true,
    badge: 'MEJOR VALOR ⭐ (40% OFF)'
  },
  {
    id: 'bundle-3',
    title: '1x Máquina EXXTRA TECH™ EX5 + Loción post afeitado',
    subtitle: 'Loción post afeitada profesional para piel sensible, 100ml',
    quantity: 1,
    price: 41999,
    originalPrice: 59999,
    discountPercentage: 40,
    badge: 'COMBO PROFESIONAL'
  }
];

export const initialStoreContent: StoreContent = {
  storeName: 'BB IMPORT',
  tagline: 'Línea de Barbería & Peluquería Profesional',
  topBannerText: '🚚 ENVÍO GRATIS A TODO EL PAÍS (PAGAS AL RECIBIR) | ⚡ 40% OFF HASTA AGOTAR STOCK | 🔒 COMPRA 100% GARANTIZADA',
  productTitle: 'Máquina Cortadora y Patillera EXXTRA TECH™ EX5 ',
  productSubtitle: 'Corte al ras 0mm, degradados perfectos y perfilado de barba profesional con motor magnético silencioso de 7.000 RPM.',
  badgeTag: 'N° 1 EN VENTAS PARA BARBEROS',
  regularPrice: 39999,
  salePrice: 29999,
  currencySymbol: '$',
  currencyCode: 'ARS',
  urgencyViewers: 34,
  stockLeft: 8,
  guaranteeDays: 30,
  guaranteeTitle: 'Garantía Blindada de 30 Días BB IMPORT',
  guaranteeDescription: 'Prueba la EXXTRA TECH™ en tu casa o barbería. Si no supera tus expectativas de corte, potencia y duración de batería, te devolvemos el 100% de tu dinero sin preguntas.',
  shippingHeadline: 'Despacho Exprés Inmediato con Seguro de Entrega',
  shippingSubtext: 'Enviamos a cualquier rincón del país por Correo Argentino / Andreani con código de rastreo en tiempo real.',
  motorSpecs: 'Motor rotativo turbo de 7.000 RPM con tecnología de torque constante, sin frenarse en cabellos gruesos.',
  batterySpecs: 'Batería de Iones de Litio de 1500mAh con 200 minutos de uso continuo y carga rápida USB Tipo C.',
  bladesSpecs: 'Cuchillas T-Blade en Acero al Carbono autoafilables con tratamiento térmico anti-calentamiento.',
  ergonomicsSpecs: 'Cuerpo aerodinámico texturizado antideslizante con hendidura ergonómica para el pulgar y luz LED indicadora.',
  boxIncludes: [
    '1x Máquina Cortadora / Patillera EXXTRA TECH™',
    '4x Peines Guía de Límite (1.5mm, 3mm, 6mm, 9mm)',
    '1x Cable de Carga Rápida USB',
    '1x Cepillo Especial Limpiador de Cerdas Finas',
    '1x Frasco Gotero de Aceite Lubricante para Cuchillas',
    '1x Manual Oficial de Uso & Certificado de Garantía BB IMPORT'
  ],
  instagramUrl: 'https://www.instagram.com/bigboss_import/',
  instagramHandle: '@bigboss_import',
  facebookUrl: '',
  facebookPage: '',
  whatsappNumber: '+54 9 3515 05-6742',
  supportEmail: 'bigbossimportaciones@gmail.com'
};

export const initialOrders: Order[] = [
  {
    id: 'ord-1001',
    trackingCode: 'BB-784291',
    customerName: 'Juan Carlos Gómez',
    email: 'jc.gomez@gmail.com',
    phone: '+54 9 11 4821-9932',
    address: 'Av. Corrientes 3421, Piso 4B',
    city: 'Buenos Aires (CABA)',
    postalCode: 'C1193',
    items: [
      {
        productId: 'prod-1',
        productName: 'Máquina Cortadora EXXTRA TECH™ EX5',
        variantName: 'Negro Matte (Titanium Black)',
        quantity: 1,
        price: 29999,
        bundleTitle: '1x Máquina EXXTRA TECH™ EX5'
      }
    ],
    subtotal: 29999,
    shippingCost: 0,
    total: 29999,
    paymentMethod: 'contra_entrega',
    paymentStatus: 'A Cobrar al Entregar',
    status: 'En Tránsito',
    createdAt: '2026-09-04T15:30:00.000Z',
    carrier: 'Andreani',
    estimatedDelivery: '2026-09-06',
    externalTrackingNumber: '360000849201948',
    externalTrackingUrl: 'https://www.andreani.com/#!/informacionEnvio/360000849201948',
    dispatchDate: '05 Sep 2026',
    timeline: [
      {
        status: 'Pendiente',
        timestamp: '04 Sep, 15:30',
        description: 'Orden recibida en sistema BB IMPORT',
        location: 'Centro Logístico Central'
      },
      {
        status: 'Confirmado',
        timestamp: '04 Sep, 15:45',
        description: 'Datos de envío validados y confirmados por WhatsApp',
        location: 'Oficinas BB IMPORT'
      },
      {
        status: 'En Preparación',
        timestamp: '04 Sep, 17:20',
        description: 'Kit embalado, testeado y protegido con burbuja anti-impacto',
        location: 'Depósito Buenos Aires'
      },
      {
        status: 'En Tránsito',
        timestamp: '05 Sep, 08:15',
        description: 'Despachado en unidad de distribución troncal hacia destino',
        location: 'Centro de Distribución Andreani CABA'
      }
    ]
  },
  {
    id: 'ord-1002',
    trackingCode: 'BB-9921-X',
    customerName: 'Mariano Silva (Barbería El Galpón)',
    email: 'mariano.silva@hotmail.com',
    phone: '+54 9 351 554-1290',
    address: 'Calle Belgrano 812',
    city: 'Córdoba Capital',
    postalCode: 'X5000',
    items: [
      {
        productId: 'prod-1',
        productName: 'Pack Dúo 2x EXXTRA TECH™ EX5',
        variantName: 'Rojo Carmín + Negro Matte',
        quantity: 2,
        price: 59998,
        bundleTitle: '2x Máquinas EXXTRA TECH™ EX5 (Pack Dúo)'
      }
    ],
    subtotal: 59998,
    shippingCost: 0,
    total: 59998,
    paymentMethod: 'transferencia',
    paymentStatus: 'Aprobado',
    status: 'En Reparto',
    createdAt: '2026-09-03T11:10:00.000Z',
    carrier: 'Correo Argentino',
    estimatedDelivery: '2026-09-05 (Hoy)',
    externalTrackingNumber: 'SD849201938AR',
    externalTrackingUrl: 'https://www.correoargentino.com.ar/formularios/e-commerce?id=SD849201938AR',
    dispatchDate: '04 Sep 2026',
    timeline: [
      {
        status: 'Confirmado',
        timestamp: '03 Sep, 11:15',
        description: 'Pago por transferencia verificado con comprobante',
        location: 'Administración BB IMPORT'
      },
      {
        status: 'En Preparación',
        timestamp: '03 Sep, 13:00',
        description: 'Preparación de lote profesional de 2 unidades',
        location: 'Depósito Central'
      },
      {
        status: 'En Tránsito',
        timestamp: '04 Sep, 06:40',
        description: 'En camino a la sucursal de destino en Córdoba',
        location: 'Ruta 9 - Transporte Andreani'
      },
      {
        status: 'En Reparto',
        timestamp: '05 Sep, 09:30',
        description: 'El cartero / repartidor tiene el paquete en la camioneta para entrega',
        location: 'Córdoba Capital - Zona Centro'
      }
    ]
  },
  {
    id: 'ord-1003',
    trackingCode: 'BB-338190',
    customerName: 'Lucas Benítez',
    email: 'lucasb_barber@yahoo.com',
    phone: '+54 9 341 620-8811',
    address: 'San Lorenzo 1450',
    city: 'Rosario, Santa Fe',
    postalCode: 'S2000',
    items: [
      {
        productId: 'prod-1',
        productName: 'Máquina EXXTRA TECH™ EX5',
        variantName: 'Azul Eléctrico (Deep Ocean)',
        quantity: 1,
        price: 29999,
        bundleTitle: '1x Máquina EXXTRA TECH™ EX5'
      }
    ],
    subtotal: 29999,
    shippingCost: 0,
    total: 29999,
    paymentMethod: 'tarjeta',
    paymentStatus: 'Aprobado',
    status: 'Entregado',
    createdAt: '2026-09-01T18:00:00.000Z',
    carrier: 'Andreani',
    estimatedDelivery: '03 Sep 2026',
    externalTrackingNumber: '36000077123901',
    externalTrackingUrl: 'https://www.andreani.com/#!/informacionEnvio/36000077123901',
    dispatchDate: '02 Sep 2026',
    timeline: [
      {
        status: 'Confirmado',
        timestamp: '01 Sep, 18:05',
        description: 'Pago con tarjeta Visa aprobado con código de autorización #884920',
        location: 'Gateway Bancario'
      },
      {
        status: 'En Preparación',
        timestamp: '02 Sep, 09:10',
        description: 'Producto preparado y rotulado con remito #1003',
        location: 'Depósito Central'
      },
      {
        status: 'En Tránsito',
        timestamp: '02 Sep, 14:30',
        description: 'Viajando a Rosario',
        location: 'Centro Logístico'
      },
      {
        status: 'En Reparto',
        timestamp: '03 Sep, 10:20',
        description: 'Repartidor en camino al domicilio',
        location: 'Rosario Centro'
      },
      {
        status: 'Entregado',
        timestamp: '03 Sep, 13:45',
        description: 'Entregado en mano al destinatario. Firma recibida.',
        location: 'Domicilio del Cliente'
      }
    ]
  }
];

export const initialReviews: Review[] = [
  {
    id: 'rev-1',
    author: 'Martín "Tito" Barber',
    location: 'Buenos Aires CABA',
    rating: 5,
    date: 'Hace 2 días',
    title: 'Increíble potencia y cero tirones, la uso 8 horas al día',
    comment: 'Tengo mi barbería en Palermo y compré 2 máquinas para probarlas con los fades más exigentes. El motor vuela, corta al ras sin cortar la piel y la batería me aguanta casi 4 días con uso moderado. Excelente atención de BB IMPORT.',
    verifiedBuyer: true,
    role: 'Barbero Profesional ',
    imageUrl: '/images/review-1.jpg'
  },
  {
    id: 'rev-2',
    author: 'Gonzalo A.',
    location: 'Córdoba Capital',
    rating: 5,
    date: 'Hace 3 días',
    title: 'Llegó en 24hs y pagué en efectivo en mi puerta',
    comment: 'Elegí el pago contra entrega porque desconfiaba un poco de comprar online, pero fue 10/10. Llegó por Andreani, revisé que esté la caja con los 4 peines y el aceite y le pagué al repartidor. La máquina es súper pesada y de calidad, nada de plástico barato.',
    verifiedBuyer: true
  },
  {
    id: 'rev-3',
    author: 'Facundo D.',
    location: 'Rosario',
    rating: 5,
    date: 'Hace 3 semanas',
    title: 'Para perfilar la barba es lo mejor que existe',
    comment: 'Siempre me costaba dejarme los bordes del cuello y las mejillas prolijos con afeitadoras comunes. La patillera EXXTRA TECH deja una línea como con navaja y no irrita para nada. Quedas prolijo y presentable para salir en poco tiempo y sin necesitar un peluquero. Vale cada peso.',
    verifiedBuyer: true,
    imageUrl: '/images/review-2.jpg'
  },
  {
    id: 'rev-4',
    author: 'Ezequiel M.',
    location: 'Mendoza',
    rating: 5,
    date: 'Hace 1 semana',
    title: 'Compré el pack dúo para mi hermano y para mí',
    comment: 'Aprovechamos la promo de 2 unidades y nos ahorramos un montón. El color Rojo y el Negro son hermosos en persona, tienen una terminación satinada genial. Muy contento con la compra.',
    verifiedBuyer: true
  },
  {
    id: 'rev-5',
    author: 'Agustín Pereyra',
    location: 'La Plata',
    rating: 5,
    date: 'Hace 2 semana',
    title: 'Silenciosa y no se calienta la cuchilla',
    comment: 'Muchas patilleras baratas a los 10 minutos hierven en la piel del cliente. Esta mantiene la temperatura baja y el motor no vibra fuerte en la mano. 100% recomendada para colegas peluqueros.',
    verifiedBuyer: true,
    role: 'Peluquero Estilista'
  },
  {
    id: 'rev-6',
    author: 'Claudio V.',
    location: 'Neuquén',
    rating: 4,
    date: 'Hace 1 mes',
    title: 'Excelente máquina, el envío demoró un día más por el correo',
    comment: 'La máquina es una bestia total, tiene un filo impresionante. El correo demoró 72hs en vez de 48hs por el clima acá en el sur, pero la gente de BB IMPORT me atendió rapidísimo por WhatsApp y me pasaron el estado al instante.',
    verifiedBuyer: true
  }
];

export const initialGateways: GatewaySettings = {
  enableMercadoPago: true,
  enableCod: true,
  enableTransfer: true,
  enableCards: true,
  mercadoPago: {
    publicKey: 'APP_USR-fef5e2b4-0495-4fc7-90be-33760c4c04fb',
    accessToken: '',
    paymentLinkUrl: '',
    mpAliasOrCvu: 'beluula.mp',
    environment: 'production',
    installmentsMax: 12
  },
  bank: {
    bankName: 'Banco Galicia',
    accountHolder: 'BB IMPORT S.R.L.',
    cbu: '0070327530004092450465',
    alias: 'rbvillar3.gal',
    cuit: '23-37066549-4',
    instructions: 'Transfiere el monto exacto de la orden a nuestro Alias o CBU oficial. Luego envía el comprobante por WhatsApp o súbelo en el formulario para despacho prioritario.'
  }
};

export const initialFaqs = [
  {
    id: 'faq-1',
    question: '¿Cómo funciona el Pago Contra Entrega?',
    answer: 'Es muy sencillo y seguro: completas tu pedido sin ingresar ninguna tarjeta. Nosotros te enviamos el producto por correo expreso y tú le pagas el monto exacto en efectivo al repartidor cuando toque a tu puerta.'
  },
  {
    id: 'faq-2',
    question: '¿Cuánto demora el envío a mi domicilio?',
    answer: 'Los despachos se realizan en el día hábil. El tiempo estimado de entrega para Capital y Gran Buenos Aires es de 24 a 48 horas. Para el resto de las provincias del país el tiempo es de 48 a 72 horas hábiles con número de seguimiento en vivo.'
  },
  {
    id: 'faq-3',
    question: '¿Qué incluye exactamente la caja del producto?',
    answer: 'La caja oficial incluye: 1 Máquina cortadora EXXTRA TECH™ V2 Pro, 4 peines guía de corte (1.5mm, 3mm, 6mm y 9mm), 1 cable USB de carga rápida, 1 cepillo de limpieza, 1 frasco de aceite lubricante para cuchillas y el manual con garantía oficial de 30 días.'
  },
  {
    id: 'faq-4',
    question: '¿Sirve tanto para cabello como para barba y cuerpo?',
    answer: 'Sí, totalmente. Su cuchilla en forma de T con dientes finos de acero al carbono permite cortes al ras de 0mm en cabello, perfilado nítido de barba, bigote, patillas, cejas y depilación corporal sin cortes ni tirones.'
  },
  {
    id: 'faq-5',
    question: '¿Qué garantía tengo si el producto no me convence?',
    answer: 'Cuentas con la Garantía BB IMPORT de 30 días. Si la máquina tiene algún desperfecto o no estás 100% satisfecho con su rendimiento, te la cambiamos inmediatamente por una nueva o te reembolsamos tu dinero.'
  }
];
