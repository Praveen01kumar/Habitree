import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'habitree-theme';
  private prefersDarkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  
  theme = signal<Theme>(this.loadTheme());

  effectiveTheme$ = computed<'light' | 'dark'>(() => {
    const theme = this.theme();
    if (theme === 'system') {
      return this.prefersDarkMQ.matches ? 'dark' : 'light';
    }
    return theme;
  });

  constructor() {
    effect((onCleanup) => {
      const theme = this.theme();
      localStorage.setItem(this.themeKey, theme);
      
      this.updateBodyClass();

      const mediaQueryListener = () => {
        if (this.theme() === 'system') {
          this.updateBodyClass();
        }
      };

      this.prefersDarkMQ.addEventListener('change', mediaQueryListener);
      
      onCleanup(() => {
        this.prefersDarkMQ.removeEventListener('change', mediaQueryListener);
      });
    });
  }

  private updateBodyClass() {
    if (this.effectiveTheme$() === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private loadTheme(): Theme {
    const storedTheme = localStorage.getItem(this.themeKey);
    return (storedTheme as Theme) || 'system';
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
}