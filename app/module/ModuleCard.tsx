import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Clock, Star, Code2, Activity } from 'lucide-react';

interface ModuleCardProps {
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
  metrics?: {
    calls?: number;
    latency?: number;
    rating?: number;
  };
  tags?: string[];
  onClick?: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  name,
  description = 'No description',
  status = 'inactive',
  metrics = {},
  tags = [],
  onClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    active: { color: 'bg-emerald-500', pulse: true },
    inactive: { color: 'bg-gray-600', pulse: false },
    pending: { color: 'bg-amber-500', pulse: true }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      className="relative bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-blue-600/10 group-hover:via-purple-600/10 group-hover:to-pink-600/10 transition-all duration-500" />
      
      {/* Compact View */}
      <div className="relative p-3 cursor-pointer" onClick={handleClick}>
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
              {statusConfig[status].pulse && (
                <div className={`absolute inset-0 w-2 h-2 rounded-full ${statusConfig[status].color} animate-ping`} />
              )}
            </div>
            <h3 className="text-sm font-medium text-white truncate">{name}</h3>
          </div>

          {/* Right section - Metrics & Expand */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {/* Inline metrics */}
            <div className="flex items-center gap-2">
              {metrics.calls !== undefined && (
                <div className="flex items-center gap-0.5">
                  <Zap className="w-3 h-3" />
                  <span>{metrics.calls > 999 ? `${(metrics.calls/1000).toFixed(1)}k` : metrics.calls}</span>
                </div>
              )}
              {metrics.latency !== undefined && (
                <div className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{metrics.latency}ms</span>
                </div>
              )}
              {metrics.rating !== undefined && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{metrics.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        {/* Collapsed description - single line */}
        {!isExpanded && description !== 'No description' && (
          <p className="text-xs text-gray-500 mt-1 truncate pl-4">
            {description}
          </p>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 space-y-2 border-t border-gray-800/50">
              {/* Description */}
              <p className="text-xs text-gray-300 pt-2 leading-relaxed">{description}</p>
              
              {/* Tags and Action in same row */}
              <div className="flex items-center justify-between gap-2">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 flex-1">
                    {tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 text-xs bg-gray-800/50 text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="px-1.5 py-0.5 text-xs text-gray-500">+{tags.length - 3}</span>
                    )}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 text-xs rounded transition-all duration-200 whitespace-nowrap"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModuleCard;