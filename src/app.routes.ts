import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'journal',
    loadComponent: () => import('./components/journal-list/journal-list.component').then(m => m.JournalListComponent),
  },
  {
    path: 'journal/new',
    loadComponent: () => import('./components/journal/journal.component').then(m => m.JournalComponent),
  },
  {
    path: 'journal/:id',
    loadComponent: () => import('./components/journal/journal.component').then(m => m.JournalComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/tasks/tasks.component').then(m => m.TasksComponent),
  },
  {
    path: 'pomodoro',
    loadComponent: () => import('./components/pomodoro/pomodoro.component').then(m => m.PomodoroComponent),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent),
  },
  {
    path: 'habits',
    loadComponent: () => import('./components/habits/habits.component').then(m => m.HabitsComponent),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];