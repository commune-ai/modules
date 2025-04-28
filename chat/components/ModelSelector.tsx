
import React from 'react';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onChange }) => {
  if (models.length === 0) {
    return <div className="text-gray-400">Loading models...</div>;
  }

  return (
    <div className="flex items-center">
      <label htmlFor="model-selector" className="mr-2 text-sm">Model:</label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="bg-chat-light text-white rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-chat-accent"
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
