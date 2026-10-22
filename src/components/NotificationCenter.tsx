import React, { useState } from 'react';
import { Plant, CareAlert, NotificationSettings } from '../types/plant';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  Droplets,
  Sparkles,
  Check,
  Settings,
  Volume2,
  VolumeX,
  ShieldCheck,
  Calendar,
  X,
  Play,
  ArrowRight,
  Info,
} from 'lucide-react';

interface NotificationCenterProps {
  plants: Plant[];
  alerts: CareAlert[];
  isOpen: boolean;
  onClose: () => void;
  onQuickWater: (plantId: string) => void;
  onQuickFeed: (plantId: string) => void;
  onViewPlant: (plant: Plant) => void;
  onTriggerCheck: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  plants,
  alerts,
  isOpen,
  onClose,
  onQuickWater,
  onQuickFeed,
  onViewPlant,
  onTriggerCheck,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [permissionState, setPermissionState] = useState<NotificationPermission>(notificationService.getPermissionState());

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const perm = await notificationService.requestPermission();
    setPermissionState(perm);
    const updated = { ...settings, pushEnabled: perm === 'granted' };
    setSettings(updated);
    notificationService.saveSettings(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    notificationService.saveSettings(updated);
    if (updated.soundEnabled) {
      notificationService.playChime();
    }
  };

  const handleSendTestNotification = () => {
    const testAlert: CareAlert = {
      id: `test_${Date.now()}`,
      plantId: plants[0]?.id || 'sample',
      plantName: plants[0]?.nickname || 'Ruby Roma (Tomato)',
      commonName: plants[0]?.commonName || 'Tomato',
      plantPhoto: plants[0]?.primaryPhotoUrl || '/src/assets/images/plant_tomato_blossom_1792637748927.jpg',
      type: 'watering',
      title: 'Watering Alert: Ruby Roma',
      reason: 'Porous terracotta container under full sun transpires rapidly. Deep morning hydration prevents blossom-end rot.',
      recommendedAmount: '800ml filtered water into root zone',
      urgency: 'due_today',
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    notificationService.emitToast(testAlert);
  };

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[95vw] bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="p-4 bg-[#FAF7F5] border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#3B182E] text-white flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-[#F7D6C8]" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">Plant Schedule & Alerts</h3>
            <p className="text-[11px] text-neutral-500">
              {alerts.length} care task{alerts.length === 1 ? '' : 's'} scheduled for today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showSettings ? 'bg-neutral-200 text-[#3B182E]' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            title="Notification settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings ? (
        <div className="p-5 space-y-4 bg-neutral-50/50">
          <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
            Alert & Push Settings
          </h4>

          {/* Browser Push Notification Permission */}
          <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-800 block">Desktop & Mobile Push</span>
                <span className="text-[11px] text-neutral-500">
                  Status: <strong>{permissionState}</strong>
                </span>
              </div>
              {permissionState === 'granted' ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <button
                  onClick={handleRequestPush}
                  className="px-3 py-1.5 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Enable Push
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Receive notifications for daily morning watering and feeding schedules even when the app tab is in background.
            </p>
          </div>

          {/* Audio Chime */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#3B182E]" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-400" />
              )}
              <div>
                <span className="font-bold text-neutral-800 block">Gentle Botanical Chime</span>
                <span className="text-[11px] text-neutral-400">Harmonic Web Audio notification</span>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-purple-100 text-[#3B182E] font-semibold'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Action triggers */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={handleSendTestNotification}
              className="flex-1 py-2 px-3 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl font-medium transition-colors cursor-pointer text-center"
            >
              Trigger Test Alert
            </button>

            <button
              onClick={() => {
                onTriggerCheck();
                setShowSettings(false);
              }}
              className="flex-1 py-2 px-3 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-xl font-semibold transition-colors cursor-pointer text-center"
            >
              Check Now
            </button>
          </div>
        </div>
      ) : (
        /* Alerts List */
        <div className="max-h-[420px] overflow-y-auto divide-y divide-neutral-150 p-2 space-y-1">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const plant = plants.find((p) => p.id === alert.plantId);
              return (
                <div key={alert.id} className="p-3 hover:bg-neutral-50 rounded-2xl transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={alert.plantPhoto || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg'}
                        alt={alert.plantName}
                        className="w-9 h-9 rounded-xl object-cover border border-neutral-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#3B182E]">
                          {alert.type === 'watering' && <Droplets className="w-3 h-3 text-blue-600 shrink-0" />}
                          {alert.type === 'feeding' && <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />}
                          <span className="uppercase">{alert.type} Due</span>
                        </div>
                        <h4 className="font-bold text-neutral-900 truncate text-xs">{alert.plantName}</h4>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                        alert.urgency === 'overdue'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {alert.urgency === 'overdue' ? 'Overdue' : 'Due Today'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 leading-relaxed bg-[#FAF7F5] p-2 rounded-xl border border-neutral-150">
                    {alert.reason}
                  </p>

                  {/* Direct 1-Click Action */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => {
                        if (alert.type === 'watering') onQuickWater(alert.plantId);
                        else if (alert.type === 'feeding') onQuickFeed(alert.plantId);
                        else if (plant) onViewPlant(plant);
                      }}
                      className="py-1 px-3 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                    >
                      <Check className="w-3 h-3" />
                      <span>{alert.type === 'watering' ? 'Mark Watered' : 'Mark Fed'}</span>
                    </button>

                    {plant && (
                      <button
                        onClick={() => {
                          onViewPlant(plant);
                          onClose();
                        }}
                        className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <span>View Plant</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 space-y-2">
              <Check className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-neutral-800 text-xs">Garden Fully Hydrated & Nourished</p>
              <p className="text-[11px] text-neutral-400">
                All plants are within their optimal watering and nutrient intervals based on their profiles.
              </p>
              <button
                onClick={handleSendTestNotification}
                className="mt-2 text-[11px] text-[#3B182E] font-semibold underline cursor-pointer"
              >
                Send a sample watering notification
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-neutral-100/60 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Dynamic Profile Calculations</span>
        <button
          onClick={onTriggerCheck}
          className="text-[#3B182E] font-semibold hover:underline cursor-pointer"
        >
          Refresh Schedule
        </button>
      </div>
    </div>
  );
};
