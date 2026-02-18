import React from 'react';

const CustomAlert = ({ message, onClose, type = 'info' }) => {
  if (!message) return null;

  const typeStyles = {
    error: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const buttonStyles = {
    error: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 ${typeStyles[type]}`}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Campus Resource Management
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-white rounded-md transition-colors ${buttonStyles[type]}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
