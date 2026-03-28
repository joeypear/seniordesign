import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { inline, error } = { inline: this.props.inline, error: this.state.error };

    if (inline) {
      return (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-600 dark:text-rose-400 space-y-2">
          <p className="font-medium">Something went wrong loading this section.</p>
          {error?.message && <p className="text-xs opacity-75 font-mono">{error.message}</p>}
          <button
            onClick={() => window.location.reload()}
            className="text-xs underline hover:no-underline"
          >
            Reload
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 bg-white dark:bg-[#161B2E]">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">Something went wrong</p>
          {error?.message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 break-all">
              {error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
