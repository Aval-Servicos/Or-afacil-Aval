import React from 'react';
import { ResearchSource, PriceConfidence } from '../types/budget';
import { ExternalLink, CheckCircle2, AlertCircle, ShieldAlert, Globe, Calendar, DollarSign } from 'lucide-react';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: ResearchSource[];
  confidenceLevel: PriceConfidence;
  confidenceReason?: string;
  location?: string;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  confidenceLevel,
  confidenceReason,
  location,
}) => {
  if (!isOpen) return null;

  const getConfidenceBadge = () => {
    switch (confidenceLevel) {
      case 'Alta':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          desc: 'Preços baseados em múltiplas fontes ativas no mercado brasileiro.',
        };
      case 'Média':
        return {
          icon: AlertCircle,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          desc: 'Alguns itens utilizam referências médias estimadas de serviços.',
        };
      case 'Baixa':
      default:
        return {
          icon: ShieldAlert,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          desc: 'Poucas referências diretas encontradas. Recomenda-se conferência manual detalhada.',
        };
    }
  };

  const badge = getConfidenceBadge();
  const Icon = badge.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Fontes e Grounding de Pesquisa</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pesquisa realizada no Google em tempo real no Brasil ({location || 'Nacional'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Confidence Card */}
          <div className={`p-4 rounded-xl border ${badge.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-bold text-sm">Nível de Confiança: {confidenceLevel}</span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              {confidenceReason || badge.desc}
            </p>
          </div>

          {/* Research Information Notice */}
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">Transparência comercial:</span>
            Estes dados são mantidos para conferência interna do orçamentista e não são impressos no PDF final do cliente, garantindo privacidade da sua margem e composição de custos.
          </div>

          {/* Sources List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Fontes Consultadas ({sources.length})
            </h4>

            {sources.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                Nenhuma fonte externa registrada para esta consulta. Valores baseados nas tabelas padrão da sua empresa.
              </div>
            ) : (
              sources.map((src, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-white shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-semibold text-slate-900 text-xs leading-snug">
                      {src.title}
                    </h5>
                    {src.uri && (
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                        title="Abrir página da fonte"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {(src.priceFound || src.priceRange) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {src.priceFound && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <DollarSign className="w-3 h-3" />
                          Preço: {src.priceFound}
                        </span>
                      )}
                      {src.priceRange && (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Faixa: {src.priceRange}
                        </span>
                      )}
                    </div>
                  )}

                  {src.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg">
                      {src.notes}
                    </p>
                  )}

                  {src.date && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Data da pesquisa: {src.date}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
