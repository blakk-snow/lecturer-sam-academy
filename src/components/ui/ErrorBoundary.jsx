/**
 * ErrorBoundary.jsx — catches render errors in a subtree so an unexpected
 * crash degrades to a friendly card instead of unmounting the whole app.
 */

import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { title = 'Something went wrong', message } = this.props;
    return (
      <div className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3" role="alert">
        <p className="font-semibold text-ink">{title}</p>
        {message && <p className="mt-1 text-sm text-ink-soft leading-relaxed">{message}</p>}
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-2 rounded-lg bg-accent text-white text-sm font-medium px-3 py-1.5 hover:bg-accent/90 transition"
        >
          Try again
        </button>
      </div>
    );
  }
}
