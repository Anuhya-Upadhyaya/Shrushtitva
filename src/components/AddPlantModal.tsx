import React, { useState } from 'react';
import { Plant, PlantCategory, GrowthStage, SunlightCondition, WateringRoutine, DrainageCondition } from '../types/plant';
import { api } from '../services/api';
import { X, Upload, Camera, Plus, Loader2, AlertCircle } from 'lucide-react';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlantCreated: (plant: Plant) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
  onPlantCreated,
}) => {
  const [nickname, setNickname] = useState('');
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState<PlantCategory>('indoor_houseplant');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [isIndoor, setIsIndoor] = useState<boolean>(true);
  const [locationDetails, setLocationDetails] = useState('Living room window');
  const [potBedDetails, setPotBedDetails] = useState('10-inch ceramic pot with drainage');
  const [soilMedium, setSoilMedium] = useState('Potting soil + compost mix');
  const [sunlight, setSunlight] = useState<SunlightCondition>('bright_indirect');
  const [watering, setWatering] = useState<WateringRoutine>('when_top_dry');
  const [drainage, setDrainage] = useState<DrainageCondition>('adequate');
  const [plantingMethod, setPlantingMethod] = useState<'seed' | 'cutting' | 'nursery_transplant' | 'gift_or_division' | 'unknown'>('nursery_transplant');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoBase64(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !commonName.trim()) {
      setError('Please provide a plant nickname and common species name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPlant = await api.createPlant({
        nickname: nickname.trim(),
        commonName: commonName.trim(),
        scientificName: scientificName.trim() || undefined,
        category,
        growthStage,
        isIndoor,
        locationDetails,
        potBedDetails,
        soilMedium,
        sunlightExposure: sunlight,
        wateringRoutine: watering,
        drainageCondition: drainage,
        plantingMethod,
        primaryPhotoUrl: photoBase64 || photoPreview,
        additionalNotes,
      });

      onPlantCreated(newPlant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create plant record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7F5]">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Add Plant to Garden</h2>
            <p className="text-xs text-neutral-500">Every plant receives its own persistent medical & care record</p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & Basic Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-1">
              <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 relative group">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px] font-semibold">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Plant Nickname <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Monty, Greenie, Sweet Basil"
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Common Species Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  placeholder="e.g. Monstera Deliciosa, Tomato, Tulsi"
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Scientific Name (Optional)</label>
              <input
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Ocimum tenuiflorum"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl italic"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Plant Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="indoor_houseplant">Indoor Houseplant</option>
                <option value="vegetable">Vegetable / Edible</option>
                <option value="herb">Herb & Aromatic</option>
                <option value="flowering">Flowering Plant</option>
                <option value="succulent_cactus">Succulent & Cactus</option>
                <option value="shrub_tree">Shrub or Tree</option>
                <option value="climber_vine">Climber / Vine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Current Growth Stage</label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="seed">Seed / Germinating</option>
                <option value="seedling">Seedling</option>
                <option value="vegetative">Vegetative Growth</option>
                <option value="budding">Budding</option>
                <option value="flowering">Flowering</option>
                <option value="fruiting">Fruiting</option>
                <option value="mature">Established Mature</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Location Placement</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsIndoor(true)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isIndoor
                      ? 'bg-[#3B182E] text-white border-[#3B182E]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Indoor Room
                </button>
                <button
                  type="button"
                  onClick={() => setIsIndoor(false)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    !isIndoor
                      ? 'bg-[#3B182E] text-white border-[#3B182E]'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Balcony / Terrace / Outdoor
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Sunlight Exposure</label>
              <select
                value={sunlight}
                onChange={(e) => setSunlight(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="direct_full_sun">Full Direct Sun (6+ hrs)</option>
                <option value="bright_indirect">Bright Indirect Light</option>
                <option value="partial_shade">Partial Sun / Dappled Shade</option>
                <option value="low_light">Low Ambient Light</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Watering Routine</label>
              <select
                value={watering}
                onChange={(e) => setWatering(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="when_top_dry">When Top 1-2 Inches Dry</option>
                <option value="daily">Daily Morning</option>
                <option value="alternate_days">Alternate Days</option>
                <option value="twice_a_week">Twice a Week</option>
                <option value="weekly">Once Weekly</option>
                <option value="bi_weekly">Every 2-3 Weeks (Drought-tolerant)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Pot or Bed Details</label>
              <input
                type="text"
                value={potBedDetails}
                onChange={(e) => setPotBedDetails(e.target.value)}
                placeholder="e.g. 10-inch terracotta pot with saucer"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-800 block mb-1">Potting Medium</label>
              <input
                type="text"
                value={soilMedium}
                onChange={(e) => setSoilMedium(e.target.value)}
                placeholder="e.g. Garden soil + vermicompost + cocopeat"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Initial Observations or Notes (Optional)</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Grown from a cutting gifted by neighbor; loves morning misting."
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
            />
          </div>

          {/* Footer Submit */}
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
                  <span>Adding Plant...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to My Garden</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
