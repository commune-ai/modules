
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  chatHistory: Array<{id: string, title: string}>;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedModel,
  onModelChange,
  chatHistory,
  onChatSelect,
  onNewChat,
  currentChatId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-12'} transition-all duration-300 bg-chat-dark border-r border-gray-700 h-screen flex flex-col relative`}>
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 bg-chat-dark border border-gray-700 rounded-full p-1 z-10"
      >
        {isExpanded ? (
          <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        )}
      </button>

      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        {isExpanded && (
          <>
            <button 
              onClick={onNewChat}
              className="w-full bg-chat-accent hover:bg-chat-accent-hover text-white py-2 px-4 rounded mb-6"
            >
              New Chat
            </button>

            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Model Selection</h3>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full bg-chat-light text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-chat-accent"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Chat History</h3>
              {chatHistory.length > 0 ? (
                <ul className="space-y-1">
                  {chatHistory.map((chat) => (
                    <li key={chat.id}>
                      <button
                        onClick={() => onChatSelect(chat.id)}
                        className={`w-full text-left py-2 px-3 rounded text-sm truncate ${
                          currentChatId === chat.id 
                            ? 'bg-chat-accent text-white' 
                            : 'text-gray-300 hover:bg-chat-light'
                        }`}
                      >
                        {chat.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No chat history yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
