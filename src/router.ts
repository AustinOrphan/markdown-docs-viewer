export type RoutingMode = 'hash' | 'memory' | 'none';

export class Router {
  private mode: RoutingMode;
  private onRouteChange: (docId: string) => void;
  private currentRoute: string = '';
  private boundHashChangeHandler: (() => void) | null = null;

  constructor(mode: RoutingMode, onRouteChange: (docId: string) => void) {
    this.mode = mode;
    this.onRouteChange = onRouteChange;
    
    if (mode === 'hash') {
      this.boundHashChangeHandler = this.handleHashChange.bind(this);
      window.addEventListener('hashchange', this.boundHashChangeHandler);
      this.handleHashChange();
    }
  }

  private handleHashChange(): void {
    const hash = window.location.hash.slice(1);
    if (hash && hash !== this.currentRoute) {
      this.currentRoute = hash;
      this.onRouteChange(hash);
    }
  }

  setRoute(docId: string): void {
    this.currentRoute = docId;
    
    if (this.mode === 'hash') {
      window.location.hash = docId;
    }
  }

  getCurrentRoute(): string | null {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || null;
    }
    return this.currentRoute || null;
  }

  destroy(): void {
    if (this.mode === 'hash' && this.boundHashChangeHandler) {
      window.removeEventListener('hashchange', this.boundHashChangeHandler);
      this.boundHashChangeHandler = null;
    }
  }
}