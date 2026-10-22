import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plant, UserProfile, HealthAssessment, TreatmentRecord, FollowUpRecord, SoilTestRecord, CareAlert } from './types/plant';
import { api } from './services/api';
import { notificationService } from './services/notificationService';
import { SupportedLanguage } from './services/translations';
import { Navigation } from './components/Navigation';
import { MyGarden } from './components/MyGarden';
import { PlantDetail } from './components/PlantDetail';
import { HealthAssessmentModal } from './components/HealthAssessmentModal';
import { RecordTreatmentModal } from './components/RecordTreatmentModal';
import { FollowUpModal } from './components/FollowUpModal';
import { AddPlantModal } from './components/AddPlantModal';
import { SoilTestModal } from './components/SoilTestModal';
import { CareCalendar } from './components/CareCalendar';
import { AIAssistant } from './components/AIAssistant';
import { WeatherWidget } from './components/WeatherWidget';
import { AuthModal } from './components/AuthModal';
import { ToastNotification } from './components/ToastNotification';
import { NotificationCenter } from './components/NotificationCenter';
import { Activity, ShieldCheck, Heart, Sprout, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [currentView, setCurrentView] = useState<'garden' | 'health' | 'calendar' | 'assistant' | 'weather'>('garden');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Notification center & Toast alert state
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const initialAlertDispatchedRef = useRef(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addPlantModalOpen, setAddPlantModalOpen] = useState(false);
  const [assessmentPlant, setAssessmentPlant] = useState<Plant | null>(null);
  const [treatmentModal, setTreatmentModal] = useState<{ plant: Plant; recommendationId?: string } | null>(null);
  const [followUpModal, setFollowUpModal] = useState<{ plant: Plant; recordId?: string } | null>(null);
  const [soilTestPlant, setSoilTestPlant] = useState<Plant | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Calculate dynamic alerts from plant profiles
  const alerts = useMemo(() => {
    return notificationService.calculatePlantAlerts(plants);
  }, [plants]);

  // Initialize application state
  const loadGardenData = async () => {
    try {
      const userRes = await api.getMe().catch(() => null);
      if (userRes && userRes.user) {
        setUser(userRes.user);
        if (userRes.user.preferredLanguage) {
          setCurrentLanguage(userRes.user.preferredLanguage as SupportedLanguage);
        }
      }

      const plantList = await api.getPlants();
      setPlants(plantList);

      // Keep selected plant in sync if open
      if (selectedPlant) {
        const refreshed = plantList.find((p) => p.id === selectedPlant.id);
        if (refreshed) setSelectedPlant(refreshed);
      }

      // Dispatch initial morning alert toast if any plants need watering or feeding today
      if (!initialAlertDispatchedRef.current && plantList.length > 0) {
        const calculated = notificationService.calculatePlantAlerts(plantList);
        if (calculated.length > 0) {
          initialAlertDispatchedRef.current = true;
          // Emit the first pressing alert after 1 second for natural discovery
          setTimeout(() => {
            notificationService.emitToast(calculated[0]);
          }, 1000);
        }
      }
    } catch (e) {
      console.error('Failed to load garden data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGardenData();
  }, []);

  const handleSelectView = (view: 'garden' | 'health' | 'calendar' | 'assistant' | 'weather') => {
    setSelectedPlant(null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlantUpdated = (updatedPlant: Plant) => {
    setPlants((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
    if (selectedPlant && selectedPlant.id === updatedPlant.id) {
      setSelectedPlant(updatedPlant);
    }
  };

  const handlePlantCreated = (newPlant: Plant) => {
    setPlants((prev) => [newPlant, ...prev]);
    setSelectedPlant(newPlant);
  };

  const handleAssessmentCompleted = (assessment: HealthAssessment, updatedPlant: Plant) => {
    handlePlantUpdated(updatedPlant);
  };

  const handleTreatmentRecorded = (record: TreatmentRecord, updatedPlant: Plant) => {
    handlePlantUpdated(updatedPlant);
  };

  const handleFollowUpCompleted = (record: FollowUpRecord, updatedPlant: Plant) => {
    handlePlantUpdated(updatedPlant);
  };

  const handleSoilTestLogged = (test: SoilTestRecord, updatedPlant: Plant) => {
    handlePlantUpdated(updatedPlant);
  };

  const handleQuickWater = async (plantId: string) => {
    try {
      const res = await api.waterPlant(plantId);
      handlePlantUpdated(res.plant);
      notificationService.playChime();
    } catch (e) {
      console.error('Failed to quick-water plant', e);
    }
  };

  const handleQuickFeed = async (plantId: string) => {
    try {
      const res = await api.feedPlant(plantId);
      handlePlantUpdated(res.plant);
      notificationService.playChime();
    } catch (e) {
      console.error('Failed to quick-feed plant', e);
    }
  };

  const handleTriggerAlertCheck = () => {
    const freshAlerts = notificationService.calculatePlantAlerts(plants);
    if (freshAlerts.length > 0) {
      notificationService.emitToast(freshAlerts[0]);
    } else {
      alert('All plants are currently on schedule! No immediate watering or feeding required.');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    loadGardenData();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#1F1924] flex flex-col font-sans antialiased selection:bg-[#3B182E]/15 relative">
      {/* Toast Alert System */}
      <ToastNotification
        onQuickWater={handleQuickWater}
        onQuickFeed={handleQuickFeed}
        onViewPlant={(plantId) => {
          const target = plants.find((p) => p.id === plantId);
          if (target) setSelectedPlant(target);
        }}
      />

      {/* Top Bar Navigation */}
      <div className="relative">
        <Navigation
          currentView={currentView}
          onSelectView={handleSelectView}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenAddPlant={() => setAddPlantModalOpen(true)}
          onLogout={handleLogout}
          currentLanguage={currentLanguage}
          onChangeLanguage={(lang) => {
            setCurrentLanguage(lang);
            if (user) {
              api.updateProfile({ preferredLanguage: lang });
            }
          }}
          alertCount={alerts.length}
          onToggleNotificationCenter={() => setNotificationCenterOpen(!notificationCenterOpen)}
        />

        {/* Notification Center Popover */}
        {notificationCenterOpen && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <NotificationCenter
              plants={plants}
              alerts={alerts}
              isOpen={notificationCenterOpen}
              onClose={() => setNotificationCenterOpen(false)}
              onQuickWater={handleQuickWater}
              onQuickFeed={handleQuickFeed}
              onViewPlant={(p) => setSelectedPlant(p)}
              onTriggerCheck={handleTriggerAlertCheck}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-neutral-500">
            <Sprout className="w-8 h-8 text-[#3B182E] animate-pulse" />
            <p className="text-xs font-medium">Opening your private botanical records...</p>
          </div>
        ) : selectedPlant ? (
          <PlantDetail
            plant={selectedPlant}
            onBack={() => setSelectedPlant(null)}
            onAssess={(p) => setAssessmentPlant(p)}
            onRecordTreatment={(p, recId) => setTreatmentModal({ plant: p, recommendationId: recId })}
            onFollowUp={(p, recId) => setFollowUpModal({ plant: p, recordId: recId })}
            onLogSoilTest={(p) => setSoilTestPlant(p)}
            onQuickWater={handleQuickWater}
            onQuickFeed={handleQuickFeed}
            onUpdatePlant={(updatedPlant) => {
              setSelectedPlant(updatedPlant);
              setPlants((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
            }}
          />
        ) : (
          <>
            {currentView === 'garden' && (
              <MyGarden
                plants={plants}
                onSelectPlant={(p) => setSelectedPlant(p)}
                onAssessPlant={(p) => setAssessmentPlant(p)}
                onOpenAddPlant={() => setAddPlantModalOpen(true)}
                onOpenCareCalendar={() => handleSelectView('calendar')}
                onQuickWater={(p) => handleQuickWater(p.id)}
              />
            )}

            {currentView === 'health' && (
              <div className="space-y-6 max-w-4xl mx-auto pb-16">
                <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
                  <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                    Plant Health Assessment & Diagnostics
                  </h1>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Select any plant in your garden to inspect leaves, analyze symptoms, and identify
                    nutritional or fungal imbalances with safe, affordable remedies.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plants.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3 hover:border-neutral-300 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primaryPhotoUrl || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg'}
                          alt={p.nickname}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate text-xs">
                          <p className="font-bold text-neutral-900 truncate">{p.nickname}</p>
                          <p className="text-neutral-500 italic truncate">{p.commonName}</p>
                          <p className="text-[11px] text-neutral-400 capitalize mt-0.5">{p.healthStatus.replace(/_/g, ' ')}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setAssessmentPlant(p)}
                        className="w-full py-2 px-3 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Diagnose {p.nickname}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'calendar' && (
              <CareCalendar
                plants={plants}
                onSelectPlant={(p) => setSelectedPlant(p)}
                onRefreshData={loadGardenData}
              />
            )}

            {currentView === 'assistant' && (
              <AIAssistant
                plants={plants}
                onSelectPlant={(p) => setSelectedPlant(p)}
                onOpenAssessment={(p) => setAssessmentPlant(p)}
              />
            )}

            {currentView === 'weather' && <WeatherWidget />}
          </>
        )}
      </main>

      {/* Modals */}
      {assessmentPlant && (
        <HealthAssessmentModal
          plant={assessmentPlant}
          isOpen={true}
          onClose={() => setAssessmentPlant(null)}
          onAssessmentCompleted={handleAssessmentCompleted}
        />
      )}

      {treatmentModal && (
        <RecordTreatmentModal
          plant={treatmentModal.plant}
          recommendationId={treatmentModal.recommendationId}
          isOpen={true}
          onClose={() => setTreatmentModal(null)}
          onTreatmentRecorded={handleTreatmentRecorded}
        />
      )}

      {followUpModal && (
        <FollowUpModal
          plant={followUpModal.plant}
          treatmentRecordId={followUpModal.recordId}
          isOpen={true}
          onClose={() => setFollowUpModal(null)}
          onFollowUpCompleted={handleFollowUpCompleted}
        />
      )}

      {addPlantModalOpen && (
        <AddPlantModal
          isOpen={true}
          onClose={() => setAddPlantModalOpen(false)}
          onPlantCreated={handlePlantCreated}
        />
      )}

      {soilTestPlant && (
        <SoilTestModal
          plant={soilTestPlant}
          isOpen={true}
          onClose={() => setSoilTestPlant(null)}
          onTestLogged={handleSoilTestLogged}
        />
      )}

      {authModalOpen && (
        <AuthModal
          isOpen={true}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(u) => {
            setUser(u);
            loadGardenData();
          }}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-white py-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#3B182E] text-white flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5 text-[#F7D6C8]" />
            </div>
            <span className="font-bold text-neutral-900">Shrushtitva</span>
            <span className="text-neutral-400">·</span>
            <span>Intelligent Botanical Health Companion</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>Evidence-Based Diagnostics</span>
            <span aria-hidden="true">·</span>
            <span>Affordable Homemade Remedies</span>
            <span aria-hidden="true">·</span>
            <span>Private User Isolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
