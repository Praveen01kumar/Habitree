import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AnalyticsService } from '../../services/analytics.service';
import { TaskService } from '../../services/task.service';
import { HabitService } from '../../services/habit.service';
import { PomodoroService } from '../../services/pomodoro.service';

// Re-used Analytics Charts
import { PlannedVsReactiveComponent } from '../analytics/charts/planned-vs-reactive.component';
import { MoodProductivityComponent } from '../analytics/charts/mood-productivity.component';

// New Dashboard-specific components
import { AiAssistantComponent } from './ai-assistant.component';
import { FocusTimeTrendComponent } from './focus-time-trend.component';
import { HabitConsistencyBarsComponent } from './habit-consistency-bars.component';
import { MiniPomodoroComponent } from './mini-pomodoro.component';
import { Task, TaskPriority } from '../../types';

interface KpiCard {
  key: string;
  title: string;
  icon: string;
  value: string;
  unit: string;
  progress: number;
  colorClass: string;
  tooltip: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DecimalPipe,
    DatePipe,
    PlannedVsReactiveComponent,
    MoodProductivityComponent,
    AiAssistantComponent,
    FocusTimeTrendComponent,
    HabitConsistencyBarsComponent,
    MiniPomodoroComponent,
  ],
  template: `
    <div class="p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 min-h-full">
      <header class="mb-6">
        <h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p class="text-lg text-slate-500 dark:text-slate-400 mt-2">Your productivity command center for today.</p>
      </header>

      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- Main Content -->
        <main class="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <!-- KPI Cards -->
          @for (kpi of kpiCards(); track kpi.key) {
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center space-x-4" [title]="kpi.tooltip">
              <div class="relative w-16 h-16 flex-shrink-0">
                  <svg class="w-full h-full" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        class="stroke-current text-slate-200 dark:text-slate-700" fill="none" stroke-width="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        [class]="'stroke-current ' + kpi.colorClass"
                        fill="none" stroke-width="3" [attr.stroke-dasharray]="kpi.progress + ', 100'" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <i [class]="'fas ' + kpi.icon + ' text-xl'"></i>
                  </div>
              </div>
              <div>
                  <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">{{ kpi.title }}</p>
                  <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ kpi.value }}<span class="text-lg">{{ kpi.unit }}</span></p>
              </div>
            </div>
          }

          <!-- Charts -->
          <div class="md:col-span-2 xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
            <app-focus-time-trend />
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
             <app-planned-vs-reactive [dateRange]="'daily'" />
          </div>

          <div class="md:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
             <app-habit-consistency-bars />
          </div>
          
          <div class="md:col-span-2 xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
            <app-mood-productivity [dateRange]="'weekly'" />
          </div>

        </main>

        <!-- Right Insights Panel -->
        <aside class="xl:col-span-1 space-y-6">
          <app-ai-assistant />
          <app-mini-pomodoro />

          <!-- Upcoming Tasks -->
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Upcoming Tasks</h3>
              <div class="space-y-3">
                @for (task of upcomingTasks(); track task.id) {
                  <div class="flex items-center justify-between group">
                    <div class="flex items-center">
                      <i class="fas fa-circle text-xs mr-3" [class]="getPriorityClass(task.priority)"></i>
                      <div>
                        <p class="font-medium text-slate-800 dark:text-slate-100">{{ task.title }}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">{{ task.dueDate | date:'mediumDate' }}</p>
                      </div>
                    </div>
                    <button (click)="markTaskDone(task)" title="Mark as Done" class="px-2 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-700 hover:bg-green-100 dark:hover:bg-green-800 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fas fa-check"></i>
                    </button>
                  </div>
                } @empty {
                  <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No pending tasks. Great job!</p>
                }
              </div>
          </div>
          
           <!-- Weekly Goal -->
           <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
                <i class="fas fa-bullseye text-primary-500 mr-3"></i>
                Weekly Focus Goal
              </h3>
              <div>
                @let progress = (weeklyFocusTimeInHours() / weeklyFocusGoal()) * 100;
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div class="bg-primary-500 h-2.5 rounded-full" [style.width.%]="progress > 100 ? 100 : progress"></div>
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
                  <span>{{ weeklyFocusTimeInHours() | number:'1.1-1' }} / {{ weeklyFocusGoal() }} hours</span>
                  <span>{{ progress | number:'1.0-0' }}%</span>
                </div>
              </div>
           </div>

            <!-- Achievements -->
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Today's Achievements</h3>
                <div class="flex space-x-4 overflow-x-auto pb-2">
                  @if(kpis()?.tasksCompleted?.value >= 5) {
                    <div title="Task Master: Completed 5+ tasks today!" class="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                        <span class="text-4xl">🏆</span>
                        <p class="text-xs mt-1 font-medium">Task Master</p>
                    </div>
                  }
                   @if(kpis()?.focusTime?.value >= 120) {
                    <div title="Focus Legend: 2+ hours of focus today!" class="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                        <span class="text-4xl">🧠</span>
                        <p class="text-xs mt-1 font-medium">Focus Legend</p>
                    </div>
                  }
                   @if(kpis()?.habitConsistency?.value === 100 && habitService.habits$().length > 0) {
                    <div title="Perfect Day: All habits completed!" class="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                        <span class="text-4xl">🎯</span>
                        <p class="text-xs mt-1 font-medium">Perfect Day</p>
                    </div>
                  }
                  @if(kpis()?.tasksCompleted?.value < 5 && kpis()?.focusTime?.value < 120 && kpis()?.habitConsistency?.value < 100) {
                     <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4 w-full">Complete goals to earn badges!</p>
                  }
                </div>
            </div>
        </aside>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private analyticsService = inject(AnalyticsService);
  taskService = inject(TaskService);
  habitService = inject(HabitService);
  private pomodoroService = inject(PomodoroService);

  kpis = this.analyticsService.getDashboardKpis();

  upcomingTasks = computed(() =>
    this.taskService.tasks$()
      .filter(task => task.status !== 'Done')
      .slice(0, 3)
  );

  weeklyFocusGoal = signal(25); // 25 hours goal
  weeklyFocusTimeInHours = computed(() => {
      const weeklyData = this.analyticsService.getFilteredData('weekly');
      const totalSeconds = weeklyData.pomodoroSessions.reduce((acc, session) => acc + session.duration, 0);
      return totalSeconds / 3600;
  });

  kpiCards = computed<KpiCard[]>(() => {
    const data = this.kpis();
    if (!data) return [];
    
    return [
      { key: 'tasks', title: 'Tasks Done', icon: 'fa-check-double', value: data.tasksCompleted.value.toString(), unit: '', progress: data.tasksCompleted.percentage, colorClass: 'text-green-500', tooltip: `You've completed ${data.tasksCompleted.percentage.toFixed(0)}% of your tasks for today.` },
      { key: 'focus', title: 'Focus Time', icon: 'fa-brain', value: (data.focusTime.value / 60).toFixed(1), unit: ' hr', progress: (data.focusTime.value / (4*60)) * 100, colorClass: 'text-sky-500', tooltip: `${data.focusTime.value.toFixed(0)} minutes of deep work logged.` },
      { key: 'reactive', title: 'Reactive Work', icon: 'fa-bolt', value: data.reactiveWork.value.toFixed(0), unit: '%', progress: data.reactiveWork.value, colorClass: 'text-red-500', tooltip: 'Percentage of unplanned tasks completed.' },
      { key: 'habits', title: 'Habits', icon: 'fa-seedling', value: data.habitConsistency.value.toFixed(0), unit: '%', progress: data.habitConsistency.value, colorClass: 'text-purple-500', tooltip: `Consistency for today's habits.` },
      { key: 'mood', title: 'Mood Index', icon: 'fa-smile', value: data.moodIndex.value.toFixed(0), unit: '%', progress: data.moodIndex.value, colorClass: 'text-yellow-500', tooltip: `Based on your latest journal entry.` },
      { key: 'productivity', title: 'Productivity', icon: 'fa-rocket', value: data.productivityScore.value.toFixed(0), unit: '%', progress: data.productivityScore.value, colorClass: 'text-orange-500', tooltip: `AI-computed score based on your activity.` },
    ];
  });
  
  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case 'High': return `text-red-500`;
      case 'Medium': return `text-yellow-500`;
      case 'Low': return `text-green-500`;
    }
  }

  markTaskDone(task: Task): void {
      this.taskService.updateTaskStatus(task.id, 'Done');
  }
}
