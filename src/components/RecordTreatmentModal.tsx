import React, { useState } from 'react';
import { Plant, TreatmentRecord } from '../types/plant';
import { api } from '../services/api';
import { X, CheckCircle2, AlertCircle, Camera, Loader2, Sparkles } from 'lucide-react';

interface RecordTreatmentModalProps {
  plant: Plant;
  recommendationId?: string;
  isOpen: boolean;
  onClose: () => void;
  onTreatmentRecorded: (record: TreatmentRecord, updatedPlant: Plant) => void;
}

export const RecordTreatmentModal: React.FC<RecordTreatmentModalProps> = ({
  plant,
  recommendationId,
  isOpen,
  onClose,
  onTreatmentRecorded,
}) => {
  const recommendedTreatment = plant.assessments
    ?.flatMap((a) => a.recommendedTreatments || [])
    ?.find((t) => t.id === recommendationId);

  const [ingredients, setIngredients] = useState<string>(
    recommendedTreatment ? recommendedTreatment.ingredientsOrProduct.join(', ') : 'Epsom Salt & Water'
  );
  const [quantity, setQuantity] = useState<string>('500 ml foliar spray');
  const [dilution, setDilution] = useState<string>(
    recommendedTreatment?.dilutionRatio || '10g per 1 Litre water'
  );
  const [method, setMethod] = useState<string>(
    recommendedTreatment?.applicationMethod || 'foliar_spray'
  );
  const [reason, setReason] = useState<string>(
    recommendedTreatment?.targetProblem || 'Addressing leaf yellowing'
  );
  const [cost, setCost] = useState<string>(recommendedTreatment?.approximateCost || '₹15');
  const [notes, setNotes] = useState<string>('Applied in late evening when sun set.');
  const [followUpDays, setFollowUpDays] = useState<number>(7);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const followUpDateObj = new Date();
    followUpDateObj.setDate(followUpDateObj.getDate() + followUpDays);
    const expectedFollowUpDate = followUpDateObj.toISOString().split('T')[0];

    try {
      const { record, plant: updatedPlant } = await api.recordTreatment({
        plantId: plant.id,
        recommendationId,
        productOrIngredients: ingredients.split(',').map((s) => s.trim()).filter(Boolean),
        actualQuantityApplied: quantity,
        actualDilutionDetails: dilution,
        applicationMethod: method,
        reasonForTreatment: reason,
        actualCostPaid: cost,
        notes,
        expectedFollowUpDate,
      });

      onTreatmentRecorded(record, updatedPlant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save treatment record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7F5]">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Record Applied Treatment</h2>
            <p className="text-xs text-neutral-500">
              For <strong>{plant.nickname}</strong> · Distinct from AI recommendations
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-neutral-800 block mb-1">
              Product or Ingredients Actually Used
            </label>
            <input
              type="text"
              required
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. Cold-pressed neem oil, castile soap, water"
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Quantity Applied</label>
              <input
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 450 ml"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Dilution / Mixing Details</label>
              <input
                type="text"
                value={dilution}
                onChange={(e) => setDilution(e.target.value)}
                placeholder="e.g. 5ml/L with 2 drops soap"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Application Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="foliar_spray">Foliar Spray (Upper & Underside)</option>
                <option value="soil_drench">Soil Drench (Root Zone)</option>
                <option value="stem_wipe">Stem Wipe / Manual Swab</option>
                <option value="root_dusting">Root Zone Dusting / Cinnamon</option>
                <option value="physical_removal">Physical Pruning / Washing</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Actual Cost Incurred</label>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. ₹15 ($0.20)"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Reason for Treatment</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Interveinal chlorosis on bottom leaves"
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Gardener Notes / Observations During Application</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sprayed only after sun went down to prevent sunburn."
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Schedule Follow-Up Inspection In</label>
            <div className="flex items-center gap-2">
              {[3, 7, 14, 21].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setFollowUpDays(d)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                    followUpDays === d
                      ? 'bg-[#3B182E] text-white border-[#3B182E]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
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
                  <span>Logging Application...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Log Treatment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
