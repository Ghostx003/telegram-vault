import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  Plus, 
  Check, 
  Trash2, 
  Film, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

export function ChannelSwitcherModal({ 
  isOpen, 
  onClose, 
  channels, 
  activeChannel, 
  onSelectChannel, 
  onAddChannel, 
  onDeleteChannel,
  onStartSync 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddChannel = async (e) => {
    e.preventDefault();
    setError('');
    if (!inviteLink.trim() && !channelId.trim()) {
      setError('Please provide an Invite Link (https://t.me/+...) or a Channel ID (-100...)');
      return;
    }

    try {
      setLoading(true);
      await onAddChannel({
        id: channelId.trim(),
        invite_link: inviteLink.trim(),
        title: title.trim(),
      });
      setShowAddForm(false);
      setInviteLink('');
      setChannelId('');
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Channels & Vaults</h2>
            <p className="text-xs text-neutral-400">Switch active Telegram channel or connect a new one</p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Channel list */}
          <div className="space-y-3">
            {channels.map((ch) => {
              const isActive = ch.id === activeChannel?.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => !isActive && onSelectChannel(ch.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-rose-950/20 border-rose-500/60 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate max-w-xs">
                        {ch.title}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-rose-400" />
                        {ch.videos_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        {ch.photos_count || 0}
                      </span>
                      <span className="text-[10px] text-neutral-500 truncate">
                        ID: {ch.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onStartSync(true, ch.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
                        title="Sync active channel"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChannel(ch.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-600 text-white text-xs font-semibold transition-all"
                      >
                        Switch
                      </button>
                    )}

                    {channels.length > 1 && !isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove channel "${ch.title}"? Media records in database will be preserved.`)) {
                            onDeleteChannel(ch.id);
                          }
                        }}
                        className="p-2 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                        title="Remove Channel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Channel Toggle / Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-neutral-700 hover:border-rose-500/60 bg-neutral-950/40 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Connect New Channel</span>
            </button>
          ) : (
            <form onSubmit={handleAddChannel} className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5 animate-fadeIn mt-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  New Channel Details
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-neutral-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Channel Name / Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Videos or Archive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              {/* Invite Link */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Channel Invite Link (Recommended for private channels)
                </label>
                <input
                  type="text"
                  placeholder="https://t.me/+czbDHGQCY1k1YzY1"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              {/* Channel ID */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                  Or Telegram Channel ID
                </label>
                <input
                  type="text"
                  placeholder="-1001269413427"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-1/3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save & Switch Channel</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Active Channel Actions */}
        <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
          <div className="text-neutral-400">
            Active: <span className="text-white font-semibold">{activeChannel?.title}</span>
          </div>

          <button
            onClick={() => {
              onClose();
              onStartSync(true, activeChannel?.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shadow-md shadow-rose-950/30"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Sync Active Channel</span>
          </button>
        </div>

      </div>
    </div>
  );
}
