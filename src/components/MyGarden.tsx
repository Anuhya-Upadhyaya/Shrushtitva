import React, { useState, useMemo } from 'react';
import { Plant, PlantCategory, HealthStatus } from '../types/plant';
import { PlantCard } from './PlantCard';
import { Search, Plus, Sparkles, Filter, AlertTriangle, Droplets, Heart } from 'lucide-react';

interface MyGardenProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onAssessPlant: (plant: Plant) => void;
  onOpenAddPlant: () => void;
  onOpenCareCalendar: () => void;
  onQuickWater?: (plant: Plant) => void;
}

export const MyGarden: React.FC<MyGardenProps> = ({
  plants,
  onSelectPlant,
  onAssessPlant,
  onOpenAddPlant,
  onOpenCareCalendar,
  onQuickWater,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status'>('recent');

  // Quantitative Garden Metrics
  const stats = useMemo(() => {
    const total = plants.length;
    const attention = plants.filter((p) => p.healthStatus === 'suspected_issue' || p.healthStatus === 'deteriorating').length;
    const treatments = plants.filter((p) => p.healthStatus === 'under_treatment').length;
    const healthy = plants.filter((p) => p.healthStatus === 'healthy' || p.healthStatus === 'recovering').length;
    const pendingTasks = plants.flatMap((p) => p.careTasks || []).filter((t) => !t.isCompleted).length;
    return { total, attention, treatments, healthy, pendingTasks };
  }, [plants]);

  // Filtered & Sorted Plants
  const filteredPlants = useMemo(() => {
    return plants
      .filter((plant) => {
        const matchesSearch =
          plant.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plant.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (plant.scientificName && plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || plant.healthStatus === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.nickname.localeCompare(b.nickname);
        if (sortBy === 'status') return a.healthStatus.localeCompare(b.healthStatus);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [plants, searchQuery, selectedCategory, selectedStatus, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero / Garden Banner with Authentic Editorial Aesthetics */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xs bg-[#3B182E] text-white">
        <div className="absolute inset-0 opacity-25">
          <img
            src="/src/assets/images/hero_botanical_garden_1792637746803.jpg"
            alt="Botanical Home Terrace"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative px-6 py-10 sm:px-10 sm:py-12 max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-[#F7D6C8] font-semibold mb-2">
            Intelligent Personalized Care
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3" style={{ textWrap: 'balance' }}>
            Nurture your living garden with scientific clarity and gentle remedies
          </h1>
          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-2xl">
            Shrushtitva guides you through plant diagnosis, suspected causes, affordable kitchen-pantry treatments, and actual recovery tracking.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddPlant}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#3B182E] rounded-xl text-xs font-bold hover:bg-[#FAF7F5] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Plant</span>
            </button>
            <button
              onClick={onOpenCareCalendar}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
            >
              <Droplets className="w-4 h-4 text-[#F7D6C8]" />
              <span>Care Calendar ({stats.pendingTasks} tasks due)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quantitative Strip: Tabular Numbers & Clean Dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <p className="text-xs text-neutral-500 font-medium">Total Managed Plants</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 tabular-nums">{stats.total}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
            <Heart className="w-3 h-3 text-emerald-600" />
            <span>{stats.healthy} flourishing</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <p className="text-xs text-neutral-500 font-medium">Under Treatment</p>
          <p className="text-2xl font-bold text-purple-900 mt-1 tabular-nums">{stats.treatments}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Active homemade remedies</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <p className="text-xs text-neutral-500 font-medium">Needs Attention</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.attention}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Suspected symptoms</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <p className="text-xs text-neutral-500 font-medium">Care Tasks Pending</p>
          <p className="text-2xl font-bold text-[#3B182E] mt-1 tabular-nums">{stats.pendingTasks}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
            <Droplets className="w-3 h-3 text-blue-600" />
            <span>Watering & inspection</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plants by name, variety or species..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Sort:</span>
            <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortBy === 'recent' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortBy === 'name' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setSortBy('status')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortBy === 'status' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Status
              </button>
            </div>
          </div>
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-neutral-400 font-medium">Category:</span>
          {[
            { id: 'all', label: 'All Plants' },
            { id: 'indoor_houseplant', label: 'Indoor Houseplants' },
            { id: 'vegetable', label: 'Vegetables' },
            { id: 'herb', label: 'Herbs & Aromatic' },
            { id: 'flowering', label: 'Flowering' },
            { id: 'succulent_cactus', label: 'Succulents' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#3B182E] text-white font-medium shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onSelect={onSelectPlant}
              onAssess={onAssessPlant}
              onQuickCare={() => onSelectPlant(plant)}
              onQuickWater={onQuickWater}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-300 p-8">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">No plants matched your criteria</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5">
            Try adjusting your search terms or filters to find plants in your garden.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
