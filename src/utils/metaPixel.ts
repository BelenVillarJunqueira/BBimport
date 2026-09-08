/**
 * Meta Ads / Facebook Pixel Integration Engine for BB IMPORT
 * Full tracking suite for Meta Ads campaigns: PageView, ViewContent, AddToCart,
 * InitiateCheckout, AddPaymentInfo, Purchase, Lead, and Contact.
 */

declare global {
    interface Window {
        fbq?: any;
        _fbq?: any;
    }
}

export interface MetaEventLog {
    id: string;
    timestamp: string;
    eventName: string;
    params?: Record<string, any>;
    status: 'sent' | 'simulated' | 'failed';
    pixelId: string;
}

let activePixelId: string = '';
let isInitialized: boolean = false;
const eventLogs: MetaEventLog[] = [];
const subscribers: Array<(logs: MetaEventLog[]) => void> = [];

function notifySubscribers() {
    subscribers.forEach((cb) => {
        try {
            cb([...eventLogs]);
        } catch {
            // ignore
        }
    });
}

/**
 * Log internal event to in-memory list for live admin inspection
 */
function recordEventLog(eventName: string, params?: Record<string, any>, status: 'sent' | 'simulated' | 'failed' = 'sent') {
    const log: MetaEventLog = {
        id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour12: false }),
        eventName,
        params,
        status,
        pixelId: activePixelId || 'No configurado'
    };

    eventLogs.unshift(log);
    if (eventLogs.length > 60) {
        eventLogs.pop();
    }

    notifySubscribers();
}

/**
 * Get active pixel ID from localStorage, env, or argument
 */
export function resolveMetaPixelId(customId?: string): string {
    if (customId && customId.trim().length > 0) {
        return customId.trim();
    }
    try {
        const local = localStorage.getItem('bbimport_meta_pixel_id');
        if (local && local.trim().length > 0) return local.trim();
    } catch {
        // ignore
    }

    const envId = (import.meta as any).env?.VITE_META_PIXEL_ID;
    if (envId && typeof envId === 'string' && envId.trim().length > 0) {
        return envId.trim();
    }

    return '';
}

/**
 * Injects official Meta Pixel script into document head if not present
 */
function injectMetaScript(): void {
    if (typeof window === 'undefined') return;

    if (!window.fbq) {
        const n: any = function () {
            if (n.callMethod) {
                n.callMethod.apply(n, arguments);
            } else {
                n.queue.push(arguments);
            }
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        window.fbq = n;

        // Create script tag
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        script.onerror = () => {
            console.warn('[Meta Pixel] Warning: fbevents.js could not be downloaded (e.g. adblocker active). Events will be buffered safely.');
        };
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }
    }
}

/**
 * Initialize Meta Pixel with a specific Pixel ID or default
 */
export function initMetaPixel(pixelId?: string): void {
    if (typeof window === 'undefined') return;

    const targetId = resolveMetaPixelId(pixelId);

    // If already initialized with this exact ID, return
    if (isInitialized && activePixelId === targetId) {
        return;
    }

    injectMetaScript();

    if (targetId) {
        activePixelId = targetId;
        try {
            localStorage.setItem('bbimport_meta_pixel_id', targetId);
        } catch {
            // safe
        }

        try {
            window.fbq('init', targetId);
            window.fbq('track', 'PageView');
            isInitialized = true;
            console.log(`%c[Meta Pixel 🎯]%c Inicializado exitosamente con ID: %c${targetId}`, 'background: #1877F2; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;', 'color: inherit;', 'color: #00d26a; font-weight: bold;');
            recordEventLog('PageView', { note: 'Auto-track on init' }, 'sent');
        } catch (err: any) {
            console.warn('[Meta Pixel] Error during init:', err);
            recordEventLog('PageView', { error: err.message }, 'failed');
        }
    } else {
        // Mode without ID yet configured
        isInitialized = true;
        console.log('%c[Meta Pixel 🎯]%c Motor de eventos preparado. Esperando ingreso de Pixel ID en Panel Admin.', 'background: #1877F2; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;', 'color: #f59e0b;');
    }
}

/**
 * Core event dispatcher
 */
