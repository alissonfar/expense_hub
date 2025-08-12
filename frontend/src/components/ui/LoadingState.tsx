import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({ message = 'Carregando...', className }: LoadingStateProps) {
  return (
    <div className={`py-16 text-center ${className || ''}`}>
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
} 