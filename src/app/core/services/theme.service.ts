import { Injectable } from '@angular/core';

const STORAGE_KEY = 'theme'; // 'light' | 'dark'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private root = document.documentElement;

  init() {
    const saved = (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null);
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    const theme: 'light' | 'dark' = saved ?? (prefersLight ? 'light' : 'dark');
    this.set(theme);
  }

  toggle() {
    const cur = this.current();
    this.set(cur === 'light' ? 'dark' : 'light');
  }

  set(theme: 'light' | 'dark') {
    this.root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  current(): 'light' | 'dark' {
    return (this.root.getAttribute('data-theme') as 'light' | 'dark') ?? 'dark';
  }
}
