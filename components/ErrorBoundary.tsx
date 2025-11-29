import React, { Component, ErrorInfo, ReactNode } from 'react';
import { monitor } from '../services/monitoring';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our A/B monitoring service
    monitor.logError(`UI Crash: ${error.message}`, null, { stack: errorInfo.componentStack });
  }

  private handleReset = () => {
      this.setState({ hasError: false, error: null });
      window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6 text-sm">
                We've logged this issue. It might be due to experimental features in your session.
            </p>
            <div className="bg-slate-100 p-3 rounded text-xs text-left overflow-auto max-h-32 mb-6 font-mono text-slate-700">
                {this.state.error?.toString()}
            </div>
            <Button onClick={this.handleReset} className="w-full justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}