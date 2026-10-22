import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Plant, GrowthMetricLog } from '../types/plant';
import { api } from '../services/api';
import {
  TrendingUp,
  Leaf,
  Ruler,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';

interface PlantGrowthChartProps {
  plant: Plant;
  onUpdatePlant?: (updatedPlant: Plant) => void;
}

type MetricMode = 'height' | 'leaves' | 'dual';
type TimeWindow = '30d' | '14d' | 'all';
type HeightUnit = 'cm' | 'in';

export const PlantGrowthChart: React.FC<PlantGrowthChartProps> = ({ plant, onUpdatePlant }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Controls state
  const [metricMode, setMetricMode] = useState<MetricMode>('height');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [hoveredData, setHoveredData] = useState<{
    metric: GrowthMetricLog;
    x: number;
    y: number;
    prevMetric?: GrowthMetricLog;
  } | null>(null);

  // Logging form modal state
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logHeight, setLogHeight] = useState('');
  const [logLeaves, setLogLeaves] = useState('');
  const [logStemDiameter, setLogStemDiameter] = useState('');
  const [logMilestone, setLogMilestone] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showHistoryTable, setShowHistoryTable] = useState(false);

  // Growth metrics data sorted by date
  const rawMetrics: GrowthMetricLog[] = useMemo(() => {
    const list = [...(plant.growthMetrics || [])];
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [plant.growthMetrics]);

  // Filtered by selected time window
  const filteredMetrics = useMemo(() => {
    if (rawMetrics.length === 0) return [];
    const now = new Date();
    if (timeWindow === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const filtered = rawMetrics.filter((m) => new Date(m.date) >= cutoff);
      return filtered.length >= 2 ? filtered : rawMetrics.slice(-9);
    }
    if (timeWindow === '14d') {
      const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const filtered = rawMetrics.filter((m) => new Date(m.date) >= cutoff);
      return filtered.length >= 2 ? filtered : rawMetrics.slice(-5);
    }
    return rawMetrics;
  }, [rawMetrics, timeWindow]);

  // Height conversion helper
  const formatHeight = (heightCm: number) => {
    if (heightUnit === 'in') {
      return (heightCm / 2.54).toFixed(1);
    }
    return heightCm.toFixed(1);
  };

  const heightUnitLabel = heightUnit === 'in' ? 'in' : 'cm';

  // Growth Analytics Calculations
  const analytics = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        startHeight: 0,
        currentHeight: 0,
        heightChange: 0,
        heightChangePct: 0,
        startLeaves: 0,
        currentLeaves: 0,
        leafChange: 0,
        dailyHeightRate: 0,
        totalDays: 30,
        milestonesCount: 0,
      };
    }

    const first = filteredMetrics[0];
    const last = filteredMetrics[filteredMetrics.length - 1];

    const firstDate = new Date(first.date).getTime();
    const lastDate = new Date(last.date).getTime();
    const daysDiff = Math.max(1, Math.round((lastDate - firstDate) / (24 * 60 * 60 * 1000)));

    const hDiff = last.heightCm - first.heightCm;
    const hPct = first.heightCm > 0 ? (hDiff / first.heightCm) * 100 : 0;
    const lDiff = last.leafCount - first.leafCount;
    const dailyRate = hDiff / daysDiff;

    const milestones = filteredMetrics.filter((m) => !!m.milestone).length;

    return {
      startHeight: first.heightCm,
      currentHeight: last.heightCm,
      heightChange: hDiff,
      heightChangePct: hPct,
      startLeaves: first.leafCount,
      currentLeaves: last.leafCount,
      leafChange: lDiff,
      dailyHeightRate: dailyRate,
      totalDays: daysDiff,
      milestonesCount: milestones,
    };
  }, [filteredMetrics]);

  // Main D3 Rendering effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredMetrics.length === 0) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = container.clientWidth || 640;
    const height = 300;

    const margin = {
      top: 24,
      right: metricMode === 'dual' ? 52 : 28,
      bottom: 40,
      left: 54,
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions (Gradients and Filters)
    const defs = svg.append('defs');

    // Gradient for Height area
    const heightGrad = defs
      .append('linearGradient')
      .attr('id', 'height-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    heightGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3B182E')
      .attr('stop-opacity', 0.28);

    heightGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3B182E')
      .attr('stop-opacity', 0.0);

    // Gradient for Leaf area
    const leafGrad = defs
      .append('linearGradient')
      .attr('id', 'leaf-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    leafGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#059669')
      .attr('stop-opacity', 0.25);

    leafGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#059669')
      .attr('stop-opacity', 0.0);

    // X Scale (Time)
    const parsedData = filteredMetrics.map((d) => ({
      ...d,
      parsedDate: new Date(d.date),
      displayHeight: heightUnit === 'in' ? d.heightCm / 2.54 : d.heightCm,
    }));

    const dateExtent = d3.extent(parsedData, (d) => d.parsedDate) as [Date, Date];
    const xScale = d3.scaleTime().domain(dateExtent).range([0, innerWidth]);

    // Y Scales
    let yScaleHeight = d3.scaleLinear().range([innerHeight, 0]);
    let yScaleLeaves = d3.scaleLinear().range([innerHeight, 0]);

    const hValues = parsedData.map((d) => d.displayHeight);
    const minH = Math.min(...hValues);
    const maxH = Math.max(...hValues);
    const hPadding = Math.max(1, (maxH - minH) * 0.15);
    yScaleHeight.domain([Math.max(0, minH - hPadding), maxH + hPadding]).nice();

    const lValues = parsedData.map((d) => d.leafCount);
    const minL = Math.min(...lValues);
    const maxL = Math.max(...lValues);
    const lPadding = Math.max(1, (maxL - minL) * 0.2);
    yScaleLeaves.domain([Math.max(0, Math.floor(minL - lPadding)), Math.ceil(maxL + lPadding)]).nice();

    // Horizontal Gridlines
    const activeYScale = metricMode === 'leaves' ? yScaleLeaves : yScaleHeight;
    const yAxisGrid = d3
      .axisLeft(activeYScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#E5E5E5')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.8);

    g.select('.grid .domain').remove();

    // Line and Area Generators
    if (metricMode === 'height' || metricMode === 'dual') {
      const heightArea = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0(innerHeight)
        .y1((d) => yScaleHeight(d.displayHeight))
        .curve(d3.curveMonotoneX);

      const heightLine = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScaleHeight(d.displayHeight))
        .curve(d3.curveMonotoneX);

      // Area fill
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'url(#height-gradient)')
        .attr('d', heightArea);

      // Stroke Line
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#3B182E')
        .attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', heightLine);
    }

    if (metricMode === 'leaves' || metricMode === 'dual') {
      const leafArea = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0(innerHeight)
        .y1((d) => yScaleLeaves(d.leafCount))
        .curve(d3.curveMonotoneX);

      const leafLine = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScaleLeaves(d.leafCount))
        .curve(d3.curveMonotoneX);

      if (metricMode === 'leaves') {
        g.append('path')
          .datum(parsedData)
          .attr('fill', 'url(#leaf-gradient)')
          .attr('d', leafArea);
      }

      // Leaf Stroke Line
      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#059669')
        .attr('stroke-width', metricMode === 'dual' ? 2 : 2.5)
        .attr('stroke-dasharray', metricMode === 'dual' ? '4 3' : 'none')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', leafLine);
    }

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(parsedData.length, width < 500 ? 4 : 6))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#D4D4D4');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#737373')
      .attr('font-size', '11px')
      .attr('dy', '1em');

    // Y Axis (Left)
    if (metricMode === 'height' || metricMode === 'dual') {
      const yAxisLeft = d3
        .axisLeft(yScaleHeight)
        .ticks(5)
        .tickFormat((d) => `${d} ${heightUnitLabel}`);

      const yAxisLeftGroup = g.append('g').call(yAxisLeft);
      yAxisLeftGroup.select('.domain').attr('stroke', '#D4D4D4');
      yAxisLeftGroup
        .selectAll('text')
        .attr('fill', '#3B182E')
        .attr('font-size', '11px')
        .attr('font-weight', '600');
    } else {
      const yAxisLeaves = d3
        .axisLeft(yScaleLeaves)
        .ticks(5)
        .tickFormat((d) => `${d} lvs`);

      const yAxisLeavesGroup = g.append('g').call(yAxisLeaves);
      yAxisLeavesGroup.select('.domain').attr('stroke', '#D4D4D4');
      yAxisLeavesGroup
        .selectAll('text')
        .attr('fill', '#059669')
        .attr('font-size', '11px')
        .attr('font-weight', '600');
    }

    // Y Axis (Right - For Dual mode)
    if (metricMode === 'dual') {
      const yAxisRight = d3
        .axisRight(yScaleLeaves)
        .ticks(5)
        .tickFormat((d) => `${d} lvs`);

      const yAxisRightGroup = g
        .append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);

      yAxisRightGroup.select('.domain').attr('stroke', '#D4D4D4');
      yAxisRightGroup
        .selectAll('text')
        .attr('fill', '#059669')
        .attr('font-size', '11px')
        .attr('font-weight', '600');
    }

    // Render Data Point Glyphs
    parsedData.forEach((d, idx) => {
      const cx = xScale(d.parsedDate);
      const isLatest = idx === parsedData.length - 1;
      const hasMilestone = !!d.milestone;

      if (metricMode === 'height' || metricMode === 'dual') {
        const cy = yScaleHeight(d.displayHeight);

        // Milestone indicator glyph
        if (hasMilestone) {
          // Diamond badge
          g.append('rect')
            .attr('x', cx - 5)
            .attr('y', cy - 5)
            .attr('width', 10)
            .attr('height', 10)
            .attr('transform', `rotate(45, ${cx}, ${cy})`)
            .attr('fill', '#D97706')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2);
        } else {
          // Standard node circle
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', isLatest ? 4.5 : 3.5)
            .attr('fill', '#FFFFFF')
            .attr('stroke', '#3B182E')
            .attr('stroke-width', 2);
        }

        // Pulse ring on latest height point
        if (isLatest) {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 7.5)
            .attr('fill', 'none')
            .attr('stroke', '#3B182E')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.5);
        }
      }

      if (metricMode === 'leaves' || metricMode === 'dual') {
        const cyL = yScaleLeaves(d.leafCount);
        if (metricMode === 'leaves' && hasMilestone) {
          g.append('rect')
            .attr('x', cx - 5)
            .attr('y', cyL - 5)
            .attr('width', 10)
            .attr('height', 10)
            .attr('transform', `rotate(45, ${cx}, ${cyL})`)
            .attr('fill', '#D97706')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2);
        } else {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cyL)
            .attr('r', metricMode === 'dual' ? 3 : 3.5)
            .attr('fill', '#FFFFFF')
            .attr('stroke', '#059669')
            .attr('stroke-width', 1.8);
        }
      }
    });

    // Crosshair and Interactive Overlay
    const crosshair = g
      .append('line')
      .attr('stroke', '#737373')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const bisectDate = d3.bisector<any, Date>((d) => d.parsedDate).center;

    // Overlay to capture mouse / touch pointer
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove touchmove', function (event) {
        const [pointerX] = d3.pointer(event, this);
        const xDate = xScale.invert(pointerX);
        const index = bisectDate(parsedData, xDate);
        const selected = parsedData[index];

        if (selected) {
          const selectedX = xScale(selected.parsedDate);
          crosshair.attr('x1', selectedX).attr('x2', selectedX).style('opacity', 1);

          const prev = index > 0 ? parsedData[index - 1] : undefined;
          const rect = container.getBoundingClientRect();
          const targetY =
            metricMode === 'leaves'
              ? yScaleLeaves(selected.leafCount)
              : yScaleHeight(selected.displayHeight);

          setHoveredData({
            metric: selected,
            x: selectedX + margin.left,
            y: targetY + margin.top,
            prevMetric: prev,
          });
        }
      })
      .on('mouseleave touchend', () => {
        crosshair.style('opacity', 0);
        setHoveredData(null);
      });
  }, [filteredMetrics, metricMode, heightUnit, timeWindow]);

  // Handle ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // triggers re-render by state ping
      setTimeWindow((prev) => prev);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Submit new growth metric
  const handleRecordMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hNum = logHeight.trim() ? parseFloat(logHeight) : undefined;
    const lNum = logLeaves.trim() ? parseInt(logLeaves, 10) : undefined;
    const sNum = logStemDiameter.trim() ? parseFloat(logStemDiameter) : undefined;

    if (hNum === undefined && lNum === undefined) {
      setFormError('Please enter at least plant height or leaf count.');
      return;
    }

    if (hNum !== undefined && (isNaN(hNum) || hNum <= 0)) {
      setFormError('Height must be a positive number.');
      return;
    }

    if (lNum !== undefined && (isNaN(lNum) || lNum < 0)) {
      setFormError('Leaf count must be a non-negative number.');
      return;
    }

    // Convert height to cm if entered in inches
    const heightInCm = hNum !== undefined ? (heightUnit === 'in' ? hNum * 2.54 : hNum) : undefined;

    try {
      setIsSubmitting(true);
      const res = await api.logGrowthMetric(plant.id, {
        date: logDate,
        heightCm: heightInCm,
        leafCount: lNum,
        stemDiameterMm: sNum,
        milestone: logMilestone.trim() || undefined,
        notes: logNotes.trim() || undefined,
      });

      if (onUpdatePlant) {
        onUpdatePlant(res.plant);
      }

      // Reset form
      setLogHeight('');
      setLogLeaves('');
      setLogStemDiameter('');
      setLogMilestone('');
      setLogNotes('');
      setIsLoggingOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record growth metric.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this growth measurement?')) return;
    try {
      const res = await api.deleteGrowthMetric(plant.id, metricId);
      if (onUpdatePlant) {
        onUpdatePlant(res.plant);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete growth metric');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-5">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#FAF7F5] border border-neutral-200 rounded-lg text-[#3B182E]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              30-Day Historical Growth Metrics
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#3B182E] border border-purple-200/60">
              D3 Engine
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Interactive biological trajectory tracking height development, foliar expansion, and developmental milestones.
          </p>
        </div>

        {/* Action Buttons: Log Metric & View Log */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowHistoryTable(!showHistoryTable)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            title="Inspect full growth log records"
          >
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
            <span>{showHistoryTable ? 'Hide Records' : 'View Records'}</span>
          </button>

          <button
            onClick={() => setIsLoggingOpen(!isLoggingOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Measurement</span>
          </button>
        </div>
      </div>

      {/* 30-Day Key Stat Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#FAF7F5] rounded-xl border border-neutral-200/80 space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500 text-[11px]">
            <span>Net Height Gain</span>
            <Ruler className="w-3.5 h-3.5 text-[#3B182E]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">
              {analytics.heightChange >= 0 ? '+' : ''}
              {formatHeight(analytics.heightChange)} {heightUnitLabel}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              +{analytics.heightChangePct.toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 block">
            Baseline: {formatHeight(analytics.startHeight)} → Current: {formatHeight(analytics.currentHeight)} {heightUnitLabel}
          </span>
        </div>

        <div className="p-3 bg-[#FAF7F5] rounded-xl border border-neutral-200/80 space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500 text-[11px]">
            <span>Foliage / Leaves</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">
              {analytics.leafChange >= 0 ? '+' : ''}
              {analytics.leafChange} Leaves
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              {analytics.currentLeaves} total
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 block">
            From {analytics.startLeaves} leaves 30d ago
          </span>
        </div>

        <div className="p-3 bg-[#FAF7F5] rounded-xl border border-neutral-200/80 space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500 text-[11px]">
            <span>Growth Velocity</span>
            <Activity className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">
              +{formatHeight(analytics.dailyHeightRate)}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">
              {heightUnitLabel}/day
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 block">
            Over {analytics.totalDays} recorded days
          </span>
        </div>

        <div className="p-3 bg-[#FAF7F5] rounded-xl border border-neutral-200/80 space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500 text-[11px]">
            <span>Milestones Achieved</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">
              {analytics.milestonesCount}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">recorded</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">
            Foliar & budding transitions
          </span>
        </div>
      </div>

      {/* Interactive Toolbar: Metric Switcher, Time Window, Height Unit */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
        {/* Metric Selector */}
        <div className="flex items-center gap-1">
          <span className="text-neutral-400 font-medium mr-1 hidden sm:inline">Metric:</span>
          <button
            onClick={() => setMetricMode('height')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              metricMode === 'height'
                ? 'bg-[#3B182E] text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            Height ({heightUnitLabel})
          </button>
          <button
            onClick={() => setMetricMode('leaves')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              metricMode === 'leaves'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            Leaf Count
          </button>
          <button
            onClick={() => setMetricMode('dual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              metricMode === 'dual'
                ? 'bg-purple-800 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
            title="Overlay both height and leaf counts on dual axes"
          >
            Dual Comparison
          </button>
        </div>

        {/* Right side controls: Window & Unit */}
        <div className="flex items-center gap-3">
          {/* Time Window */}
          <div className="flex items-center gap-1 border-r border-neutral-200 pr-3">
            <span className="text-neutral-400 font-medium mr-1 hidden md:inline">Window:</span>
            {(['30d', '14d', 'all'] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  timeWindow === w
                    ? 'bg-white text-neutral-900 font-bold border border-neutral-300 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {w === '30d' ? 'Past 30D' : w === '14d' ? 'Past 14D' : 'All Logs'}
              </button>
            ))}
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHeightUnit('cm')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                heightUnit === 'cm'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              cm
            </button>
            <button
              onClick={() => setHeightUnit('in')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                heightUnit === 'in'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              in
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        {filteredMetrics.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <Ruler className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">No Growth Records Found</p>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              Start recording weekly height measurements and leaf counts to generate continuous D3 growth curves.
            </p>
            <button
              onClick={() => setIsLoggingOpen(true)}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-[#3B182E] rounded-xl hover:bg-[#2B1020]"
            >
              Log First Measurement
            </button>
          </div>
        ) : (
          <div className="relative">
            <svg ref={svgRef} className="w-full overflow-visible" />

            {/* Hover Tooltip Overlay */}
            {hoveredData && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-3"
                style={{
                  left: `${hoveredData.x}px`,
                  top: `${hoveredData.y}px`,
                }}
              >
                <div className="bg-neutral-900 text-white text-xs rounded-xl p-3 shadow-xl border border-neutral-800 max-w-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-4 border-b border-neutral-700/80 pb-1.5 text-[11px] text-neutral-300">
                    <span className="font-medium">
                      {new Date(hoveredData.metric.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      Day {Math.round((new Date(hoveredData.metric.date).getTime() - new Date(filteredMetrics[0].date).getTime()) / (24 * 60 * 60 * 1000))}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Height</span>
                      <span className="font-bold text-white tabular-nums">
                        {formatHeight(hoveredData.metric.heightCm)} {heightUnitLabel}
                      </span>
                      {hoveredData.prevMetric && (
                        <span className="text-[10px] block text-emerald-400">
                          {hoveredData.metric.heightCm - hoveredData.prevMetric.heightCm >= 0 ? '+' : ''}
                          {formatHeight(hoveredData.metric.heightCm - hoveredData.prevMetric.heightCm)} {heightUnitLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px]">Leaf Canopy</span>
                      <span className="font-bold text-emerald-300 tabular-nums">
                        {hoveredData.metric.leafCount} Leaves
                      </span>
                      {hoveredData.prevMetric && (
                        <span className="text-[10px] block text-emerald-400">
                          {hoveredData.metric.leafCount - hoveredData.prevMetric.leafCount >= 0 ? '+' : ''}
                          {hoveredData.metric.leafCount - hoveredData.prevMetric.leafCount} lvs
                        </span>
                      )}
                    </div>
                  </div>

                  {hoveredData.metric.stemDiameterMm && (
                    <div className="text-[11px] text-neutral-300 pt-1 border-t border-neutral-800">
                      <span className="text-neutral-400">Stem Caliper:</span> {hoveredData.metric.stemDiameterMm} mm
                    </div>
                  )}

                  {hoveredData.metric.milestone && (
                    <div className="pt-1.5 border-t border-neutral-800">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                        <Sparkles className="w-2.5 h-2.5" />
                        {hoveredData.metric.milestone}
                      </span>
                    </div>
                  )}

                  {hoveredData.metric.notes && (
                    <p className="text-[11px] text-neutral-300 italic pt-1 border-t border-neutral-800 leading-tight">
                      "{hoveredData.metric.notes}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Milestone Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#3B182E] inline-block" />
            <span className="font-medium text-neutral-800">Specimen Height ({heightUnitLabel})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span className="font-medium text-neutral-800">Total Foliar Leaves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-500 inline-block" />
            <span className="font-medium text-amber-800">Botanical Milestone (Unfurling/Budding)</span>
          </div>
        </div>

        <span className="text-[11px] text-neutral-400">
          Showing {filteredMetrics.length} data points · D3 Interpolation (curveMonotoneX)
        </span>
      </div>

      {/* EXPANDABLE LOGGING FORM */}
      {isLoggingOpen && (
        <div className="p-4 bg-[#FAF7F5] rounded-xl border border-neutral-300 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#3B182E]" />
              <span>Record New Growth Metric</span>
            </h4>
            <button
              onClick={() => setIsLoggingOpen(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleRecordMetric} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Measurement Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Height ({heightUnitLabel})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`e.g. ${heightUnit === 'in' ? '24.5' : '62.0'}`}
                  value={logHeight}
                  onChange={(e) => setLogHeight(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Leaf Count
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 12"
                  value={logLeaves}
                  onChange={(e) => setLogLeaves(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Stem Caliper (mm, opt.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15.5"
                  value={logStemDiameter}
                  onChange={(e) => setLogStemDiameter(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
                />
              </div>
            </div>

            {/* Milestone Presets & Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-700">
                  Developmental Milestone (Optional)
                </label>
                <span className="text-[10px] text-neutral-400">Click preset chip or type below</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'New fenestrated leaf unfolded',
                  'Fresh apical shoot emerging',
                  'First floral blossom open',
                  'Fruit set observed',
                  'Node branching after pruning',
                  'Repotted into larger container',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setLogMilestone(chip)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-[#3B182E] hover:text-[#3B182E] cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="e.g. Unfurled 12th split leaf with 7 perforations"
                value={logMilestone}
                onChange={(e) => setLogMilestone(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Botanical Observations / Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Aerial roots actively anchoring to coco coir. Foliage turgid, high chlorophyll coloration."
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsLoggingOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 bg-neutral-200/60 rounded-xl hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#3B182E] rounded-xl hover:bg-[#2B1020] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Save Growth Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXPANDABLE HISTORICAL RECORDS TABLE */}
      {showHistoryTable && (
        <div className="pt-3 border-t border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Recorded Chronological Growth Logs ({rawMetrics.length})
            </h4>
            <span className="text-[11px] text-neutral-400">All historical measurements</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-neutral-600 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Height</th>
                  <th className="py-2.5 px-3">Leaves</th>
                  <th className="py-2.5 px-3">Stem Caliper</th>
                  <th className="py-2.5 px-3">Milestone / Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {rawMetrics.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-mono font-medium text-neutral-900 whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#3B182E] tabular-nums whitespace-nowrap">
                      {formatHeight(m.heightCm)} {heightUnitLabel}
                    </td>
                    <td className="py-2 px-3 font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                      {m.leafCount} lvs
                    </td>
                    <td className="py-2 px-3 text-neutral-500 tabular-nums whitespace-nowrap">
                      {m.stemDiameterMm ? `${m.stemDiameterMm} mm` : '—'}
                    </td>
                    <td className="py-2 px-3">
                      {m.milestone && (
                        <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 mr-1.5">
                          ★ {m.milestone}
                        </span>
                      )}
                      <span className="text-neutral-600 text-[11px]">{m.notes || '—'}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleDeleteMetric(m.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete this measurement record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
