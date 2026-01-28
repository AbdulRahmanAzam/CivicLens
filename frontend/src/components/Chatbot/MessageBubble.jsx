import React from 'react';

/**
 * Message bubble component for chat messages
 */
const MessageBubble = ({ message, isUser, timestamp, isTyping }) => {
  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Typing indicator dots
  if (isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 max-w-xs">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Parse and render markdown-like formatting
  const renderContent = (text) => {
    if (!text) return null;

    // Split by lines and process
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();

      // Handle bullet points
      if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          <li key={`li-${idx}`} className="ml-4">
            {formatTextWithBold(trimmedLine.substring(2))}
          </li>
        );
      } else {
        // If we were in a list, close it
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`ul-${idx}`} className="list-disc mt-1 mb-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        // Handle headers
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          elements.push(
            <p key={idx} className="font-semibold text-gray-900 dark:text-white mt-2 mb-1">
              {trimmedLine.replace(/\*\*/g, '')}
            </p>
          );
        } else if (trimmedLine) {
          elements.push(
            <p key={idx} className="mb-1">
              {formatTextWithBold(trimmedLine)}
            </p>
          );
        } else if (idx > 0 && lines[idx - 1].trim()) {
          // Empty line creates a small gap
          elements.push(<div key={idx} className="h-2" />);
        }
      }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="final-ul" className="list-disc mt-1 mb-2 space-y-1">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  // Format text with bold markers
  const formatTextWithBold = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-green-600 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
          }
        `}
      >
        <div className="text-sm leading-relaxed">
          {renderContent(message)}
        </div>
        {timestamp && (
          <div className={`text-xs mt-1 ${isUser ? 'text-green-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
