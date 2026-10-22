export type PlantCategory = 
  | 'indoor_houseplant'
  | 'vegetable'
  | 'herb'
  | 'flowering'
  | 'succulent_cactus'
  | 'shrub_tree'
  | 'climber_vine';

export type GrowthStage = 
  | 'seed'
  | 'seedling'
  | 'vegetative'
  | 'budding'
  | 'flowering'
  | 'fruiting'
  | 'mature';

export type HealthStatus = 
  | 'healthy'
  | 'suspected_issue'
  | 'under_treatment'
  | 'recovering'
  | 'deteriorating'
  | 'not_assessed';

export type SunlightCondition = 
  | 'direct_full_sun'
  | 'bright_indirect'
  | 'partial_shade'
  | 'low_light';

export type WateringRoutine = 
  | 'daily'
  | 'alternate_days'
  | 'twice_a_week'
  | 'weekly'
  | 'when_top_dry'
  | 'bi_weekly';

export type DrainageCondition = 
  | 'excellent_perlite_holes'
  | 'adequate'
  | 'poor_slow'
  | 'no_drainage_holes';

export interface SoilTestRecord {
  id: string;
  plantId: string;
  testDate: string;
  sampleType: 'soil' | 'tissue' | 'potting_mix';
  laboratoryName?: string;
  measuredValues: {
    ph?: number; // e.g. 6.5
    ec?: number; // dS/m
    nitrogen_ppm?: number;
    phosphorus_ppm?: number;
    potassium_ppm?: number;
    calcium_ppm?: number;
    magnesium_ppm?: number;
    iron_ppm?: number;
    organicMatterPercent?: number;
  };
  referenceRangesSource?: string;
  interpretation: string;
  limitations: string;
}

export interface NutrientFinding {
  nutrient: string; // e.g. 'Nitrogen', 'Iron', 'Magnesium'
  status: 'suspected_deficiency' | 'suspected_excess' | 'normal' | 'untested';
  visualSymptoms: string[];
  alternativeExplanations: string[];
  consequencesIfUnresolved: string;
  verificationMethod: string;
  correctiveOptions: string[];
  safetyPrecautions: string[];
  indicatorsToMonitor: string[];
}

export interface TreatmentRecommendation {
  id: string;
  name: string; // e.g. 'Mild Neem Oil & Castile Soap Emulsion'
  category: 'homemade_remedy' | 'environmental_adjustment' | 'commercial_treatment' | 'expert_intervention';
  targetProblem: string;
  reasonForChoosing: string;
  evidenceBasis: string;
  ingredientsOrProduct: string[];
  preparationSteps: string[];
  dilutionRatio?: string; // e.g. '5ml per 1 Litre water with 3 drops soap'
  applicationMethod: 'foliar_spray' | 'soil_drench' | 'stem_wipe' | 'root_dusting' | 'physical_removal' | 'cultural';
  applicationLocation: 'underside_and_top_of_leaves' | 'soil_base' | 'affected_stems' | 'root_zone';
  frequency: string; // e.g. 'Every 5 to 7 days in late evening'
  duration: string; // e.g. '2 to 3 weeks until new growth is clear'
  expectedResponseTimeframe: string; // e.g. '5 to 10 days'
  approximateCost: string; // e.g. '₹25 ($0.30) using kitchen staples'
  costCalculationDetails: string;
  safetyPrecautions: string[];
  potentialPlantDamage: string; // e.g. 'Test on 1 leaf first; avoid spraying under hot noon sun to prevent phototoxicity'
  risksToPeoplePetsPollinators: string;
  protectiveEquipment: string[];
  contraindications: string[]; // When NOT to use
  followUpInstructions: string;
}

export interface TreatmentRecord {
  id: string;
  plantId: string;
  recommendationId?: string;
  appliedDate: string;
  appliedTime: string;
  productOrIngredients: string[];
  actualQuantityApplied: string;
  actualDilutionDetails: string;
  applicationMethod: string;
  reasonForTreatment: string;
  actualCostPaid?: string;
  notes: string;
  photoUrl?: string;
  expectedFollowUpDate: string;
  isCompleted: boolean;
}

export interface FollowUpRecord {
  id: string;
  plantId: string;
  treatmentRecordId?: string;
  followUpDate: string;
  photoUrl?: string;
  currentSymptomsObserved: string[];
  newSymptomsReported: string[];
  treatmentConfirmedApplied: boolean;
  actualQuantityUsed: string;
  environmentalChanges: string;
  growthObservations: string;
  classification: 'improving' | 'unchanged' | 'worsening' | 'inconclusive';
  basisForClassification: string;
  reassessmentRecommended: boolean;
  nextStepsAdvice: string;
}

