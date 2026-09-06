import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.handleReset = this.handleReset.bind(this);
    this.handleRecoverSafeMode = this.handleRecoverSafeMode.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  // Safe recovery without full wipe: clears heavy media and continues
  public handleRecoverSafeMode() {
    try {
      localStorage.removeItem('bbimport_media');
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  // Full reset if data is heavily corrupted
  public handleReset() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bbimport_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                BB IMPORT • Tienda Oficial
              </h2>
              <p className="text-xs text-zinc-400">
                Se detectó una discrepancia en los datos guardados en tu navegador. Puedes continuar sin perder tu configuración o restaurar la tienda.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-white/10 text-[11px] font-mono text-zinc-400 text-left overflow-x-auto max-h-24">
                  {this.state.error.message || 'Error desconocido'}
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRecoverSafeMode}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Continuar a la Tienda (Modo Seguro)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer y Recargar Tienda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
