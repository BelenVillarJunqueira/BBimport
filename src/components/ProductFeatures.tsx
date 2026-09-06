import React from 'react';
import { Zap, Scissors, BatteryCharging, Sparkles, Check, X, Shield, Award, Gauge } from 'lucide-react';
import { StoreContent } from '../types';

interface ProductFeaturesProps {
  content: StoreContent;
  onBuyNow: () => void;
}

export const ProductFeatures: React.FC<ProductFeaturesProps> = ({ content, onBuyNow }) => {
  const highlights = [
    {
      icon: Zap,
      title: 'POTENTE Y PRECISO',
      subtitle: 'Motor Turbo 7.000 RPM',
      desc: 'Motor magnético con microprocesador de torque constante. Corta cualquier densidad de cabello o barba sin frenarse ni dar tirones.'
    },
    {
      icon: Scissors,
      title: '4 PEINES DE LÍMITE',
      subtitle: '1.5mm / 3mm / 6mm / 9mm',
      desc: 'Incluye peines reforzados de encaje firme para degradados, fades milimétricos y rebaje de barba uniforme con precisión milimétrica.'
    },
    {
      icon: BatteryCharging,
      title: 'BATERÍA DE LARGA DURACIÓN',
      subtitle: '200 min de Autonomía USB',
      desc: 'Batería de Iones de Litio de carga ultra rápida. Permite trabajar durante días enteros de barbería sin preocuparte por cables molestos.'
    },
    {
      icon: Sparkles,
      title: 'DISEÑO ERGONÓMICO',
      subtitle: 'Grip Antideslizante Pro',
      desc: 'Hendidura táctil para el pulgar y ranuras laterales de agarre que evitan resbalones. Ultra liviana para evitar fatiga en muñeca y dedos.'
    }
  ];

  const comparisonRows = [
    {
      feature: 'Cuchillas T-Blade Cero Tirones',
      bbImport: 'Acero al carbono autoafilable (0.0mm)',
      traditional: 'Acero común que pierde filo rápido'
    },
    {
      feature: 'Nivel de Ruido y Vibración',
      bbImport: 'Silencioso (<50dB), motor balanceado',
      traditional: 'Ruidoso y vibración molesta en mano'
    },
    {
      feature: 'Carga Universal USB',
      bbImport: 'Sí (cable USB incluido, carga en PC/Auto)',
      traditional: 'Cables propietarios o solo a 220V'
    },
    {
      feature: 'Peines Guía Incluidos',
      bbImport: '4 peines estándar de barbería (1.5 a 9mm)',
      traditional: '1 o 2 peines frágiles'
    },
    {
      feature: 'Garantía Directa en el País',
      bbImport: '30 Días Garantía',
      traditional: 'Sin soporte ni repuestos locales'
    }
  ];

  return (
    <section id="features-section" className="py-16 sm:py-24 border-t border-white/10 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            TECNOLOGÍA PROFESIONAL DE BARBERÍA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Diseñada Para El Detalle Más Exigente
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            La patillera inalámbrica EXXTRA TECH combina la potencia de las grandes marcas internacionales con la comodidad de una herramienta inalámbrica ligera.
          </p>
        </div>

        {/* 4 Feature Cards (direct from packaging) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#111111] border border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-semibold font-mono mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table Section */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              ¿Por qué elegir EXXTRA TECH?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Compara nuestra tecnología frente a cortadoras genéricas de bajo costo.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Característica</th>
                  <th className="py-3 px-4 font-black text-amber-400 bg-amber-500/10 rounded-t-lg">
                    EXXTRA TECH
                  </th>
                  <th className="py-3 px-4 font-semibold text-zinc-500">
                    Otras Máquinas Genéricas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{row.feature}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-400 bg-amber-500/5">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{row.bbImport}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-500/80 shrink-0" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onBuyNow}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm rounded-xl tracking-tight transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
            >
              Quiero Mi Máquina EXXTRA TECH
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
