import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../../services/pomodoro.service';
import { PomodoroMode } from '../../types';

@Component({
  selector: 'app-mini-pomodoro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
       <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Focus Session</h3>
       <div class="flex justify-center bg-slate-100 dark:bg-slate-700 rounded-full p-1 mb-4">
          @for (m of modes; track m) {
            <button 
              (click)="setMode(m)"
              [class.bg-white]="mode() === m"
              [class.dark:bg-slate-900]="mode() === m"
              [class.text-slate-900]="mode() === m"
              [class.dark:text-slate-100]="mode() === m"
              class="w-1/3 px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-full transition-colors duration-300">
              {{ m }}
            </button>
          }
        </div>

        <div class="text-center my-4">
            <p class="text-4xl font-mono font-bold text-slate-800 dark:text-slate-100">{{ formatTime(remainingTime()) }}</p>
        </div>

        <div class="flex items-center justify-center space-x-4">
            <button (click)="resetTimer()" title="Reset Timer" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-10 h-10 flex items-center justify-center">
                <i class="fas fa-redo-alt"></i>
            </button>
            <button (click)="toggleTimer()" class="w-16 h-16 rounded-full text-white shadow-lg font-bold transition-transform transform hover:scale-105"
                [class]="isRunning() ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-500 hover:bg-primary-600'">
                {{ isRunning() ? 'PAUSE' : 'START' }}
            </button>
            <button (click)="skipToNext()" title="Skip to next session" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-10 h-10 flex items-center justify-center">
                <i class="fas fa-forward"></i>
            </button>
        </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniPomodoroComponent implements OnDestroy {
  private pomodoroService = inject(PomodoroService);

  settings = this.pomodoroService.settings$;
  stats = this.pomodoroService.stats$;
  mode = signal<PomodoroMode>('Pomodoro');
  isRunning = signal(false);
  
  private totalDuration = computed(() => this.settings()[this.mode()]); 
  remainingTime = signal(this.totalDuration());

  modes: PomodoroMode[] = ['Pomodoro', 'Short Break', 'Long Break'];

  private timerId: any = null;
  private sessionCompletedHandled = true;

  constructor() {
    effect(() => {
        const time = this.remainingTime();
        if (time <= 0 && this.isRunning()) {
          this.pauseTimer();
          this.handleSessionCompletion();
        }
    });
    this.resetTimer(false);
  }

  ngOnDestroy(): void {
    this.pauseTimer();
  }

  toggleTimer(): void {
    this.isRunning() ? this.pauseTimer() : this.startTimer();
  }

  startTimer(): void {
    if (this.isRunning() || this.remainingTime() <= 0) return;
    this.isRunning.set(true);
    this.sessionCompletedHandled = false;
    this.timerId = setInterval(() => {
      this.remainingTime.update(t => t - 1);
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  resetTimer(shouldPause = true): void {
    if (shouldPause) this.pauseTimer();
    this.remainingTime.set(this.settings()[this.mode()]);
  }
  
  setMode(newMode: PomodoroMode): void {
    if (this.isRunning()) return;
    this.mode.set(newMode);
    this.resetTimer(false);
  }

  skipToNext(): void {
      this.pauseTimer();
      this.handleSessionCompletion(false);
  }

  private handleSessionCompletion(updateStats = true): void {
    if (this.sessionCompletedHandled) return;
    this.sessionCompletedHandled = true;
    
    if (this.mode() === 'Pomodoro' && updateStats) {
      this.pomodoroService.logSession({
        date: new Date().toISOString(),
        duration: this.settings()['Pomodoro'],
        interruptions: 0 // Cannot track interruptions in mini-widget
      });
    }

    const nextMode = this.getNextMode();
    this.mode.set(nextMode);
    this.resetTimer(false);
    if(this.settings().autoStartNext) {
      this.startTimer();
    }
  }

  private getNextMode(): PomodoroMode {
      const currentMode = this.mode();
      if (currentMode === 'Pomodoro') {
          return this.stats().sessionsCompletedToday > 0 && this.stats().sessionsCompletedToday % this.settings().pomodorosPerLongBreak === 0
              ? 'Long Break'
              : 'Short Break';
      }
      return 'Pomodoro';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
