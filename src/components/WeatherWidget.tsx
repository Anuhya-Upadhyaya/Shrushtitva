import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CloudSun,
  Droplets,
  Thermometer,
  Calendar,
  AlertTriangle,
  Compass,
  MapPin,
  RefreshCw,
  Sprout,
  Sun,
} from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [location, setLocation] = useState('Bengaluru, Karnataka, India');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('October / November');

  const fetchWeather = async (loc?: string) => {
    setIsLoading(true);
    try {
      const data = await api.getWeather(loc || location);
      setWeatherData(data);
    } catch (e) {
      console.error('Failed to fetch weather', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`;
          setLocation(`Local Coordinates (${coords})`);
          fetchWeather(`Local Coordinates (${coords})`);
        },
        () => {
          alert('Location permission not granted. You can still select your city manually.');
        }
      );
    }
  };

  const REGIONAL_CALENDARS = [
    {
      season: 'Autumn / Post-Monsoon (Oct - Nov)',
      suitableCrops: ['Tomatoes', 'Brinjal (Eggplant)', 'Spinach (Palak)', 'Fenugreek (Methi)', 'Radish', 'Coriander', 'Marigold'],
      careFocus: 'Moderate daily sun, morning deep hydration, dry leaf mulch over containers.',
    },
    {
      season: 'Winter Cultivation (Dec - Jan)',
      suitableCrops: ['Peas', 'Carrots', 'Beetroot', 'Lettuce', 'Strawberries', 'Petunias', 'Dahlia'],
      careFocus: 'Reduce watering frequency; watch for powdery mildew on leaves during humid mornings.',
    },
    {
      season: 'Summer Sowing (Feb - May)',
      suitableCrops: ['Okra (Bhindi)', 'Bottle Gourd', 'Cucumber', 'Zinnia', 'Portulaca', 'Chili'],
      careFocus: 'Provide afternoon 50% shade netting on terraces; water twice daily during peak heatwaves.',
    },
    {
      season: 'Monsoon Gardening (Jun - Sep)',
      suitableCrops: ['Turmeric', 'Ginger', 'Beans', 'Jasmine', 'Hibiscus', 'Curry Leaf'],
      careFocus: 'Elevate containers on pot feet to ensure unimpeded bottom drainage; preventative neem sprays against fungus.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Regional Climate & Sowing Calendar</h1>
          <p className="text-xs text-neutral-500">
            Localized weather alerts, microclimate care tips, and optimal seasonal planting cycles
          </p>
        </div>

        {/* Location selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-700">
            <MapPin className="w-3.5 h-3.5 text-[#3B182E]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => fetchWeather(location)}
              className="bg-transparent focus:outline-none w-48 font-medium truncate"
              placeholder="Enter your city..."
            />
          </div>

          <button
            onClick={handleUseCurrentLocation}
            className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-xl transition-colors cursor-pointer"
            title="Use device geolocation"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Conditions Card */}
      {weatherData && (
        <div className="bg-gradient-to-br from-[#3B182E] to-[#250F1D] text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#F7D6C8] font-semibold uppercase tracking-wider">
                <CloudSun className="w-4 h-4" />
                <span>Current Garden Microclimate</span>
              </div>
              <h2 className="text-3xl font-bold mt-1">{weatherData.temperatureCelsius}°C</h2>
              <p className="text-xs text-neutral-300 mt-0.5">{weatherData.condition} · {weatherData.location}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <div>
                <span className="text-white/60 block text-[11px]">Relative Humidity</span>
                <span className="font-bold text-white text-sm tabular-nums">{weatherData.humidityPercent}%</span>
              </div>
              <div>
                <span className="text-white/60 block text-[11px]">Rainfall Risk</span>
                <span className="font-bold text-white text-sm">{weatherData.rainfallRisk}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[11px]">UV Index</span>
                <span className="font-bold text-white text-sm tabular-nums">{weatherData.uvIndex} (Moderate)</span>
              </div>
            </div>
          </div>

          {/* Regional Alert Banner */}
          <div className="p-4 bg-white/10 rounded-2xl border border-white/15 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#F7D6C8] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{weatherData.seasonalCalendar?.seasonName}</span>
            </div>
            <p className="text-neutral-200 text-[11px] leading-relaxed">
              {weatherData.seasonalCalendar?.careAlert}
            </p>
          </div>
        </div>
      )}

      {/* Sowing & Planting Regional Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Regional Indian Sowing & Planting Calendar</h3>
          <span className="text-xs text-neutral-500">Tailored to Indian balcony & terrace conditions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REGIONAL_CALENDARS.map((cal, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-[#3B182E]">
                <Calendar className="w-4 h-4 text-[#C85A80]" />
                <span>{cal.season}</span>
              </div>

              <div className="text-xs space-y-1">
                <span className="font-semibold text-neutral-800 block">Recommended for Sowing:</span>
                <div className="flex flex-wrap gap-1.5">
                  {cal.suitableCrops.map((crop, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-medium text-[11px]"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 text-xs">
                <span className="font-semibold text-neutral-700 block mb-0.5">Critical Care Advice:</span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">{cal.careFocus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
