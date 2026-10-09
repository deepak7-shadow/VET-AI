import React, { useState } from 'react';
import { api } from '../../services/api';
import { ScreeningRunAnimal, FeedingObservationPayload } from '../../types';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Utensils, 
  Droplets, 
  Activity, 
  RefreshCw,
  FileQuestion,
  ArrowRight
} from 'lucide-react';

interface FeedingQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  screeningAnimal: ScreeningRunAnimal;
  onSuccess: () => void;
}

export const FeedingQuestionnaireModal: React.FC<FeedingQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  screeningAnimal,
  onSuccess
}) => {
  const [intakeLevel, setIntakeLevel] = useState<'NORMAL' | 'SLIGHT_REDUCTION' | 'MODERATE_REDUCTION' | 'SEVERE_REDUCTION' | 'NONE'>('SLIGHT_REDUCTION');
  const [appetiteTrend, setAppetiteTrend] = useState<'INCREASING' | 'STEADY' | 'DECLINING' | 'RAPID_DROP'>('DECLINING');
  const [waterConsumption, setWaterConsumption] = useState<'NORMAL' | 'REDUCED' | 'ELEVATED' | 'ABSENT'>('NORMAL');
  const [chewingCudRate, setChewingCudRate] = useState<'NORMAL' | 'REDUCED' | 'ABSENT'>('REDUCED');
  const [feedType, setFeedType] = useState('Total Mixed Ration (TMR)');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: FeedingObservationPayload = {
      animal_id: screeningAnimal.animal?.id || screeningAnimal.animal_id,
      screening_animal_id: screeningAnimal.id,
      run_id: screeningAnimal.run_id,
      intake_level: intakeLevel,
      appetite_trend: appetiteTrend,
      water_consumption: waterConsumption,
      chewing_cud_rate: chewingCudRate,
      feed_type: feedType,
      notes: notes.trim()
    };

    try {
      setLoading(true);
      const response = await api.submitFeedingQuestionnaire(payload);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feeding questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-800">Feeding & Appetite Follow-Up</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {screeningAnimal.animal?.animal_id || 'Livestock'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Provide feed intake details to clarify risks and finalize decision support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>{error}</div>
            </div>
          )}

          {result ? (
            /* Result Screen */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Follow-Up Successfully Re-evaluated</h3>
                  <p className="text-xs text-emerald-700">
                    Feeding Intelligence Agent analyzed intake metrics and updated risk classification.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Updated Risk Category</div>
                  <div className="text-base font-bold text-slate-900 mt-1 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-slate-200 text-slate-800">
                      {result.new_risk_category || 'UPDATED'}
                    </span>
                    <span className="text-xs text-slate-500">Score: {result.new_risk_score}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Feeding Status</div>
                  <div className="text-xs font-bold text-indigo-700 mt-1">
                    {result.feeding_assessment?.status || 'ASSESSMENT_RECORDED'}
                  </div>
                </div>
              </div>

              {result.feeding_assessment?.veterinary_rationale && (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Agent Rationale & Findings</span>
                  </div>
                  <p>{result.feeding_assessment.veterinary_rationale}</p>
                </div>
              )}

              {result.feeding_assessment?.immediate_recommendation && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-800">Immediate Action Plan</div>
                  <p>{result.feeding_assessment.immediate_recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            /* Questionnaire Form */
            <form id="feeding-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Question 1: Intake Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-slate-500" />
                  <span>1. Current Feed Intake Level</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { val: 'NORMAL', label: 'Normal / Full (100%)', desc: 'Consuming usual ration' },
                    { val: 'SLIGHT_REDUCTION', label: 'Slight Drop (80-90%)', desc: 'Mild feed refusal' },
                    { val: 'MODERATE_REDUCTION', label: 'Moderate Drop (50-70%)', desc: 'Leaving half ration' },
                    { val: 'SEVERE_REDUCTION', label: 'Severe Drop (20-40%)', desc: 'Minimal consumption' },
                    { val: 'NONE', label: 'Complete Anorexia (0%)', desc: 'Refusing all feed' },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setIntakeLevel(item.val as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        intakeLevel === item.val
                          ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Appetite Trend */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>2. Appetite Trend Over Past 24-48 Hours</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { val: 'INCREASING', label: 'Improving', desc: 'Recovering appetite' },
                    { val: 'STEADY', label: 'Steady / Normal', desc: 'Stable feed behavior' },
                    { val: 'DECLINING', label: 'Declining', desc: 'Gradually eating less' },
                    { val: 'RAPID_DROP', label: 'Rapid Drop', desc: 'Sudden loss of appetite' },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setAppetiteTrend(item.val as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        appetiteTrend === item.val
                          ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Water Consumption */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-slate-500" />
                  <span>3. Water Consumption</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { val: 'NORMAL', label: 'Normal' },
                    { val: 'REDUCED', label: 'Reduced Drinking' },
                    { val: 'ELEVATED', label: 'Excessive / Polydipsia' },
                    { val: 'ABSENT', label: 'Refusing Water' },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setWaterConsumption(item.val as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        waterConsumption === item.val
                          ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Rumination / Chewing Cud */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Rumination / Cud Chewing Activity
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { val: 'NORMAL', label: 'Active Ruminating' },
                    { val: 'REDUCED', label: 'Sluggish / Infrequent' },
                    { val: 'ABSENT', label: 'Not Chewing Cud' },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setChewingCudRate(item.val as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        chewingCudRate === item.val
                          ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 5: Feed Type & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Feed Composition
                  </label>
                  <select
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Total Mixed Ration (TMR)">Total Mixed Ration (TMR)</option>
                    <option value="Pasture Grass / Grazing">Pasture Grass / Grazing</option>
                    <option value="Dry Hay / Silage">Dry Hay / Silage</option>
                    <option value="Grain / Concentrate Mix">Grain / Concentrate Mix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Farmer Notes / Observations
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reluctant to approach feed bunk"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {result ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all"
            >
              <span>Apply to Screening Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="feeding-form"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Feeding Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit & Re-Assess Risk</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
