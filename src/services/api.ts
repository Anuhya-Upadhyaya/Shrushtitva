import { Plant, HealthAssessment, TreatmentRecord, FollowUpRecord, SoilTestRecord, CareTask, UserProfile, ChatMessage, GrowthMetricLog, PlantPhoto, GrowthStage } from '../types/plant';

const TOKEN_KEY = 'shrushtitva_auth_token';
const CACHE_PLANTS_KEY = 'shrushtitva_cached_plants';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Authentication
  async getMe(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const data = await request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async signup(payload: { email: string; password: string; name: string; preferredLanguage?: string; locationName?: string }): Promise<{ user: UserProfile; token: string }> {
    const data = await request<{ user: UserProfile; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    return data;
  },

  async guestLogin(): Promise<{ user: UserProfile; token: string }> {
    const data = await request<{ user: UserProfile; token: string }>('/api/auth/guest-login', {
      method: 'POST',
    });
    setStoredToken(data.token);
    return data;
  },

  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await request<{ message: string }>('/api/auth/delete-account', {
      method: 'POST',
    });
    setStoredToken(null);
    return res;
  },

  logout() {
    setStoredToken(null);
  },

  // Plants
  async getPlants(): Promise<Plant[]> {
    try {
      const plants = await request<Plant[]>('/api/plants');
      // Update offline cache
      try {
        localStorage.setItem(CACHE_PLANTS_KEY, JSON.stringify(plants));
      } catch (e) {
        // storage quota ignored
      }
      return plants;
    } catch (err) {
      // Fallback to local cache if offline
      const cached = localStorage.getItem(CACHE_PLANTS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
      throw err;
    }
  },

  async getPlant(id: string): Promise<Plant> {
    return request<Plant>(`/api/plants/${id}`);
  },

  async createPlant(plantData: Partial<Plant>): Promise<Plant> {
    return request<Plant>('/api/plants', {
      method: 'POST',
      body: JSON.stringify(plantData),
    });
  },

  async updatePlant(id: string, plantData: Partial<Plant>): Promise<Plant> {
    return request<Plant>(`/api/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plantData),
    });
  },

  async deletePlant(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/plants/${id}`, {
      method: 'DELETE',
    });
  },

  async waterPlant(id: string, quantityApplied?: string, notes?: string): Promise<{ message: string; plant: Plant }> {
    return request<{ message: string; plant: Plant }>(`/api/plants/${id}/water`, {
      method: 'POST',
      body: JSON.stringify({ quantityApplied, notes }),
    });
  },

  async feedPlant(id: string, product?: string, quantityApplied?: string, notes?: string): Promise<{ message: string; plant: Plant }> {
    return request<{ message: string; plant: Plant }>(`/api/plants/${id}/feed`, {
      method: 'POST',
      body: JSON.stringify({ product, quantityApplied, notes }),
    });
  },

  async logGrowthMetric(
    plantId: string,
    data: {
      heightCm?: number;
      leafCount?: number;
      stemDiameterMm?: number;
      notes?: string;
      milestone?: string;
      date?: string;
    }
  ): Promise<{ message: string; metric: GrowthMetricLog; plant: Plant }> {
    return request<{ message: string; metric: GrowthMetricLog; plant: Plant }>(`/api/plants/${plantId}/growth`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteGrowthMetric(plantId: string, metricId: string): Promise<{ message: string; plant: Plant }> {
    return request<{ message: string; plant: Plant }>(`/api/plants/${plantId}/growth/${metricId}`, {
      method: 'DELETE',
    });
  },

  // Photo Timeline Management
  async addPlantPhoto(
    plantId: string,
    photoData: {
      url: string;
      caption?: string;
      date?: string;
      stage?: GrowthStage;
      context?: 'baseline' | 'symptom_assessment' | 'treatment_application' | 'follow_up' | 'recovery_milestone';
    }
  ): Promise<{ message: string; photo: PlantPhoto; plant: Plant }> {
    return request<{ message: string; photo: PlantPhoto; plant: Plant }>(`/api/plants/${plantId}/photos`, {
      method: 'POST',
      body: JSON.stringify(photoData),
    });
  },

  async deletePlantPhoto(plantId: string, photoId: string): Promise<{ message: string; plant: Plant }> {
    return request<{ message: string; plant: Plant }>(`/api/plants/${plantId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  // Health Assessment
  async analyzeHealth(payload: {
    plantId?: string;
    commonName: string;
    scientificName?: string;
    category?: string;
    symptomsObserved: string[];
    leafZoneAffected?: string;
    durationOfSymptoms?: string;
    soilMoistureState?: string;
    recentTreatmentsOrFertilizers?: string;
    pestsVisible?: boolean;
    additionalDescription?: string;
    photoBase64?: string;
    mimeType?: string;
  }): Promise<any> {
    return request<any>('/api/assessments/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async saveAssessment(payload: { plantId: string; assessmentData: any; photoUrl?: string }): Promise<{ assessment: HealthAssessment; plant: Plant }> {
    return request<{ assessment: HealthAssessment; plant: Plant }>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Treatments
  async recordTreatment(payload: Partial<TreatmentRecord>): Promise<{ record: TreatmentRecord; plant: Plant }> {
    return request<{ record: TreatmentRecord; plant: Plant }>('/api/treatments/record', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Follow-ups
  async recordFollowUp(payload: Partial<FollowUpRecord>): Promise<{ followUp: FollowUpRecord; plant: Plant }> {
    return request<{ followUp: FollowUpRecord; plant: Plant }>('/api/follow-ups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Soil & Nutrient Lab Tests
  async recordSoilTest(payload: Partial<SoilTestRecord>): Promise<{ soilTest: SoilTestRecord; plant: Plant }> {
    return request<{ soilTest: SoilTestRecord; plant: Plant }>('/api/soil-tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Tasks
  async getTasks(): Promise<CareTask[]> {
    return request<CareTask[]>('/api/care-tasks');
  },

  async createTask(taskData: Partial<CareTask>): Promise<CareTask> {
    return request<CareTask>('/api/care-tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id: string, updates: Partial<CareTask>): Promise<{ task: CareTask; plant: Plant }> {
    return request<{ task: CareTask; plant: Plant }>(`/api/care-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // AI Assistant Chat
  async sendChatMessage(message: string, plantId?: string): Promise<{ reply: string }> {
    return request<{ reply: string }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, plantId }),
    });
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    return request<ChatMessage[]>('/api/assistant/history');
  },

  // Weather & Sowing Calendar
  async getWeather(location?: string): Promise<any> {
    const url = location ? `/api/weather?location=${encodeURIComponent(location)}` : '/api/weather';
    return request<any>(url);
  },
};
