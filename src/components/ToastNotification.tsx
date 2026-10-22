import React, { useState, useEffect } from 'react';
import { CareAlert } from '../types/plant';
import { notificationService } from '../services/notificationService';
import { Droplets, Sparkles, X, Check, Clock, AlertTriangle } from 'lucide-react';

interface ToastNotificationProps {
  onQuickWater: (plantId: string) => void;
  onQuickFeed: (plantId: string) => void;
  onViewPlant: (plantId: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  onQuickWater,
  onQuickFeed,
  onViewPlant,
}) => {
  const [activeAlerts, setActiveAlerts] = useState<CareAlert[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((alert) => {
      setActiveAlerts((prev) => {
        // Prevent duplicate alerts for the same plant and type
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev.slice(0, 2)]; // Keep max 3 simultaneous toasts
      });
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAction = (alert: CareAlert) => {
    if (alert.type === 'watering') {
      onQuickWater(alert.plantId);
    } else if (alert.type === 'feeding') {
      onQuickFeed(alert.plantId);
    } else {
      onViewPlant(alert.plantId);
    }
    handleDismiss(alert.id);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-neutral-200/90 p-4 transition-all animate-in slide-in-from-top-4 duration-300 flex flex-col gap-2.5"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate">
              <img
                src={alert.plantPhoto || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg'}
                alt={alert.plantName}
                className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="truncate">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#3B182E]">
                  {alert.type === 'watering' && <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  {alert.type === 'feeding' && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                  {alert.type === 'treatment_follow_up' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  <span className="capitalize">{alert.type.replace(/_/g, ' ')} Schedule</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 truncate">{alert.plantName}</h4>
              </div>
            </div>

            <button
              onClick={() => handleDismiss(alert.id)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Rationale */}
          <p className="text-[11px] text-neutral-600 leading-relaxed bg-[#FAF7F5] p-2 rounded-lg border border-neutral-150">
            {alert.reason}
          </p>

          {alert.recommendedAmount && (
            <div className="text-[11px] text-neutral-500">
              <span className="font-semibold text-neutral-800">Dose/Amount:</span> {alert.recommendedAmount}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleAction(alert)}
              className="flex-1 py-1.5 px-2.5 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {alert.type === 'watering' ? 'Mark Watered' : alert.type === 'feeding' ? 'Mark Fed' : 'Open Plant'}
              </span>
            </button>

            <button
              onClick={() => handleDismiss(alert.id)}
              className="py-1.5 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Snooze
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