export interface DiagnosisFinding {
  conditionName: string; // e.g. 'Early Fungal Leaf Spot (Cercospora)'
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutrient' | 'environmental' | 'watering';
  probability: 'high' | 'moderate' | 'low';
  confidencePercentage: number;
  supportingObservations: string[];
  conflictingOrUnexplainedObservations: string[];
  similarLookingConditions: string[];
  distinguishingFeatures: string[];
  recommendedVerificationSteps: string[];
  canBeginWithLowRiskCare: boolean;
  urgency: 'low' | 'moderate' | 'high_rapidly_spreading';
  requiresProfessionalTesting: boolean;
}

export interface HealthAssessment {
  id: string;
  plantId: string;
  assessmentDate: string;
  photographUrls: string[];
  observedConditionSummary: string;
  suspectedFindings: DiagnosisFinding[];
  nutrientHypotheses: NutrientFinding[];
  environmentalFactors: string[];
  missingInformation: string[];
  recommendedTreatments: TreatmentRecommendation[];
  urgentSafetyNotice?: string;
  overallHealthScore?: number;
  status: HealthStatus;
}

export interface PlantPhoto {
  id: string;
  url: string;
  caption?: string;
  date: string;
  stage?: GrowthStage;
  context: 'baseline' | 'symptom_assessment' | 'treatment_application' | 'follow_up' | 'recovery_milestone';
  assessmentId?: string;
  treatmentRecordId?: string;
}

export interface CareTask {
  id: string;
  plantId: string;
  plantName: string;
  taskType: 'watering' | 'fertilizer' | 'pruning' | 'repotting' | 'pest_inspection' | 'treatment_application' | 'treatment_follow_up' | 'seed_sowing' | 'harvesting';
  title: string;
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  isSkipped?: boolean;
  snoozedUntil?: string;
  notes?: string;
  recurrenceDays?: number;
}

export interface CareLog {
  id: string;
  plantId: string;
  date: string;
  activityType: 'watering' | 'fertilizer' | 'pruning' | 'repotting' | 'treatment' | 'inspection' | 'soil_test' | 'other';
  quantityApplied?: string;
  notes: string;
  photoUrl?: string;
}

export interface GrowthMetricLog {
  id: string;
  plantId: string;
  date: string; // YYYY-MM-DD
  heightCm: number;
  leafCount: number;
  stemDiameterMm?: number;
  notes?: string;
  milestone?: string; // e.g. "New fenestrated leaf unfolded", "First flower cluster"
}

export interface Plant {
  id: string;
  userId: string;
  nickname: string;
  commonName: string;
  scientificName?: string;
  category: PlantCategory;
  primaryPhotoUrl: string;
  photos: PlantPhoto[];
  plantingDate?: string;
  approximateAge?: string;
  plantingMethod: 'seed' | 'cutting' | 'nursery_transplant' | 'gift_or_division' | 'unknown';
  growthStage: GrowthStage;
  isIndoor: boolean;
  locationDetails: string; // e.g. "Living Room South Window" or "East Balcony"
  potBedDetails: string; // e.g. "10-inch Terracotta pot"
  soilMedium: string; // e.g. "Potting soil + cocopeat + vermicompost"
  sunlightExposure: SunlightCondition;
  wateringRoutine: WateringRoutine;
  drainageCondition: DrainageCondition;
  knownEnvironmentalConditions?: string;
  additionalNotes?: string;
  healthStatus: HealthStatus;
  lastAssessedDate?: string;
  lastWateredDate?: string;
  lastFedDate?: string;
  feedingRoutine?: FeedingRoutine;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  // Relationships
  latestAssessment?: HealthAssessment;
  assessments: HealthAssessment[];
  treatmentRecords: TreatmentRecord[];
  followUpRecords: FollowUpRecord[];
  soilTests: SoilTestRecord[];
  careTasks: CareTask[];
  careLogs: CareLog[];
  growthMetrics?: GrowthMetricLog[];
}

export type FeedingRoutine = 'weekly' | 'bi_weekly' | 'monthly' | 'dormant_none';

export interface CareAlert {
  id: string;
  plantId: string;
  plantName: string;
  commonName: string;
  plantPhoto: string;
  type: 'watering' | 'feeding' | 'treatment_follow_up' | 'inspection';
  title: string;
  reason: string;
  recommendedAmount?: string;
  urgency: 'routine' | 'due_today' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  toastEnabled: boolean;
  preferredTime: string; // e.g. '08:00'
  quietHoursStart: string; // e.g. '22:00'
  quietHoursEnd: string; // e.g. '07:00'
  soundEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage: 'en' | 'kn' | 'hi' | 'te' | 'ta' | 'ml' | 'mr' | 'bn';
  locationName: string; // e.g. "Bengaluru, Karnataka, India"
  climateZone: string; // e.g. "Tropical Savanna / Semi-arid"
  gardeningExperience: 'beginner' | 'intermediate' | 'experienced';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  plantId?: string;
  suggestedActions?: {
    label: string;
    actionType: 'open_assessment' | 'log_treatment' | 'schedule_task' | 'view_plant';
    payload?: any;
  }[];
}
