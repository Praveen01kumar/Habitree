import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { PomodoroMode, PomodoroSettings, Task } from '../../types';
import { PomodoroService } from '../../services/pomodoro.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col items-center">
      <header class="mb-8 text-center relative">
        <h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100">Pomodoro Timer</h1>
        <p class="text-lg text-slate-500 dark:text-slate-400 mt-2">Stay focused, take breaks, and get things done.</p>
        <button (click)="openSettings()" title="Settings" class="absolute top-0 right-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-full transition-colors">
          <i class="fas fa-cog fa-lg"></i>
        </button>
      </header>

      <main class="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8">
        <!-- Mode Selector -->
        <div class="flex justify-center bg-slate-100 dark:bg-slate-700 rounded-full p-1 mb-4">
          @for (m of modes; track m) {
            <button 
              (click)="setMode(m)"
              [class.bg-white]="mode() === m"
              [class.dark:bg-slate-900]="mode() === m"
              [class.text-slate-900]="mode() === m"
              [class.dark:text-slate-100]="mode() === m"
              class="w-1/3 px-2 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-full transition-colors duration-300">
              {{ m }}
            </button>
          }
        </div>

        <!-- Task Selector -->
        <div class="mb-8">
            <label for="task-select" class="sr-only">Link to a task</label>
            <select 
              id="task-select" 
              [ngModel]="selectedTaskId()"
              (ngModelChange)="selectTask($event)"
              [disabled]="isRunning()"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50">
                <option [ngValue]="undefined">No linked task</option>
                @for(task of availableTasks(); track task.id) {
                    <option [value]="task.id">{{ task.title }}</option>
                }
            </select>
        </div>

        <!-- Timer -->
        <div class="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto mb-8">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 250 250">
            <circle class="text-slate-200 dark:text-slate-700" stroke-width="12" stroke="currentColor" fill="transparent" r="119" cx="125" cy="125" />
            <circle
              [class]="timerColorClass()"
              stroke-width="12"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="strokeDashoffset()"
              stroke-linecap="round"
              stroke="currentColor"
              fill="transparent"
              r="119"
              cx="125"
              cy="125"
              style="transition: stroke-dashoffset 1s linear;"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-5xl sm:text-6xl font-mono font-bold text-slate-800 dark:text-slate-100">{{ formatTime(remainingTime()) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center space-x-6">
          <button (click)="resetTimer()" title="Reset Timer" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-12 h-12 flex items-center justify-center">
            <i class="fas fa-redo-alt fa-lg"></i>
          </button>
          
          <button 
            (click)="toggleTimer()" 
            class="w-20 h-20 rounded-full text-white shadow-lg text-2xl font-bold transition-transform transform hover:scale-105"
            [class]="isRunning() ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-500 hover:bg-primary-600'">
            {{ isRunning() ? 'PAUSE' : 'START' }}
          </button>
          
          <button (click)="skipToNext()" title="Skip to next session" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-12 h-12 flex items-center justify-center">
             <i class="fas fa-forward fa-lg"></i>
          </button>
        </div>
      </main>

      <!-- Stats & Quote -->
      <footer class="mt-8 text-center w-full max-w-md">
        <div class="flex justify-around items-center text-slate-600 dark:text-slate-300">
            <p>Today's Pomodoros: <strong>{{ stats().sessionsCompletedToday }}</strong></p>
            <p>Focus Streak: <strong>{{ stats().focusStreak }} 🔥</strong></p>
            <p>Interruptions: <strong>{{ interruptions() }}</strong></p>
        </div>
        
        <div class="mt-6 h-12 flex items-center justify-center">
          @if (isFetchingQuote()) {
            <p class="text-slate-500 dark:text-slate-400 animate-pulse">Getting your motivation...</p>
          } @else if (motivationalQuote(); as quote) {
            <p class="text-lg italic text-slate-700 dark:text-slate-200">"{{ quote }}"</p>
          }
        </div>
      </footer>
      
      <!-- Session Summary Modal -->
      @if (showSummary()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="showSummary.set(false)"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <header class="mb-4">
                <i class="fas fa-check-circle text-green-500 text-4xl mb-2"></i>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Cycle Complete!</h2>
            </header>
            <div class="text-slate-600 dark:text-slate-300 space-y-2">
              <p>Great work! You've completed a full Pomodoro cycle.</p>
              <p>Total Focus Time: <strong>{{ summaryStats().totalFocusTime }} minutes</strong></p>
              <p>Interruptions: <strong>{{ summaryStats().totalInterruptions }}</strong></p>
            </div>
             <footer class="mt-6">
                <button (click)="showSummary.set(false)" class="w-full px-6 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors">
                  Keep Going!
                </button>
            </footer>
          </div>
        </div>
      }

      <!-- Settings Modal -->
      @if (isSettingsOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeSettings()"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
            <header class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
              <button (click)="closeSettings()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i class="fas fa-times fa-lg"></i>
              </button>
            </header>
            <form [formGroup]="settingsForm" (ngSubmit)="saveNewSettings()">
              <div class="space-y-4">
                <div>
                  <label for="pomodoro" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pomodoro (minutes)</label>
                  <input type="number" id="pomodoro" formControlName="pomodoro" min="1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label for="shortBreak" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Break (minutes)</label>
                  <input type="number" id="shortBreak" formControlName="shortBreak" min="1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label for="longBreak" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Long Break (minutes)</label>
                  <input type="number" id="longBreak" formControlName="longBreak" min="1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label for="pomodorosPerLongBreak" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pomodoros until Long Break</label>
                  <input type="number" id="pomodorosPerLongBreak" formControlName="pomodorosPerLongBreak" min="1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="flex items-center space-x-3 pt-2">
                   <input type="checkbox" id="autoStartNext" formControlName="autoStartNext" class="h-4 w-4 rounded text-primary-600 focus:ring-primary-500">
                   <label for="autoStartNext" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto-start next session</label>
                </div>
              </div>
              <footer class="flex justify-end space-x-4 mt-8">
                <button type="button" (click)="closeSettings()" class="px-6 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                  Cancel
                </button>
                <button type="submit" [disabled]="settingsForm.invalid" class="px-6 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                  Save
                </button>
              </footer>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PomodoroComponent implements OnInit, OnDestroy {
  private geminiService = inject(GeminiService);
  private fb = inject(FormBuilder);
  private pomodoroService = inject(PomodoroService);
  private taskService = inject(TaskService);

  settings = this.pomodoroService.settings$;
  stats = this.pomodoroService.stats$;
  mode = signal<PomodoroMode>('Pomodoro');
  isRunning = signal(false);
  
  private totalDuration = computed(() => this.settings()[this.mode()]); 
  remainingTime = signal(this.totalDuration());

  motivationalQuote = signal<string | null>(null);
  isFetchingQuote = signal(false);

  isSettingsOpen = signal(false);
  settingsForm: FormGroup;

  modes: PomodoroMode[] = ['Pomodoro', 'Short Break', 'Long Break'];
  progress = computed(() => this.totalDuration() > 0 ? (this.totalDuration() - this.remainingTime()) / this.totalDuration() : 0);
  circumference = 2 * Math.PI * 119;
  strokeDashoffset = computed(() => this.circumference * (1 - this.progress()));
  
  // New state for task integration and advanced features
  availableTasks = computed(() => this.taskService.tasks$().filter(t => t.status === 'To Do' || t.status === 'In Progress'));
  selectedTaskId = signal<number | undefined>(undefined);
  interruptions = signal(0);
  showSummary = signal(false);
  summaryStats = signal({ totalFocusTime: 0, totalInterruptions: 0 });
  private cycleInterruptions = 0;
  private cyclePomodoros = 0;

  private _timerId: any = null;
  private _sessionCompletedHandled = true;

  constructor() {
    this.settingsForm = this.fb.group({
      pomodoro: [25, [Validators.required, Validators.min(1)]],
      shortBreak: [5, [Validators.required, Validators.min(1)]],
      longBreak: [15, [Validators.required, Validators.min(1)]],
      pomodorosPerLongBreak: [4, [Validators.required, Validators.min(1)]],
      autoStartNext: [false, Validators.required]
    });

    effect(() => {
        const time = this.remainingTime();
        if (time <= 0 && this.isRunning()) {
          this.pauseTimer();
          this.handleSessionCompletion();
        }
    });
  }

  ngOnInit(): void {
    this.resetTimer(false);
  }

  ngOnDestroy(): void {
    this.pauseTimer();
  }

  openSettings(): void {
    const currentSettings = this.settings();
    this.settingsForm.setValue({
      pomodoro: currentSettings['Pomodoro'] / 60,
      shortBreak: currentSettings['Short Break'] / 60,
      longBreak: currentSettings['Long Break'] / 60,
      pomodorosPerLongBreak: currentSettings.pomodorosPerLongBreak,
      autoStartNext: currentSettings.autoStartNext
    });
    this.isSettingsOpen.set(true);
  }

  closeSettings(): void {
    this.isSettingsOpen.set(false);
  }

  saveNewSettings(): void {
    if (this.settingsForm.invalid) return;
    const formValue = this.settingsForm.value;
    const newSettings: PomodoroSettings = {
      'Pomodoro': formValue.pomodoro * 60,
      'Short Break': formValue.shortBreak * 60,
      'Long Break': formValue.longBreak * 60,
      pomodorosPerLongBreak: formValue.pomodorosPerLongBreak,
      autoStartNext: formValue.autoStartNext
    };
    this.pomodoroService.updateSettings(newSettings);
    if (!this.isRunning()) {
      this.resetTimer(false);
    }
    this.closeSettings();
  }

  toggleTimer(): void {
    this.isRunning() ? this.pauseTimer() : this.startTimer();
  }

  startTimer(): void {
    if (this.isRunning() || this.remainingTime() <= 0) return;
    this.isRunning.set(true);
    this.motivationalQuote.set(null);
    this._sessionCompletedHandled = false;
    this._timerId = setInterval(() => {
      this.remainingTime.update(t => t - 1);
    }, 1000);
  }

  pauseTimer(): void {
    if (this.isRunning() && this.mode() === 'Pomodoro') {
      this.interruptions.update(i => i + 1);
      this.cycleInterruptions++;
    }
    this.isRunning.set(false);
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  resetTimer(shouldPause = true): void {
    if (shouldPause) this.pauseTimer();
    this.remainingTime.set(this.settings()[this.mode()]);
    this.motivationalQuote.set(null);
    this.interruptions.set(0);
  }
  
  setMode(newMode: PomodoroMode): void {
    if (this.isRunning() && !confirm('A session is running. Are you sure you want to switch?')) {
      return;
    }
    this.pauseTimer();
    this.mode.set(newMode);
    this.resetTimer(false);
  }

  selectTask(taskId: any): void {
    const id = taskId ? Number(taskId) : undefined;
    this.selectedTaskId.set(id);
  }

  skipToNext(): void {
      this.pauseTimer();
      this.handleSessionCompletion(false);
  }

  private handleSessionCompletion(updateStats = true): void {
    if (this._sessionCompletedHandled) return;
    this._sessionCompletedHandled = true;

    this.playNotificationSound();
    const currentMode = this.mode();
    if (currentMode === 'Pomodoro' && updateStats) {
      const duration = this.settings()['Pomodoro'];
      this.pomodoroService.logSession({
        date: new Date().toISOString(),
        duration,
        taskId: this.selectedTaskId(),
        interruptions: this.interruptions()
      });
      this.cyclePomodoros++;

      if (this.stats().sessionsCompletedToday % this.settings().pomodorosPerLongBreak === 0) {
        this.summaryStats.set({
          totalFocusTime: (this.settings()['Pomodoro'] / 60) * this.cyclePomodoros,
          totalInterruptions: this.cycleInterruptions
        });
        this.showSummary.set(true);
        this.cycleInterruptions = 0;
        this.cyclePomodoros = 0;
      }
    }
    this.getQuote();

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

  private async getQuote(): Promise<void> {
    this.isFetchingQuote.set(true);
    this.motivationalQuote.set(null);
    try {
        const quote = await this.geminiService.getMotivationalQuote();
        this.motivationalQuote.set(quote);
    } finally {
        this.isFetchingQuote.set(false);
    }
  }

  private playNotificationSound(): void {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audio.play().catch(e => console.error("Error playing sound:", e));
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  timerColorClass(): string {
    switch (this.mode()) {
      case 'Pomodoro': return 'text-red-500';
      case 'Short Break': return 'text-green-500';
      case 'Long Break': return 'text-blue-500';
    }
  }
}