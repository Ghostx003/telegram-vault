import React from 'react';
import { 
  ArrowUpDown, 
  Shuffle, 
  Calendar, 
  Search, 
  Check, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export function FilterBar({ 
  search, 
  onSearchChange, 
  sort, 
  onSortChange, 
  dateFilter, 
  onDateFilterChange, 
  onShuffle,
  showShuffle = true,
  showDurationSort = true,
  avoidRepetition,
  onToggleAvoidRepetition,
  totalResults
}) {
  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'random', label: 'Random Order' },
    ...(showDurationSort ? [
      { id: 'duration_desc', label: 'Longest Duration' },
      { id: 'duration_asc', label: 'Shortest Duration' },
    ] : []),
    { id: 'views', label: 'Most Viewed' },
  ];

  const dateOptions = [
    { id: 'all', label: 'All Time' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
  ];

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 mb-8 backdrop-blur-md shadow-lg space-y-4">
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
              <span>Shuffle Grid</span>
            </button>
          )}

          {/* Avoid Repetition Toggle (if provided) */}
          {onToggleAvoidRepetition && (
            <button
              onClick={() => onToggleAvoidRepetition(!avoidRepetition)}
              title="Avoid showing already played videos in random shuffle"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                avoidRepetition
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${avoidRepetition ? 'bg-rose-500 animate-pulse' : 'bg-neutral-600'}`} />
              <span>Avoid Repetition</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Pills & Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-400" />
            Date:
          </span>
          {dateOptions.map((d) => (
            <button
              key={d.id}
              onClick={() => onDateFilterChange(d.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === d.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {totalResults !== undefined && (
          <div className="text-[11px] text-neutral-400 font-mono">
            Showing <span className="text-white font-semibold">{totalResults}</span> media items
          </div>
        )}
      </div>
    </div>
  );
}
