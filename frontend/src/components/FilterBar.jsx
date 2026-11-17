import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Shuffle, 
  Calendar, 
  Search, 
  Clock,
  Filter
} from 'lucide-react';

export function FilterBar({ 
  search, 
  onSearchChange, 
  sort, 
  onSortChange, 
  dateFilter, 
  onDateFilterChange,
  customDays,
  onCustomDaysChange,
  durationMode = 'any', // 'any' | 'longer' | 'shorter'
  onDurationModeChange,
  durationMinutes = null, // 10 | 20 | 30 | custom number
  onDurationMinutesChange,
  onShuffle,
  showShuffle = true,
  showDurationFilter = false,
  totalResults
}) {
  const [customDaysInput, setCustomDaysInput] = useState(customDays || '14');
  const [customDurationInput, setCustomDurationInput] = useState(durationMinutes || '15');
  const [showCustomDaysField, setShowCustomDaysField] = useState(dateFilter === 'custom');
  const [showCustomDurationField, setShowCustomDurationField] = useState(
    durationMinutes && ![10, 20, 30].includes(durationMinutes)
  );

  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'random', label: 'Random Order' },
    ...(showDurationFilter ? [
      { id: 'duration_desc', label: 'Longest Duration' },
      { id: 'duration_asc', label: 'Shortest Duration' },
    ] : []),
    { id: 'views', label: 'Most Viewed' },
  ];

  const dateOptions = [
    { id: 'all', label: 'All Time' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 3 Months' },
    { id: '180d', label: 'Last 6 Months' },
    { id: '365d', label: 'Last 1 Year' },
    { id: 'custom', label: 'Custom Days' },
  ];

  const durationPresets = [10, 20, 30];

  const handleDateSelect = (id) => {
    if (id === 'custom') {
      setShowCustomDaysField(true);
      onDateFilterChange('custom');
      if (onCustomDaysChange) onCustomDaysChange(parseInt(customDaysInput, 10) || 14);
    } else {
      setShowCustomDaysField(false);
      onDateFilterChange(id);
    }
  };

  const handleCustomDaysSubmit = (val) => {
    setCustomDaysInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && onCustomDaysChange) {
      onCustomDaysChange(parsed);
    }
  };

  const handleDurationPreset = (mins) => {
    setShowCustomDurationField(false);
    if (onDurationMinutesChange) onDurationMinutesChange(mins);
  };

  const handleCustomDurationSubmit = (val) => {
    setCustomDurationInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && onDurationMinutesChange) {
      onDurationMinutesChange(parsed);
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-md shadow-xl space-y-4">
      
      {/* Search Bar & Primary Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by caption text or file name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/20 transition-all"
          />
        </div>

        {/* Sort & Shuffle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort order"
              className="pl-8 pr-8 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs font-medium text-neutral-200 focus:outline-none focus:border-rose-500 cursor-pointer appearance-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shuffle Button */}
          {showShuffle && (
            <button
              onClick={onShuffle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-rose-400 hover:text-rose-300 transition-all active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            Date:
          </span>
          {dateOptions.map((d) => (
            <button
              key={d.id}
              onClick={() => handleDateSelect(d.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === d.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {d.label}
            </button>
          ))}

          {/* Custom Days Input Field */}
          {showCustomDaysField && (
            <div className="flex items-center gap-1.5 ml-1 bg-neutral-950 px-2 py-0.5 rounded-lg border border-rose-500/40">
              <span className="text-[10px] text-neutral-400 font-mono">Last</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={customDaysInput}
                onChange={(e) => handleCustomDaysSubmit(e.target.value)}
                className="w-12 text-center text-xs bg-neutral-900 border border-neutral-700 rounded text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <span className="text-[10px] text-neutral-400 font-mono">days</span>
            </div>
          )}
        </div>

        {totalResults !== undefined && (
          <div className="text-[11px] text-neutral-400 font-mono">
            Total: <span className="text-white font-semibold">{totalResults}</span> items
          </div>
        )}
      </div>

      {/* Duration Filter Row (for Videos) */}
      {showDurationFilter && onDurationModeChange && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800/60 text-xs">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono mr-1">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            Duration:
          </span>

          {/* Duration Mode: Any / Longer than / Shorter than */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => onDurationModeChange('any')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                durationMode === 'any' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Any
            </button>
            <button
              onClick={() => {
                onDurationModeChange('longer');
                if (!durationMinutes) onDurationMinutesChange(10);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                durationMode === 'longer' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Longer than (&gt;)
            </button>
            <button
              onClick={() => {
                onDurationModeChange('shorter');
                if (!durationMinutes) onDurationMinutesChange(10);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                durationMode === 'shorter' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Shorter than (&lt;)
            </button>
          </div>

          {/* Presets: 10 min, 20 min, 30 min, Custom */}
          {durationMode !== 'any' && (
            <div className="flex flex-wrap items-center gap-1.5 ml-2 animate-fadeIn">
              {durationPresets.map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleDurationPreset(mins)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                    durationMinutes === mins && !showCustomDurationField
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {mins} min
                </button>
              ))}

              <button
                onClick={() => setShowCustomDurationField(true)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                  showCustomDurationField
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                Custom
              </button>

              {showCustomDurationField && (
                <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded-lg border border-rose-500/40">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={customDurationInput}
                    onChange={(e) => handleCustomDurationSubmit(e.target.value)}
                    className="w-12 text-center text-xs bg-neutral-900 border border-neutral-700 rounded text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="text-[10px] text-neutral-400 font-mono">min</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
