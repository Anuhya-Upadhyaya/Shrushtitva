import React, { useState } from 'react';
import { Plant, CareTask } from '../types/plant';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Droplets,
  Sparkles,
  Scissors,
  Bug,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface CareCalendarProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onRefreshData: () => void;
}

export const CareCalendar: React.FC<CareCalendarProps> = ({
  plants,
  onSelectPlant,
  onRefreshData,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string>(plants[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskType, setTaskType] = useState<any>('watering');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<number>(3);

  // Collect all tasks across user plants
  const allTasks: CareTask[] = plants.flatMap((p) => p.careTasks || []);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'fertilizer':
      case 'treatment_application':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'pruning':
        return <Scissors className="w-4 h-4 text-amber-600" />;
      case 'pest_inspection':
        return <Bug className="w-4 h-4 text-rose-600" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-neutral-600" />;
    }
  };

  const handleToggleComplete = async (task: CareTask) => {
    try {
      await api.updateTask(task.id, { isCompleted: !task.isCompleted });
      onRefreshData();
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  const handleSnooze = async (task: CareTask, days: number) => {
    try {
      const current = new Date(task.dueDate);
      current.setDate(current.getDate() + days);
      await api.updateTask(task.id, { dueDate: current.toISOString().split('T')[0] });
      onRefreshData();
    } catch (e) {
      console.error('Failed to snooze task', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedPlantId) return;

    try {
      await api.createTask({
        plantId: selectedPlantId,
        title: taskTitle,
        taskType,
        dueDate,
        recurrenceDays: recurrence > 0 ? recurrence : undefined,
      });
      setIsAddingTask(false);
      setTaskTitle('');
      onRefreshData();
    } catch (e) {
      console.error('Failed to create task', e);
    }
  };

  const filteredTasks = allTasks
    .filter((task) => {
      if (filterType === 'pending') return !task.isCompleted;
      if (filterType === 'completed') return task.isCompleted;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Personalized Plant-Care Calendar</h1>
          <p className="text-xs text-neutral-500">
            Automated routines, treatment follow-ups, and inspection schedules for your garden
          </p>
        </div>

        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Care Task</span>
        </button>
      </div>

      {/* Task Creation Drawer */}
      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-4 text-xs shadow-sm">
          <h3 className="font-bold text-neutral-900 text-sm">Schedule New Plant Task</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Target Plant</label>
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} ({p.commonName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-700 block mb-1">Task Category</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
              >
                <option value="watering">Watering</option>
                <option value="fertilizer">Fertilizer / Compost Tea</option>
                <option value="pest_inspection">Pest & Leaf Inspection</option>
                <option value="pruning">Pruning / Pinching</option>
                <option value="treatment_application">Treatment Application</option>
                <option value="treatment_follow_up">Treatment Follow-Up</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-700 block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="font-bold text-neutral-700 block mb-1">Task Title / Instructions</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Check soil moisture 2 inches deep before watering"
                className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="font-bold text-neutral-700 block mb-1">Repeats Every (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={recurrence}
                  onChange={(e) => setRecurrence(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-[#3B182E] rounded-xl hover:bg-[#2B1020] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize cursor-pointer transition-colors ${
              filterType === f
                ? 'bg-[#3B182E] text-white'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {f} Tasks
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const plant = plants.find((p) => p.id === task.plantId);
            return (
              <div
                key={task.id}
                className={`p-4 bg-white rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.isCompleted ? 'border-neutral-200 opacity-60 bg-neutral-50' : 'border-neutral-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      task.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'border border-neutral-300 hover:border-[#3B182E] bg-white'
                    }`}
                    title={task.isCompleted ? 'Mark as incomplete' : 'Mark completed'}
                  >
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    {getTaskIcon(task.taskType)}
                  </div>

                  <div className="truncate text-xs">
                    <p
                      className={`font-semibold ${
                        task.isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'
                      } truncate`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span className="font-medium text-[#3B182E]">{task.plantName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Due {task.dueDate}</span>
                      {task.recurrenceDays && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Every {task.recurrenceDays} days</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto text-xs shrink-0">
                  {!task.isCompleted && (
                    <>
                      <button
                        onClick={() => handleSnooze(task, 1)}
                        className="px-2.5 py-1 text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => handleSnooze(task, 3)}
                        className="px-2.5 py-1 text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                      >
                        +3 Days
                      </button>
                    </>
                  )}

                  {plant && (
                    <button
                      onClick={() => onSelectPlant(plant)}
                      className="p-1.5 text-neutral-400 hover:text-[#3B182E] rounded-lg transition-colors cursor-pointer"
                      title="View plant profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-neutral-800">You are all caught up!</p>
            <p className="text-neutral-500">No pending care tasks in your garden today.</p>
          </div>
        )}
      </div>
    </div>
  );
};
