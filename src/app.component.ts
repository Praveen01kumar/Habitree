import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Theme, ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <!-- Sidebar -->
      <aside 
        class="w-64 flex-shrink-0 bg-slate-800 text-slate-100 flex flex-col fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-40"
        [class.translate-x-0]="isSidebarOpen()"
        [class.-translate-x-full]="!isSidebarOpen()">
        <div class="h-16 flex items-center justify-center text-2xl font-bold border-b border-slate-700 flex-shrink-0">
          <i class="fas fa-tree mr-2 text-primary-400"></i>
          <span>Habitree</span>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <a
            (click)="handleLinkClick()"
            routerLink="/"
            routerLinkActive="bg-slate-700 text-white"
            [routerLinkActiveOptions]="{exact: true}"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-tachometer-alt w-6 mr-3 text-center"></i>
            <span>Dashboard</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/tasks"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-tasks w-6 mr-3 text-center"></i>
            <span>Tasks</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/pomodoro"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-clock w-6 mr-3 text-center"></i>
            <span>Pomodoro</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/calendar"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-calendar-alt w-6 mr-3 text-center"></i>
            <span>Calendar</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/habits"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-seedling w-6 mr-3 text-center"></i>
            <span>Habits</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/journal"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-book-open w-6 mr-3 text-center"></i>
            <span>Journal</span>
          </a>
          <a
            (click)="handleLinkClick()"
            routerLink="/analytics"
            routerLinkActive="bg-slate-700 text-white"
            class="flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200">
            <i class="fas fa-chart-line w-6 mr-3 text-center"></i>
            <span>Analytics</span>
          </a>
        </nav>
        <div class="p-4 border-t border-slate-700 flex-shrink-0">
          <div class="relative">
            <button (click)="toggleThemeMenu()" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
              <span class="flex items-center gap-3 text-sm">
                @switch (themeService.theme()) {
                  @case ('light') { <i class="fas fa-sun w-4 text-center"></i> <span>Light</span> }
                  @case ('dark') { <i class="fas fa-moon w-4 text-center"></i> <span>Dark</span> }
                  @case ('system') { <i class="fas fa-desktop w-4 text-center"></i> <span>System</span> }
                }
              </span>
              <i class="fas fa-chevron-up text-xs transition-transform" [class.rotate-180]="!isThemeMenuOpen()"></i>
            </button>
            @if(isThemeMenuOpen()) {
              <div class="absolute bottom-full mb-2 w-full bg-slate-900 rounded-md shadow-lg ring-1 ring-slate-700 py-1 z-10">
                <button (click)="setTheme('light')" class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors">
                  <i class="fas fa-sun w-4 text-center"></i> Light
                </button>
                <button (click)="setTheme('dark')" class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors">
                  <i class="fas fa-moon w-4 text-center"></i> Dark
                </button>
                <button (click)="setTheme('system')" class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors">
                  <i class="fas fa-desktop w-4 text-center"></i> System
                </button>
              </div>
            }
          </div>
          <p class="text-xs text-slate-500 text-center mt-4">&copy; 2024 Habitree</p>
        </div>
      </aside>

      <!-- Backdrop for sidebar on small screens -->
      @if (isSidebarOpen()) {
        <div (click)="toggleSidebar(false)" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col relative transition-all duration-300 ease-in-out" [class.lg:ml-64]="isSidebarOpen()">
        <!-- Header -->
        <header class="h-16 flex items-center px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
           <button (click)="toggleSidebar()" class="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
             <i class="fas fa-bars fa-lg"></i>
           </button>
           <div class="flex-1"></div>
           <!-- Other header items can go here -->
        </header>
        
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  themeService = inject(ThemeService);
  platformId = inject(PLATFORM_ID);
  
  isSidebarOpen = signal(false);
  isThemeMenuOpen = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Set sidebar to be open by default on large screens (lg breakpoint: 1024px)
      this.isSidebarOpen.set(window.innerWidth >= 1024);
    }
  }

  toggleSidebar(state?: boolean): void {
    this.isSidebarOpen.set(state ?? !this.isSidebarOpen());
  }
  
  handleLinkClick(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Close sidebar only on mobile screens
      if (window.innerWidth < 1024) {
        this.isSidebarOpen.set(false);
      }
    }
  }

  toggleThemeMenu(): void {
    this.isThemeMenuOpen.update(open => !open);
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.isThemeMenuOpen.set(false);
  }
}