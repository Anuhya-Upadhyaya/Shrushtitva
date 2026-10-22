import { Plant, CareAlert, NotificationSettings } from '../types/plant';

const SETTINGS_KEY = 'shrushtitva_notification_settings';
const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  toastEnabled: true,
  preferredTime: '08:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
};

type AlertListener = (alert: CareAlert) => void;
const listeners: Set<AlertListener> = new Set();

export const notificationService = {
  getSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: NotificationSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support desktop notifications');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const current = this.getSettings();
        this.saveSettings({ ...current, pushEnabled: true });
      }
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission', err);
      return 'denied';
    }
  },

  isPushSupported(): boolean {
    return 'Notification' in window;
  },

  getPermissionState(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Soft botanical chime using Web Audio API (zero external asset dependency)
  playChime() {
    try {
      const settings = this.getSettings();
      if (!settings.soundEnabled) return;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Gentle two-tone marimba chime (E5 -> B5)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12); // B5
      gain2.gain.setValueAtTime(0.1, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // Audio playback blocked by browser gesture rules
    }
  },

  // Plant-profile-driven schedule evaluator
  calculatePlantAlerts(plants: Plant[]): CareAlert[] {
    const alerts: CareAlert[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const plant of plants) {
      if (plant.isArchived) continue;

      // 1. WATERING EVALUATION
      const lastWatered = plant.lastWateredDate ? new Date(plant.lastWateredDate) : new Date(plant.createdAt);
      const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));

      let wateringIntervalDays = 3; // default
      let reasonDetail = '';

      switch (plant.wateringRoutine) {
        case 'daily':
          wateringIntervalDays = 1;
          reasonDetail = 'Daily schedule for sun-exposed or high-transpiration containers.';
          break;
        case 'alternate_days':
          wateringIntervalDays = 2;
          reasonDetail = 'Alternate-day cycle for warm climate or fast-draining potting mix.';
          break;
        case 'twice_a_week':
          wateringIntervalDays = 3.5;
          reasonDetail = 'Twice-weekly standard for moderate indoor and semi-shaded plants.';
          break;
        case 'weekly':
          wateringIntervalDays = 7;
          reasonDetail = 'Weekly hydration schedule for established foliage.';
          break;
        case 'when_top_dry':
          // Adjusted dynamically by pot type, sunlight, and growth stage
          if (plant.potBedDetails.toLowerCase().includes('terracotta') || plant.sunlightExposure === 'direct_full_sun') {
            wateringIntervalDays = plant.growthStage === 'fruiting' || plant.growthStage === 'flowering' ? 1.5 : 2.5;
            reasonDetail = 'Porous terracotta and high sun exposure accelerate evaporation during active growth.';
          } else {
            wateringIntervalDays = 4;
            reasonDetail = 'Ceramic/plastic pot retains root-zone moisture; checking top 2 inches.';
          }
          break;
        case 'bi_weekly':
          wateringIntervalDays = 14;
          reasonDetail = 'Drought-tolerant succulent/aroid schedule.';
          break;
      }

      if (daysSinceWatered >= wateringIntervalDays) {
        const isOverdue = daysSinceWatered > wateringIntervalDays + 1;
        alerts.push({
          id: `alert_water_${plant.id}_${todayStr}`,
          plantId: plant.id,
          plantName: plant.nickname,
          commonName: plant.commonName,
          plantPhoto: plant.primaryPhotoUrl,
          type: 'watering',
          title: `Watering Due: ${plant.nickname}`,
          reason: `Last watered ${daysSinceWatered} day${daysSinceWatered === 1 ? '' : 's'} ago. ${reasonDetail}`,
          recommendedAmount: plant.category === 'vegetable' ? '800ml – 1.2L' : '400ml – 600ml',
          urgency: isOverdue ? 'overdue' : 'due_today',
          dueDate: todayStr,
          createdAt: now.toISOString(),
        });
      }

      // 2. FEEDING & NUTRIENT EVALUATION
      const lastFed = plant.lastFedDate ? new Date(plant.lastFedDate) : new Date(plant.createdAt);
      const daysSinceFed = Math.floor((now.getTime() - lastFed.getTime()) / (1000 * 60 * 60 * 24));

      // Feeding interval determined by growth stage & species needs
      let feedingIntervalDays = 14; // default fortnightly
      let feedingReason = '';
      let recommendedFeed = 'Dilute Aerated Compost Tea (1:1 with water)';

      if (plant.growthStage === 'fruiting' || plant.growthStage === 'flowering') {
        feedingIntervalDays = 10;
        feedingReason = `Heavy nutrient sink during ${plant.growthStage} stage. Potassium & micronutrients prevent blossom drop.`;
        recommendedFeed = 'Epsom Salt Foliar Spray (10g/L) or Potassium-rich banana peel ferment';
      } else if (plant.category === 'herb') {
        feedingIntervalDays = 21;
        feedingReason = 'Herbs prefer light, steady feeding to preserve volatile essential oils.';
        recommendedFeed = 'Light vermicompost top-dressing (2 tablespoons)';
      } else if (plant.growthStage === 'seedling') {
        feedingIntervalDays = 28;
        feedingReason = 'Tender roots require minimal fertilization to prevent osmotic burn.';
        recommendedFeed = 'Half-strength seaweed liquid extract';
      }

      if (daysSinceFed >= feedingIntervalDays) {
        alerts.push({
          id: `alert_feed_${plant.id}_${todayStr}`,
          plantId: plant.id,
          plantName: plant.nickname,
          commonName: plant.commonName,
          plantPhoto: plant.primaryPhotoUrl,
          type: 'feeding',
          title: `Feeding Due: ${plant.nickname}`,
          reason: `${feedingReason} (Last fed ${daysSinceFed} days ago)`,
          recommendedAmount: recommendedFeed,
          urgency: 'due_today',
          dueDate: todayStr,
          createdAt: now.toISOString(),
        });
      }

      // 3. TREATMENT FOLLOW-UP EVALUATION
      const activeTreatment = plant.treatmentRecords?.[0];
      if (activeTreatment && activeTreatment.expectedFollowUpDate) {
        const followUpDue = new Date(activeTreatment.expectedFollowUpDate);
        if (now >= followUpDue && (!plant.followUpRecords || plant.followUpRecords.length === 0 || plant.followUpRecords[0].followUpDate < activeTreatment.expectedFollowUpDate)) {
          alerts.push({
            id: `alert_fup_${plant.id}_${todayStr}`,
            plantId: plant.id,
            plantName: plant.nickname,
            commonName: plant.commonName,
            plantPhoto: plant.primaryPhotoUrl,
            type: 'treatment_follow_up',
            title: `Treatment Follow-Up: ${plant.nickname}`,
            reason: `Scheduled inspection for ${activeTreatment.productOrIngredients[0] || 'remedy'}. Compare current leaves against baseline photos.`,
            recommendedAmount: 'Visual inspection & symptom regreening check',
            urgency: 'due_today',
            dueDate: activeTreatment.expectedFollowUpDate,
            createdAt: now.toISOString(),
          });
        }
      }
    }

    return alerts;
  },

  // Send a native Web Push Notification if allowed
  sendBrowserNotification(alert: CareAlert) {
    if (!this.isPushSupported()) return;
    if (Notification.permission !== 'granted') return;

    const settings = this.getSettings();
    if (!settings.pushEnabled) return;

    try {
      const notif = new Notification(alert.title, {
        body: `${alert.reason}\nAction: ${alert.recommendedAmount || 'Check plant'}`,
        icon: alert.plantPhoto || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg',
        badge: '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg',
        tag: alert.id,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      this.playChime();
    } catch (e) {
      console.warn('Native push notification error', e);
    }
  },

  // Trigger Toast Listener
  emitToast(alert: CareAlert) {
    listeners.forEach((listener) => listener(alert));
    this.sendBrowserNotification(alert);
  },

  subscribe(listener: AlertListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
