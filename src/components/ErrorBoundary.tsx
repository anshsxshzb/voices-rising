import React, { Component, ErrorInfo, ReactNode } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    auth.signOut().then(() => {
      window.location.href = '/';
    });
  };

  public render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      
      try {
        const parsedError = JSON.parse(this.state.errorMessage);
        if (parsedError.error && parsedError.error.includes('Missing or insufficient permissions')) {
          displayMessage = "You do not have permission to access this data. Please ensure you are logged in with an authorized account.";
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-zinc-200 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-zinc-600 mb-6">{displayMessage}</p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
