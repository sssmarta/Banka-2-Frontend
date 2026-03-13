import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Došlo je do neočekivane greške na stranici.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route rendering error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold">Greška pri prikazu stranice</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sadržaj nije mogao da se prikaže. Osvežite stranicu ili pređite na drugu sekciju.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Detalj: {this.state.message}</p>
          <div className="mt-4">
            <Button onClick={this.handleReload}>Osveži stranicu</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