export function trackMetaEvent(eventName: string, params?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    const hasFbq = typeof window.fbq === 'function';
    const hasPixel = !!activePixelId;

    if (hasFbq && hasPixel) {
        try {
            if (params) {
                window.fbq('track', eventName, params);
            } else {
                window.fbq('track', eventName);
            }
            console.log(`%c[Meta Pixel 🎯] %c${eventName}`, 'background: #1877F2; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', 'color: #3b82f6; font-weight: bold;', params || '');
            recordEventLog(eventName, params, 'sent');
        } catch (err: any) {
            console.warn(`[Meta Pixel] Error sending event ${eventName}:`, err);
            recordEventLog(eventName, params, 'failed');
        }
    } else {
        // In dev / preview before pixel ID is configured, simulate and log so user can see it works
        console.log(`%c[Meta Pixel (Simulado) 🎯] %c${eventName}`, 'background: #475569; color: white; padding: 2px 4px; border-radius: 3px;', 'color: #94a3b8; font-weight: bold;', params || '(Agrega tu Pixel ID en el Panel Admin para enviarlo a Meta)');
        recordEventLog(eventName, params, 'simulated');
    }
}

/**
 * Standard Events
 */

export function trackMetaPageView(customData?: Record<string, any>): void {
    trackMetaEvent('PageView', customData);
}

export function trackMetaViewContent(params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    [key: string]: any;
}): void {
    trackMetaEvent('ViewContent', {
        content_type: 'product',
        currency: 'ARS',
        ...params
    });
}

export function trackMetaAddToCart(params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    quantity?: number;
    [key: string]: any;
}): void {
    trackMetaEvent('AddToCart', {
        content_type: 'product',
        currency: 'ARS',
        quantity: 1,
        ...params
    });
}

export function trackMetaInitiateCheckout(params: {
    content_name?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    num_items?: number;
    [key: string]: any;
}): void {
    trackMetaEvent('InitiateCheckout', {
        currency: 'ARS',
        ...params
    });
}

export function trackMetaAddPaymentInfo(params: {
    payment_type: string;
    value?: number;
    currency?: string;
    [key: string]: any;
}): void {
    trackMetaEvent('AddPaymentInfo', {
        currency: 'ARS',
        ...params
    });
}

export function trackMetaPurchase(params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value: number;
    currency?: string;
    num_items?: number;
    order_id: string;
    [key: string]: any;
}): void {
    trackMetaEvent('Purchase', {
        content_type: 'product',
        currency: 'ARS',
        ...params
    });
}

export function trackMetaLead(params?: Record<string, any>): void {
    trackMetaEvent('Lead', params);
}

export function trackMetaContact(params?: { method?: string;[key: string]: any }): void {
    trackMetaEvent('Contact', params);
}

export function trackMetaCustom(customEventName: string, params?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    const hasFbq = typeof window.fbq === 'function';
    const hasPixel = !!activePixelId;

    if (hasFbq && hasPixel) {
        try {
            window.fbq('trackCustom', customEventName, params);
            console.log(`%c[Meta Custom 🎯] %c${customEventName}`, 'background: #8b5cf6; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', 'color: #a855f7; font-weight: bold;', params || '');
            recordEventLog(`Custom: ${customEventName}`, params, 'sent');
        } catch (err: any) {
            recordEventLog(`Custom: ${customEventName}`, params, 'failed');
        }
    } else {
        recordEventLog(`Custom: ${customEventName}`, params, 'simulated');
    }
}

/**
 * Event Logs management for live dashboard inspection
 */
export function getMetaPixelEventLogs(): MetaEventLog[] {
    return [...eventLogs];
}

export function clearMetaPixelEventLogs(): void {
    eventLogs.length = 0;
    notifySubscribers();
}

export function subscribeToMetaEvents(cb: (logs: MetaEventLog[]) => void): () => void {
    subscribers.push(cb);
    cb([...eventLogs]);
    return () => {
        const idx = subscribers.indexOf(cb);
        if (idx !== -1) subscribers.splice(idx, 1);
    };
}

export function getActiveMetaPixelId(): string {
    return activePixelId;
}
