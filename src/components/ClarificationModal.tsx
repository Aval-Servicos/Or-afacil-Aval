import React, { useState } from 'react';
import { ClarificationQuestion } from '../types/budget';
import { HelpCircle, ArrowRight, X } from 'lucide-react';

interface ClarificationModalProps {
  questions: ClarificationQuestion[];
  onConfirm: (answers: Record<string, string>) => void;
  onCancel: () => void;
  onForceGenerate: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  questions,
  onConfirm,
  onCancel,
  onForceGenerate,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelectOption = (field: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [field]: val }));
  };

  const handleTextChange = (field: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(answers);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">A IA precisa de alguns detalhes</h3>
              <p className="text-xs text-slate-500">
                Para um orçamento preciso e sem surpresas nos custos de materiais e mão de obra
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {questions.map((q, idx) => {
            const currentVal = answers[q.field] || '';
            return (
              <div key={q.id || idx} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">
                  {idx + 1}. {q.question}
                </label>

                {q.suggestedAnswers && q.suggestedAnswers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.suggestedAnswers.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleSelectOption(q.field, opt)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          currentVal === opt
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  placeholder={q.placeholder || 'Ou digite sua resposta aqui...'}
                  value={currentVal}
                  onChange={(e) => handleTextChange(q.field, e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onForceGenerate}
              className="text-xs text-slate-500 hover:text-slate-700 underline order-2 sm:order-1"
            >
              Gerar com estimativa padrão
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                <span>Continuar Orçamento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
