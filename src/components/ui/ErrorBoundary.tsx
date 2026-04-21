/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 * 捕获子组件中的JavaScript错误并显示回退UI
 *
 * Props:
 * - children: ReactNode - Child components to wrap  包装的子组件
 * - fallback?: ReactNode - Optional fallback UI to display on error  错误时显示的可选回退UI
 * - onError?: (error: Error, errorInfo: React.ErrorInfo) => void - Optional error logging callback  可选的错误记录回调
 * State:
 * - hasError: boolean - Indicates if an error has occurred  指示是否发生错误
 * - error: Error | null - The caught error object  捕获的错误对象
 */

import { Component, ReactNode } from "react"; // 导入 React 组件和类型
import { logger } from "@/lib/logger"; // 导入日志记录库

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary class component 错误边界类组件
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Oops! Something went wrong.</h2>
            <p className="text-gray-400 mb-4 text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
