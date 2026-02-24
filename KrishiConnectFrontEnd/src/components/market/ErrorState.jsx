import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Error state with message and retry action.
 */
export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-8 text-center"
      data-testid="error-state"
    >
      <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
      <p className="text-red-700 dark:text-red-300 font-semibold mb-1">{message}</p>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">Please check your connection and try again.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}
