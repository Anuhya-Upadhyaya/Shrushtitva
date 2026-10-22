import React, { useState } from 'react';
import { Plant, HealthAssessment } from '../types/plant';
import { api } from '../services/api';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Loader2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface HealthAssessmentModalProps {
  plant: Plant;
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCompleted: (assessment: HealthAssessment, updatedPlant: Plant) => void;
}

export const HealthAssessmentModal: React.FC<HealthAssessmentModalProps> = ({
  plant,
  isOpen,
  onClose,
  onAssessmentCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>(plant.primaryPhotoUrl || '');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [leafZone, setLeafZone] = useState<'lower_older' | 'upper_newer' | 'entire_plant'>('lower_older');
  const [symptomDuration, setSymptomDuration] = useState<string>('past_week');
  const [soilMoisture, setSoilMoisture] = useState<string>('dry_top_inch');
  const [recentFertilizer, setRecentFertilizer] = useState<string>('none_recently');
  const [pestsVisible, setPestsVisible] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  if (!isOpen) return null;

  const COMMON_SYMPTOMS = [
    { id: 'yellowing_chlorosis', label: 'Interveinal Yellowing (Chlorosis)' },
    { id: 'brown_crisp_tips', label: 'Brown, Dry or Crispy Leaf Edges' },
    { id: 'spots_lesions', label: 'Dark Spots, Concentric Rings or Lesions' },
    { id: 'wilting_drooping', label: 'Wilting or Limp Foliage' },
    { id: 'curling_cupping', label: 'Leaf Curling or Upward Cupping' },
    { id: 'powdery_white', label: 'White Powdery Dust on Upper Surfaces' },
    { id: 'sticky_residue', label: 'Sticky Honeydew Residue or Webbing' },
    { id: 'stunted_growth', label: 'Stunted Internodes or Small Leaves' },
    { id: 'blossom_drop', label: 'Blossom Drop / Fruit Rot at Base' },
  ];

  const handleToggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be under 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoBase64(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAssessment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.analyzeHealth({
        plantId: plant.id,
        commonName: plant.commonName,
        scientificName: plant.scientificName,
        category: plant.category,
        symptomsObserved: symptoms,
        leafZoneAffected: leafZone,
        durationOfSymptoms: symptomDuration,
        soilMoistureState: soilMoisture,
        recentTreatmentsOrFertilizers: recentFertilizer,
        pestsVisible,
        additionalDescription: notes,
        photoBase64: photoBase64 || undefined,
      });

      setDiagnosticResult(result);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to complete diagnosis. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPlant = async () => {
    if (!diagnosticResult) return;
    setIsLoading(true);

    try {
      const { assessment, plant: updatedPlant } = await api.saveAssessment({
        plantId: plant.id,
        assessmentData: diagnosticResult,
        photoUrl: photoPreview,
      });

      onAssessmentCompleted(assessment, updatedPlant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7F5]">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Guided Plant Health Assessment
            </h2>
            <p className="text-xs text-neutral-500">
              Evaluating <strong className="text-neutral-800">{plant.nickname}</strong> ({plant.commonName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 py-2.5 bg-neutral-50 border-b border-neutral-150 flex items-center justify-between text-xs font-medium text-neutral-500">
          <span className={step >= 1 ? 'text-[#3B182E] font-bold' : ''}>1. Photo Specimen</span>
          <span>·</span>
          <span className={step >= 2 ? 'text-[#3B182E] font-bold' : ''}>2. Symptoms</span>
          <span>·</span>
          <span className={step >= 3 ? 'text-[#3B182E] font-bold' : ''}>3. Environmental Signs</span>
          <span>·</span>
          <span className={step >= 4 ? 'text-[#3B182E] font-bold' : ''}>4. Diagnostic Verdict</span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: PHOTOGRAPH */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-neutral-600 leading-relaxed">
                Provide a clear photograph of the affected leaf or overall plant condition. A sharp close-up of
                margins and veins significantly aids in distinguishing fungal lesions from nutrient chlorosis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="aspect-4/3 bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 relative group">
                  <img
                    src={photoPreview}
                    alt="Specimen preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-[11px] px-2 py-1 rounded backdrop-blur-xs truncate">
                    {photoBase64 ? 'Uploaded photo ready' : 'Using current plant photograph'}
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-3">
                  <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-neutral-300 hover:border-[#3B182E] rounded-2xl cursor-pointer bg-[#FAF7F5] hover:bg-neutral-50 transition-colors">
                    <Upload className="w-4 h-4 text-[#3B182E]" />
                    <span className="font-semibold text-neutral-800">Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <label className="flex items-center justify-center gap-2 p-3.5 border border-neutral-200 hover:border-neutral-300 rounded-2xl cursor-pointer bg-white transition-colors">
                    <Camera className="w-4 h-4 text-neutral-600" />
                    <span className="font-semibold text-neutral-700">Snap with Device Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <p className="text-[11px] text-neutral-400">
                    Supports JPG, PNG, WEBP. Max size 10MB.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SYMPTOM CHECKLIST */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-neutral-900 font-bold mb-1">
                  Which symptoms are currently visible on {plant.nickname}?
                </p>
                <p className="text-neutral-500">
                  Select all visible manifestations. The diagnostic engine combines these with species data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isChecked = symptoms.includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleToggleSymptom(sym.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#3B182E]/5 border-[#3B182E] text-neutral-900 font-semibold'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-xs">{sym.label}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                          isChecked ? 'bg-[#3B182E]' : 'border border-neutral-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: TARGETED FOLLOW-UP QUESTIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-neutral-600">
                A few targeted environmental observations distinguish mobile nutrient translocation from fungal infections.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Which zone of the leaf canopy is primarily affected?
                  </label>
                  <select
                    value={leafZone}
                    onChange={(e) => setLeafZone(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#3B182E]/20"
                  >
                    <option value="lower_older">Lower / Older Mature Leaves (Suggests mobile N, P, K, Mg deficit)</option>
                    <option value="upper_newer">Upper / Fresh Shoot Tips (Suggests immobile Fe, Ca, Zn or pest)</option>
                    <option value="entire_plant">Uniformly Scattered Across Whole Plant (Suggests watering/fungal)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      When did the symptoms begin?
                    </label>
                    <select
                      value={symptomDuration}
                      onChange={(e) => setSymptomDuration(e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
                    >
                      <option value="last_24_hours">Sudden onset (Last 24 - 48 hours)</option>
                      <option value="past_week">Gradual development (Past week)</option>
                      <option value="past_month">Chronic / Slow progression (2 - 4 weeks)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      Current soil moisture 2 inches deep?
                    </label>
                    <select
                      value={soilMoisture}
                      onChange={(e) => setSoilMoisture(e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
                    >
                      <option value="dry_top_inch">Dry and powdery topsoil</option>
                      <option value="evenly_moist">Evenly moist / squeezed sponge</option>
                      <option value="waterlogged_wet">Soggy / Standing water in saucer</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <input
                    type="checkbox"
                    id="pests_cb"
                    checked={pestsVisible}
                    onChange={(e) => setPestsVisible(e.target.checked)}
                    className="w-4 h-4 text-[#3B182E] rounded cursor-pointer"
                  />
                  <label htmlFor="pests_cb" className="text-xs text-neutral-800 font-medium cursor-pointer">
                    Visible insects, moving specks, or web strands observed under leaves
                  </label>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Any additional observations (e.g., recent repotting, cold draft, fertilizer applied)?
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any other clues about the plant's recent environment..."
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSTIC VERDICT */}
          {step === 4 && diagnosticResult && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Botanical Diagnostic Assessment Generated</span>
                </div>
                <p className="text-neutral-700 leading-relaxed text-[11px]">
                  {diagnosticResult.observedConditionSummary}
                </p>
              </div>

              {/* Suspected Pathogens / Issues */}
              <div className="space-y-3">
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                  Plausible Diagnoses Ranked by Evidence
                </h4>
                {diagnosticResult.suspectedFindings?.map((finding: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 text-xs">
                        {finding.conditionName}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                        {finding.confidencePercentage}% confidence
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-600 space-y-1">
                      <p>
                        <strong>Supporting:</strong> {finding.supportingObservations?.join(', ')}
                      </p>
                      {finding.recommendedVerificationSteps?.length > 0 && (
                        <p className="text-blue-900">
                          <strong>Verification:</strong> {finding.recommendedVerificationSteps.join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Affordable Treatment Preview */}
              {diagnosticResult.recommendedTreatments?.length > 0 && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">
                      Primary Recommended Remedy:
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      Est. Cost: {diagnosticResult.recommendedTreatments[0].approximateCost}
                    </span>
                  </div>
                  <p className="font-bold text-neutral-900 text-xs">
                    {diagnosticResult.recommendedTreatments[0].name}
                  </p>
                  <p className="text-neutral-600 text-[11px]">
                    {diagnosticResult.recommendedTreatments[0].reasonForChoosing}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          {step > 1 && step < 4 && (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
            >
              Back
            </button>
          )}

          {step === 1 && <div />}

          {step < 3 && (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleRunAssessment}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Biological Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#F7D6C8]" />
                  <span>Run Health Assessment</span>
                </>
              )}
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleSaveToPlant}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Record & Schedule Follow-Up</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
