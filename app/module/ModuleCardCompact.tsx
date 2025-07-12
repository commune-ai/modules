import React from 'react';
import { motion } from 'framer-motion';
import { Circle, Zap } from 'lucide-react';

interface ModuleCardCompactProps {
  name: string;
  status?: 'active' | 'inactive' | 'error';
  metric?: string | number;
  onClick?: () => void;
}

export const ModuleCardCompact: React.FC<ModuleCardCompactProps> = ({
  name,
  status = 'inactive',
  metric,
  onClick
}) => {
  const statusColors = {
    active: 'text-emerald-400',
    inactive: 'text-gray-600',
    error: 'text-red-400'
  };

  return (
    <motion.div
      className="flex items-center justify-between px-2 py-1.5 bg-gray-900/50 rounded border border-gray-800/30 hover:border-blue-500/30 hover:bg-gray-900/70 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Circle className={`w-1.5 h-1.5 fill-current ${statusColors[status]}`} />
        <span className="text-xs font-medium text-gray-300 truncate group-hover:text-white transition-colors">
          {name}
        </span>
      </div>
      {metric && (
        <div className="flex items-center gap-0.5 text-gray-500">
          <Zap className="w-2.5 h-2.5" />
          <span className="text-xs">{metric}</span>
        </div>
      )}
    </motion.div>
  );
};

export default ModuleCardCompact;