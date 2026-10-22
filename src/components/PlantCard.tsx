import React from 'react';
import { Plant, HealthStatus } from '../types/plant';
import { Activity, Calendar, Droplets, ArrowRight } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onSelect: (plant: Plant) => void;
  onAssess: (plant: Plant) => void;
  onQuickCare?: (plant: Plant) => void;
  onQuickWater?: (plant: Plant) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onSelect,
  onAssess,
  onQuickCare,
  onQuickWater,
}) => {
  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return { label: 'Healthy', className: 'text-emerald-700 font-medium' };
      case 'suspected_issue':
        return { label: 'Needs Attention', className: 'text-amber-700 font-medium' };
      case 'under_treatment':
        return { label: 'Under Treatment', className: 'text-purple-700 font-medium' };
      case 'recovering':
        return { label: 'Recovering', className: 'text-teal-700 font-medium' };
      case 'deteriorating':
        return { label: 'Deteriorating', className: 'text-rose-700 font-medium' };
      default:
        return { label: 'Not Assessed', className: 'text-neutral-500 font-medium' };
    }
  };

  const statusInfo = getStatusBadge(plant.healthStatus);
  const nextTask = plant.careTasks?.find((t) => !t.isCompleted);
  const latestAssessment = plant.assessments?.[0];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Plant Image Header */}
      <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden cursor-pointer" onClick={() => onSelect(plant)}>
        <img
          src={plant.primaryPhotoUrl || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg'}
          alt={plant.nickname}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Unboxed Metadata Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 text-white">
          <p className="text-base font-bold tracking-tight truncate leading-tight drop-shadow-xs">
            {plant.nickname}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/90 truncate mt-0.5">
            <span className="truncate italic">{plant.commonName}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize text-white/80 shrink-0">{plant.growthStage}</span>
          </div>
        </div>
      </div>

      {/* Card Content & Diagnostics */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Status Line: Zero-Pill Unboxed format */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className={statusInfo.className}>{statusInfo.label}</span>
            <span aria-hidden="true">·</span>
            <span>{plant.isIndoor ? 'Indoor' : 'Outdoor'}</span>
          </div>
          <span className="text-neutral-400 tabular-nums">
            {plant.lastAssessedDate ? `Assessed ${plant.lastAssessedDate}` : 'New Plant'}
          </span>
        </div>

        {/* Recent Observation / Finding Summary */}
        {latestAssessment ? (
          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
            {latestAssessment.observedConditionSummary}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic">
            No health assessment recorded yet. Click assess to run an evidence-based check.
          </p>
        )}

        {/* Upcoming Care Task */}
        {nextTask ? (
          <div className="flex items-center justify-between text-xs bg-[#FAF7F5] p-2 rounded-lg border border-neutral-150">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-[#3B182E] shrink-0" />
              <span className="text-neutral-800 font-medium truncate">{nextTask.title}</span>
            </div>
            <span className="text-[11px] text-neutral-500 shrink-0 tabular-nums ml-2">
              Due {nextTask.dueDate}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 p-2 bg-neutral-50 rounded-lg">
            <Droplets className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>All scheduled tasks complete</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-1.5">
          {onQuickWater && (
            <button
              onClick={() => onQuickWater(plant)}
              className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              title={`Record watering for ${plant.nickname}`}
            >
              <Droplets className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onAssess(plant)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium text-[#3B182E] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer truncate"
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Assess</span>
          </button>

          <button
            onClick={() => onSelect(plant)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <span>Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
