import { Injectable, signal, effect, inject } from '@angular/core';
import { PomodoroSettings, PomodoroStats, PomodoroSession } from '../types';
import { TaskService } from './task.service';
// FIX: Use modular imports for date-fns to resolve export errors.
import { subDays } from 'date-fns/subDays';
import { isSameDay } from 'date-fns/isSameDay';

@Injectable({
  providedIn: 'root',
})
export class PomodoroService {
  private taskService = inject(TaskService);

  private readonly settingsKey = 'pomodoro-settings';
  private readonly statsKey = 'pomodoro-stats';
  private readonly sessionsKey = 'pomodoro-sessions';

  private _settings = signal<PomodoroSettings>(this.loadSettings());
  private _stats = signal<PomodoroStats>(this.loadStats());
  private _sessions = signal<PomodoroSession[]>(this.loadSessions());

  public readonly settings$ = this._settings.asReadonly();
  public readonly stats$ = this._stats.asReadonly();
  public readonly sessions$ = this._sessions.asReadonly();

  constructor() {
    effect(() => this.saveSettings(this._settings()));
    effect(() => this.saveStats(this._stats()));
    effect(() => this.saveSessions(this._sessions()));

    this.checkDateForStatsReset();
  }

  updateSettings(newSettings: PomodoroSettings): void {
    this._settings.set(newSettings);
  }

  logSession(session: Omit<PomodoroSession, 'date'> & { date: string }): void {
    this._sessions.update(sessions => [...sessions, session]);
    
    // Update linked task
    if (session.taskId) {
        this.taskService.logPomodoroToTask(session.taskId, session.duration);
    }

    // Update stats
    this.checkDateForStatsReset();
    const today = new Date().toISOString().split('T')[0];
    this._stats.update(s => ({
        ...s,
        sessionsCompletedToday: s.sessionsCompletedToday + 1,
        lastSessionDate: today,
        focusStreak: this.calculateFocusStreak()
    }));
  }

  private calculateFocusStreak(): number {
    const completedDates = [...new Set(this.sessions$().map(s => s.date.split('T')[0]))]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (completedDates.length === 0) {
      return 0;
    }
    
    let streak = 0;
    const today = new Date();
    today.setHours(12,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const hasSessionToday = completedDates.some(d => isSameDay(d, today));
    const hasSessionYesterday = completedDates.some(d => isSameDay(d, yesterday));

    if (hasSessionToday || hasSessionYesterday) {
      let currentDate = new Date(today);
      if(!hasSessionToday) {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      while(completedDates.some(d => isSameDay(d, currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }
    
    return streak;
  }
  
  private checkDateForStatsReset(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this._stats().lastSessionDate !== today) {
        this._stats.update(s => ({
            ...s,
            sessionsCompletedToday: 0,
            lastSessionDate: today
        }));
    }
  }
  
  // --- Local Storage Persistence ---

  private loadSettings(): PomodoroSettings {
    try {
      const stored = localStorage.getItem(this.settingsKey);
      return stored ? JSON.parse(stored) : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  private saveSettings(settings: PomodoroSettings): void {
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
  }

  private getDefaultSettings(): PomodoroSettings {
    return { 'Pomodoro': 25 * 60, 'Short Break': 5 * 60, 'Long Break': 15 * 60, pomodorosPerLongBreak: 4, autoStartNext: false };
  }

  private loadStats(): PomodoroStats {
    try {
      const stored = localStorage.getItem(this.statsKey);
      const stats = stored ? JSON.parse(stored) : this.getDefaultStats();
      // Recalculate streak on load
      stats.focusStreak = this.calculateFocusStreak();
      return stats;
    } catch {
      return this.getDefaultStats();
    }
  }

  private saveStats(stats: PomodoroStats): void {
    localStorage.setItem(this.statsKey, JSON.stringify(stats));
  }

  private getDefaultStats(): PomodoroStats {
    return { sessionsCompletedToday: 0, lastSessionDate: new Date().toISOString().split('T')[0], focusStreak: 0 };
  }

  private loadSessions(): PomodoroSession[] {
    try {
        const stored = localStorage.getItem(this.sessionsKey);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
  }

  private saveSessions(sessions: PomodoroSession[]): void {
    localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
  }
}