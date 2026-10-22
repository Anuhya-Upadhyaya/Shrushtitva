import React, { useState } from 'react';
import { Plant, SoilTestRecord } from '../types/plant';
import { api } from '../services/api';
import { X, CheckCircle2, AlertCircle, FlaskConical, Loader2, Info } from 'lucide-react';

interface SoilTestModalProps {
  plant: Plant;
  isOpen: boolean;
  onClose: () => void;
  onTestLogged: (test: SoilTestRecord, updatedPlant: Plant) => void;
}

export const SoilTestModal: React.FC<SoilTestModalProps> = ({
  plant,
  isOpen,
  onClose,
  onTestLogged,
}) => {
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [sampleType, setSampleType] = useState<'soil' | 'tissue' | 'potting_mix'>('soil');
  const [labName, setLabName] = useState('Home Chemical Test Kit / Agricultural Extension');
  const [ph, setPh] = useState<string>('6.5');
  const [ec, setEc] = useState<string>('0.9');
  const [nitrogen, setNitrogen] = useState<string>('120');
  const [phosphorus, setPhosphorus] = useState<string>('55');
  const [potassium, setPotassium] = useState<string>('160');
  const [source, setSource] = useState('ICAR Potting Substrate Extension Standard');
  const [interpretation, setInterpretation] = useState('pH is well balanced for macronutrient uptake. EC indicates no fertilizer salt accumulation.');
  const [limitations, setLimitations] = useState('Colorimetric chemical tube test with ±0.3 pH margin of error.');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { soilTest, plant: updatedPlant } = await api.recordSoilTest({
        plantId: plant.id,
        testDate,
        sampleType,
        laboratoryName: labName,
        measuredValues: {
          ph: ph ? parseFloat(ph) : undefined,
          ec: ec ? parseFloat(ec) : undefined,
          nitrogen_ppm: nitrogen ? parseFloat(nitrogen) : undefined,
          phosphorus_ppm: phosphorus ? parseFloat(phosphorus) : undefined,
          potassium_ppm: potassium ? parseFloat(potassium) : undefined,
        },
        referenceRangesSource: source,
        interpretation,
        limitations,
      });

      onTestLogged(soilTest, updatedPlant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log soil test.');
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
            <h2 className="text-base font-bold text-neutral-900">Log Laboratory Soil / Tissue Test</h2>
            <p className="text-xs text-neutral-500">
              For <strong>{plant.nickname}</strong> · Verified quantitative measurements
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <p className="text-[11px] leading-tight">
              <strong>Scientific Guardrail:</strong> Visual symptoms cannot substitute for laboratory soil analysis.
              Only enter authentic measured readings from kits or testing labs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Test Date</label>
              <input
                type="date"
                required
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Sample Type</label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="soil">Garden Soil</option>
                <option value="potting_mix">Potted Medium / Substrate</option>
                <option value="tissue">Foliar Leaf Tissue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Laboratory or Kit Name</label>
            <input
              type="text"
              required
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. GKVK University Soil Extension or Rapitest Kit"
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          {/* Quantitative Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Soil pH (0-14)</label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="10"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="6.5"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">EC (dS/m)</label>
              <input
                type="number"
                step="0.05"
                value={ec}
                onChange={(e) => setEc(e.target.value)}
                placeholder="0.8"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">N (ppm)</label>
              <input
                type="number"
                value={nitrogen}
                onChange={(e) => setNitrogen(e.target.value)}
                placeholder="120"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Phosphorus P (ppm)</label>
              <input
                type="number"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
                placeholder="50"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Potassium K (ppm)</label>
              <input
                type="number"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
                placeholder="150"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Reference Range Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. University Extension Horticultural Standard"
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Scientific Interpretation & Findings</label>
            <textarea
              rows={2}
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="Explain how measured values correlate with current leaf symptoms..."
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
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
                  <span>Logging Soil Test...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Log Measured Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
