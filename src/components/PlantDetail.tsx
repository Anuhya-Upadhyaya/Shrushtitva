import React, { useState } from 'react';
import { Plant, HealthStatus } from '../types/plant';
import { Plant3DViewer } from './Plant3DViewer';
import { PlantGrowthChart } from './PlantGrowthChart';
import { SequentialPhotoGallery } from './SequentialPhotoGallery';
import {
  ArrowLeft,
  Activity,
  Play,
  Sparkles,
  Calendar,
  FlaskConical,
  Clock,
  Droplets,
  Sun,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  Layers,
  TrendingUp,
} from 'lucide-react';

interface PlantDetailProps {
  plant: Plant;
  onBack: () => void;
  onAssess: (plant: Plant) => void;
  onRecordTreatment: (plant: Plant, recommendationId?: string) => void;
  onFollowUp: (plant: Plant, treatmentRecordId?: string) => void;
  onLogSoilTest: (plant: Plant) => void;
  onQuickWater?: (plantId: string) => void;
  onQuickFeed?: (plantId: string) => void;
  onUpdatePlant?: (updatedPlant: Plant) => void;
}

export const PlantDetail: React.FC<PlantDetailProps> = ({
  plant,
  onBack,
  onAssess,
  onRecordTreatment,
  onFollowUp,
  onLogSoilTest,
  onQuickWater,
  onQuickFeed,
  onUpdatePlant,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'growth' | '3d' | 'health' | 'nutrients' | 'treatments' | 'history' | 'timeline' | 'tasks'
  >('overview');

  const latestAssessment = plant.assessments?.[0];
  const latestTreatment = plant.treatmentRecords?.[0];
  const latestFollowUp = plant.followUpRecords?.[0];
  const pendingTasks = plant.careTasks?.filter((t) => !t.isCompleted) || [];

  const getStatusText = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return { label: 'Healthy & Thriving', color: 'text-emerald-700 bg-emerald-50' };
      case 'suspected_issue':
        return { label: 'Suspected Issue (Needs Attention)', color: 'text-amber-800 bg-amber-50' };
      case 'under_treatment':
        return { label: 'Under Active Treatment', color: 'text-purple-800 bg-purple-50' };
      case 'recovering':
        return { label: 'Recovering & Improving', color: 'text-teal-800 bg-teal-50' };
      case 'deteriorating':
        return { label: 'Deteriorating (Reassessment Required)', color: 'text-rose-800 bg-rose-50' };
      default:
        return { label: 'Not Yet Assessed', color: 'text-neutral-700 bg-neutral-100' };
    }
  };

  const statusBadge = getStatusText(plant.healthStatus);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
            title="Back to garden"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{plant.nickname}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
              <span className="italic font-medium">{plant.commonName}</span>
              {plant.scientificName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="italic text-neutral-400">({plant.scientificName})</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="capitalize">{plant.growthStage} Stage</span>
            </div>
          </div>
        </div>

        {/* Quick Action CTA Group */}
        <div className="flex flex-wrap items-center gap-2">
          {onQuickWater && (
            <button
              onClick={() => onQuickWater(plant.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors cursor-pointer"
              title="Record hydration and update last watered date"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Water Plant</span>
            </button>
          )}

          {onQuickFeed && (
            <button
              onClick={() => onQuickFeed(plant.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-colors cursor-pointer"
              title="Record organic feeding/fertilization"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Feed Plant</span>
            </button>
          )}

          <button
            onClick={() => onAssess(plant)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#3B182E] bg-purple-100/70 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Assess Symptoms</span>
          </button>

          <button
            onClick={() => onRecordTreatment(plant)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Record Treatment</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Functional Segmented Control) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-neutral-200 scrollbar-none text-xs">
        {[
          { id: 'overview', label: 'Overview & Photos' },
          { id: 'growth', label: 'Growth Metrics (D3)' },
          { id: '3d', label: '3D Botanical Preview' },
          { id: 'health', label: 'Diagnosis & Findings' },
          { id: 'nutrients', label: 'Nutrients & Soil Lab' },
          { id: 'treatments', label: 'Remedies & Plans' },
          { id: 'history', label: 'Treatment History' },
          { id: 'timeline', label: `Growth Timelapse & Photos (${plant.photos?.length || 0})` },
          { id: 'tasks', label: `Care Calendar (${pendingTasks.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#3B182E] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Photograph with Zoom and Captions */}
            <div className="md:col-span-1 space-y-3">
              <div className="aspect-4/3 sm:aspect-square rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 relative shadow-2xs">
                <img
                  src={plant.primaryPhotoUrl || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg'}
                  alt={plant.nickname}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Photo Meta */}
              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">Current Specimen View</span>
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {plant.photos?.[plant.photos.length - 1]?.date || plant.photos?.[0]?.date || 'Recent'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 italic">
                  {plant.photos?.[plant.photos.length - 1]?.caption || plant.photos?.[0]?.caption || 'Baseline photograph for health tracking and leaf symptom comparison.'}
                </p>
              </div>

              {/* Quick Launch into Growth Timelapse */}
              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full flex items-center justify-between p-3 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/80 rounded-xl text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#3B182E] text-white flex items-center justify-center shadow-2xs">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-[#3B182E] block">Open Growth Timelapse</span>
                    <span className="text-[11px] text-purple-800">
                      {plant.photos?.length || 0} chronological photos recorded
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3B182E] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Botanical & Environmental Profile Data */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Growing Environment & Conditions
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Location</span>
                    <span className="font-semibold text-neutral-800">{plant.locationDetails}</span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block">Sunlight Exposure</span>
                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span className="capitalize">{plant.sunlightExposure.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-400 block">Watering Routine</span>
                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span className="capitalize">{plant.wateringRoutine.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-400 block">Container & Bed</span>
                    <span className="font-semibold text-neutral-800">{plant.potBedDetails}</span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block">Drainage Quality</span>
                    <span className="font-semibold text-neutral-800 capitalize">
                      {plant.drainageCondition.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block">Planting Method</span>
                    <span className="font-semibold text-neutral-800 capitalize">
                      {plant.plantingMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 text-xs">
                  <span className="text-neutral-400 block mb-1">Soil / Growing Medium Composition</span>
                  <p className="text-neutral-700 bg-[#FAF7F5] p-2.5 rounded-xl border border-neutral-150">
                    {plant.soilMedium}
                  </p>
                </div>

                {plant.additionalNotes && (
                  <div className="pt-1 text-xs">
                    <span className="text-neutral-400 block mb-1">Gardener Notes</span>
                    <p className="text-neutral-600 italic">{plant.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Latest Assessment At A Glance */}
              {latestAssessment && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#3B182E]" />
                      <span>Latest Health Assessment</span>
                    </h3>
                    <span className="text-xs text-neutral-400 tabular-nums">
                      Date: {latestAssessment.assessmentDate}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                    {latestAssessment.observedConditionSummary}
                  </p>

                  {latestAssessment.suspectedFindings?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-neutral-500 font-medium">Suspected Diagnoses:</span>
                      {latestAssessment.suspectedFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 text-xs"
                        >
                          <div>
                            <p className="font-bold text-neutral-900">{finding.conditionName}</p>
                            <p className="text-[11px] text-neutral-500">
                              Supporting: {finding.supportingObservations.slice(0, 2).join(' · ')}
                            </p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                            {finding.confidencePercentage}% confidence
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 30-Day Historical Growth Metrics D3.js Line Chart */}
          <PlantGrowthChart plant={plant} onUpdatePlant={onUpdatePlant} />
        </div>
      )}

      {/* TAB: GROWTH & D3 METRICS */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <PlantGrowthChart plant={plant} onUpdatePlant={onUpdatePlant} />
        </div>
      )}

      {/* TAB 2: 3D BOTANICAL PREVIEW */}
      {activeTab === '3d' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Plant3DViewer
                plantName={plant.nickname}
                commonName={plant.commonName}
                category={plant.category}
                growthStage={plant.growthStage}
                healthStatus={plant.healthStatus}
              />
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                <h4 className="font-bold text-neutral-900 text-sm">About Botanical 3D Modeling</h4>
                <p className="text-neutral-600 leading-relaxed">
                  Shrushtitva creates species-aware procedural models tailored to the category of your plant (e.g.
                  Monstera aroid fenestration, branching Solanaceous tomato stems with fruit calyxes, or bushy Tulsi
                  canopies).
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 text-[11px]">
                  <strong>Scientific Responsibility:</strong> The 3D model represents a morphological approximation
                  designed for visual orientation. It does not replace high-resolution photographs for diagnosis.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2">
                <span className="font-semibold text-neutral-900 block">Interactive Controls</span>
                <ul className="list-disc list-inside space-y-1 text-neutral-600">
                  <li>Click and drag to rotate canopy</li>
                  <li>Scroll to zoom in on leaf nodes</li>
                  <li>Toggle breeze animation in top right</li>
                  <li>Reset button restores camera angle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSIS & EVIDENCE */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {plant.assessments?.length > 0 ? (
            plant.assessments.map((assess) => (
              <div key={assess.id} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      Assessment Record · {assess.assessmentDate}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Comprehensive symptom review & ranked biological hypotheses
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900">
                    Status: {assess.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-neutral-200/60 text-xs text-neutral-700 leading-relaxed">
                  <span className="font-semibold text-neutral-900 block mb-1">Observed Condition Summary:</span>
                  {assess.observedConditionSummary}
                </div>

                {/* Suspected Pathogens / Problems */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Ranked Possible Causes
                  </h4>
                  {assess.suspectedFindings?.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-neutral-900">{finding.conditionName}</span>
                          <span className="ml-2 text-[11px] text-neutral-500 uppercase">({finding.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md">
                            {finding.confidencePercentage}% confidence
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-neutral-50 p-3 rounded-lg">
                          <span className="font-semibold text-emerald-800 block mb-1">
                            Supporting Symptoms & Observations:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-neutral-700 text-[11px]">
                            {finding.supportingObservations.map((obs, i) => (
                              <li key={i}>{obs}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-neutral-50 p-3 rounded-lg">
                          <span className="font-semibold text-amber-800 block mb-1">
                            Alternative Explanations & Counter-Signs:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-neutral-700 text-[11px]">
                            {finding.conflictingOrUnexplainedObservations?.length > 0 ? (
                              finding.conflictingOrUnexplainedObservations.map((conf, i) => (
                                <li key={i}>{conf}</li>
                              ))
                            ) : (
                              <li>No contradictory symptoms observed</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {finding.recommendedVerificationSteps?.length > 0 && (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-150 text-xs">
                          <span className="font-semibold text-blue-900 block mb-0.5">
                            Recommended Verification Steps:
                          </span>
                          <p className="text-blue-800 text-[11px]">
                            {finding.recommendedVerificationSteps.join(' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
              <Activity className="w-10 h-10 text-neutral-300 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-800">No Assessment Recorded Yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Take a photograph and run an evidence-based check to identify diseases, pests, or watering stress.
              </p>
              <button
                onClick={() => onAssess(plant)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#3B182E] rounded-xl hover:bg-[#2B1020] transition-colors cursor-pointer"
              >
                Start Guided Assessment
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NUTRIENTS & SOIL LAB */}
      {activeTab === 'nutrients' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Soil & Tissue Test Laboratory Reports</h3>
              <p className="text-xs text-neutral-500">
                Log real laboratory or home test-kit results with verifiable units and scientific reference ranges.
              </p>
            </div>
            <button
              onClick={() => onLogSoilTest(plant)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#3B182E] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Log Soil Test</span>
            </button>
          </div>

          {/* Measured Soil Tests */}
          {plant.soilTests?.length > 0 ? (
            <div className="space-y-4">
              {plant.soilTests.map((test) => (
                <div key={test.id} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <div>
                      <span className="font-bold text-neutral-900 text-sm">
                        {test.laboratoryName || 'Laboratory Test'}
                      </span>
                      <span className="text-neutral-400 text-xs ml-2">({test.testDate})</span>
                    </div>
                    <span className="text-xs text-neutral-500 capitalize bg-neutral-100 px-2 py-0.5 rounded">
                      Sample: {test.sampleType}
                    </span>
                  </div>

                  {/* Quantitative Values Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150">
                      <span className="text-neutral-400 block text-[11px]">Soil pH</span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {test.measuredValues.ph !== undefined ? test.measuredValues.ph : 'Not tested'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150">
                      <span className="text-neutral-400 block text-[11px]">EC (dS/m)</span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {test.measuredValues.ec !== undefined ? test.measuredValues.ec : 'Not tested'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150">
                      <span className="text-neutral-400 block text-[11px]">Nitrogen (ppm)</span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {test.measuredValues.nitrogen_ppm !== undefined ? test.measuredValues.nitrogen_ppm : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150">
                      <span className="text-neutral-400 block text-[11px]">Phosphorus (ppm)</span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {test.measuredValues.phosphorus_ppm !== undefined ? test.measuredValues.phosphorus_ppm : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-150 text-xs">
                    <span className="font-semibold text-emerald-900 block mb-0.5">Scientific Interpretation:</span>
                    <p className="text-emerald-800 text-[11px] leading-relaxed">{test.interpretation}</p>
                  </div>

                  <div className="text-[11px] text-neutral-400 italic">
                    Method & Limitations: {test.limitations} (Reference: {test.referenceRangesSource || 'ICAR Standard Tables'})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2">
              <FlaskConical className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs text-neutral-600">No laboratory soil test logged for this plant yet.</p>
              <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                Shrushtitva strictly distinguishes between visual hypotheses and measured lab tests to prevent
                hallucinated fertilizer overdose.
              </p>
            </div>
          )}

          {/* Visual Nutrient Hypotheses from Diagnosis */}
          {latestAssessment?.nutrientHypotheses?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Visual Nutrient Hypotheses (Non-Laboratory Estimates)
              </h4>
              {latestAssessment.nutrientHypotheses.map((hypo, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-sm">
                      Suspected {hypo.nutrient} Deficiency
                    </span>
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                      Visual Hypothesis
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Symptoms observed: {hypo.visualSymptoms.join(', ')}
                  </p>
                  <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-neutral-800 block">Recommended Safe Corrective Action:</span>
                    <ul className="list-disc list-inside text-neutral-600 text-[11px]">
                      {hypo.correctiveOptions.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REMEDIES & TREATMENT PLANS */}
      {activeTab === 'treatments' && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F5] rounded-2xl border border-neutral-200/80 p-5 space-y-2">
            <h3 className="text-sm font-bold text-neutral-900">Affordable & Safe Treatment Philosophy</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Shrushtitva prioritizes the cheapest, safest, evidence-based homemade remedies (kitchen ingredients,
              compost teas, cold-pressed neem emulsions) before escalating to commercial pesticides. Every recommendation
              discloses potential risks to pets, beneficial pollinators, and plant foliage.
            </p>
          </div>

          {latestAssessment?.recommendedTreatments?.length > 0 ? (
            <div className="space-y-5">
              {latestAssessment.recommendedTreatments.map((treat) => (
                <div key={treat.id} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div>
                      <h4 className="text-base font-bold text-[#3B182E]">{treat.name}</h4>
                      <p className="text-xs text-neutral-500">Addressing: {treat.targetProblem}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800">
                        Est. Cost: {treat.approximateCost}
                      </span>
                      <button
                        onClick={() => onRecordTreatment(plant, treat.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-lg transition-colors cursor-pointer"
                      >
                        Apply This Remedy
                      </button>
                    </div>
                  </div>

                  {/* Preparation & Ingredients */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150 space-y-2">
                      <span className="font-bold text-neutral-900 block">Ingredients & Dilution:</span>
                      <ul className="list-disc list-inside space-y-1 text-neutral-700">
                        {treat.ingredientsOrProduct.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                      {treat.dilutionRatio && (
                        <p className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                          Dilution ratio: <strong>{treat.dilutionRatio}</strong>
                        </p>
                      )}
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150 space-y-2">
                      <span className="font-bold text-neutral-900 block">Application Instructions:</span>
                      <p className="text-neutral-700 text-[11px]">
                        <strong>Method:</strong> {treat.applicationMethod.replace(/_/g, ' ')} on{' '}
                        {treat.applicationLocation.replace(/_/g, ' ')}.
                      </p>
                      <p className="text-neutral-700 text-[11px]">
                        <strong>Schedule:</strong> {treat.frequency} for {treat.duration}.
                      </p>
                      <p className="text-neutral-700 text-[11px]">
                        <strong>Expected response:</strong> {treat.expectedResponseTimeframe}.
                      </p>
                    </div>
                  </div>

                  {/* Step by step prep */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-neutral-900 block">Step-by-Step Preparation:</span>
                    <div className="space-y-1 text-neutral-700 text-[11px] bg-[#FAF7F5] p-3 rounded-xl border border-neutral-150">
                      {treat.preparationSteps.map((step, idx) => (
                        <p key={idx}>{step}</p>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Precaution Warning Banner */}
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-950">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Safety Precautions & Pollinator Protection:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-rose-900 space-y-0.5">
                      {treat.safetyPrecautions.map((safe, i) => (
                        <li key={i}>{safe}</li>
                      ))}
                      {treat.risksToPeoplePetsPollinators && (
                        <li>Eco-toxicity: {treat.risksToPeoplePetsPollinators}</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs text-neutral-600">No active treatment plan for this plant.</p>
              <button
                onClick={() => onAssess(plant)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#3B182E] rounded-xl hover:bg-[#2B1020] transition-colors cursor-pointer"
              >
                Assess Symptoms to Generate Remedies
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TREATMENT APPLICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Recorded Treatments & Applications</h3>
            <button
              onClick={() => onRecordTreatment(plant)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3B182E] rounded-lg hover:bg-[#2B1020] transition-colors cursor-pointer"
            >
              Record New Application
            </button>
          </div>

          {plant.treatmentRecords?.length > 0 ? (
            <div className="space-y-3">
              {plant.treatmentRecords.map((rec) => (
                <div key={rec.id} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-neutral-900 text-sm">
                        {rec.productOrIngredients.join(', ')}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 tabular-nums">
                      Applied: {rec.appliedDate} at {rec.appliedTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-400 block">Actual Quantity Used:</span>
                      <span className="font-medium text-neutral-800">{rec.actualQuantityApplied}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Method:</span>
                      <span className="font-medium text-neutral-800">{rec.applicationMethod}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Cost Paid:</span>
                      <span className="font-medium text-neutral-800">{rec.actualCostPaid || 'Minimal'}</span>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                      Notes: {rec.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500">
                      Scheduled Follow-Up: <strong>{rec.expectedFollowUpDate}</strong>
                    </span>
                    <button
                      onClick={() => onFollowUp(plant, rec.id)}
                      className="px-3 py-1 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Log Follow-Up Comparison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200 p-6">
              <p className="text-xs text-neutral-500">No treatments recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: GROWTH TIMELAPSE & PHOTO GALLERY */}
      {activeTab === 'timeline' && (
        <SequentialPhotoGallery
          plant={plant}
          onUpdatePlant={onUpdatePlant}
          onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
        />
      )}

      {/* TAB 8: CARE CALENDAR & TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900">Upcoming Tasks for {plant.nickname}</h3>
            {plant.careTasks?.length > 0 ? (
              <div className="space-y-2">
                {plant.careTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      task.isCompleted ? 'bg-neutral-50 border-neutral-200 opacity-60' : 'bg-white border-neutral-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          task.isCompleted ? 'bg-emerald-600 text-white' : 'border border-neutral-300'
                        }`}
                      >
                        {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <p className={`font-semibold ${task.isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'} truncate`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-neutral-400">Due: {task.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No pending care tasks.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
