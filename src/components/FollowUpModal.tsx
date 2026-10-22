import React, { useState } from 'react';
import { Plant, FollowUpRecord } from '../types/plant';
import { api } from '../services/api';
import { X, CheckCircle2, AlertCircle, Camera, Upload, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface FollowUpModalProps {
  plant: Plant;
  treatmentRecordId?: string;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpCompleted: (record: FollowUpRecord, updatedPlant: Plant) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  plant,
  treatmentRecordId,
  isOpen,
  onClose,
  onFollowUpCompleted,
}) => {
  const treatmentRecord = plant.treatmentRecords?.find((t) => t.id === treatmentRecordId) || plant.treatmentRecords?.[0];

  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>(plant.primaryPhotoUrl || '');
  const [treatmentConfirmed, setTreatmentConfirmed] = useState<boolean>(true);
  const [currentSymptoms, setCurrentSymptoms] = useState<string>('Yellowing has stopped spreading to top leaves');
  const [newGrowthNotes, setNewGrowthNotes] = useState<string>('Fresh upper leaves emerging with healthy deep green chlorophyll');
  const [environmentalChanges, setEnvironmentalChanges] = useState<string>('Slightly cooler evening breeze, moved pot 1 foot away from hot wall');
  const [classification, setClassification] = useState<'improving' | 'unchanged' | 'worsening' | 'inconclusive'>('improving');
  const [basisNotes, setBasisNotes] = useState<string>('New flushes spared from chlorosis; turgidity restored after evening hydration.');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoBase64(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { followUp, plant: updatedPlant } = await api.recordFollowUp({
        plantId: plant.id,
        treatmentRecordId: treatmentRecord?.id,
        currentSymptomsObserved: currentSymptoms ? [currentSymptoms] : [],
        treatmentConfirmedApplied: treatmentConfirmed,
        growthObservations: newGrowthNotes,
        environmentalChanges,
        classification,
        basisForClassification: basisNotes,
        photoUrl: photoPreview,
        nextStepsAdvice:
          classification === 'improving'
            ? 'Continue standard moisture monitoring; treatment appears successful.'
            : classification === 'worsening'
            ? 'Consider soil flush or testing runoff pH to identify salt accumulation or root pathogens.'
            : 'Re-inspect in 5 days; avoid over-application of remedies.',
      });

      onFollowUpCompleted(followUp, updatedPlant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record follow-up.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7F5]">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Treatment Follow-Up & Recovery Check</h2>
            <p className="text-xs text-neutral-500">
              Evaluating results for <strong>{plant.nickname}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Side-by-side Baseline vs Follow-up Comparison */}
          <div>
            <span className="font-bold text-neutral-800 block mb-2">Visual Comparison: Baseline vs Today</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img
                    src={treatmentRecord?.photoUrl || plant.primaryPhotoUrl}
                    alt="Baseline condition"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 text-center">
                  Before: {treatmentRecord?.appliedDate || 'Baseline'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 relative group">
                  <img
                    src={photoPreview}
                    alt="Follow-up condition"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px] font-semibold">
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Upload New Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <p className="text-[11px] text-neutral-500 text-center">Current Photo Inspection</p>
              </div>
            </div>
          </div>

          {/* Treatment Confirmation */}
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <input
              type="checkbox"
              id="confirm_applied"
              checked={treatmentConfirmed}
              onChange={(e) => setTreatmentConfirmed(e.target.checked)}
              className="w-4 h-4 text-[#3B182E] rounded cursor-pointer"
            />
            <label htmlFor="confirm_applied" className="font-semibold text-neutral-800 cursor-pointer">
              Confirmed: The recommended remedy was actually prepared and applied as scheduled
            </label>
          </div>

          {/* Recovery Classification */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5">
              Classify Plant Response (Observation-Based Evidence)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'improving', label: 'Improving', desc: 'New healthy growth, arrested symptoms', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'unchanged', label: 'Unchanged', desc: 'No further spread, but no active regreening', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                { id: 'worsening', label: 'Worsening', desc: 'Symptoms spreading to new shoots', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                { id: 'inconclusive', label: 'Inconclusive', desc: 'Too early to tell; ambiguous signs', color: 'border-neutral-400 bg-neutral-50 text-neutral-800' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setClassification(opt.id as any)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    classification === opt.id
                      ? `${opt.color} font-bold shadow-xs`
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <p className="text-xs mb-0.5">{opt.label}</p>
                  <p className="text-[10px] text-neutral-500 font-normal leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Current Leaf Symptoms</label>
              <textarea
                rows={2}
                value={currentSymptoms}
                onChange={(e) => setCurrentSymptoms(e.target.value)}
                placeholder="Are spots fading or spreading? Is yellowing halted?"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">New Vegetative Growth</label>
              <textarea
                rows={2}
                value={newGrowthNotes}
                onChange={(e) => setNewGrowthNotes(e.target.value)}
                placeholder="Color and texture of newest emerging shoots..."
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">
              Basis for Classification & Next Steps Advice
            </label>
            <input
              type="text"
              value={basisNotes}
              onChange={(e) => setBasisNotes(e.target.value)}
              placeholder="Why was this classification chosen?"
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-neutral-150 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 font-bold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Recovery...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Recovery Evaluation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
