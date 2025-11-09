

import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { DateRange } from '../../types';

import { TaskCompletionTrendComponent } from './charts/task-completion-trend.component';
import { PlannedVsReactiveComponent } from './charts/planned-vs-reactive.component';
import { FocusTimeHeatmapComponent } from './charts/focus-time-heatmap.component';
import { HabitConsistencyComponent } from './charts/habit-consistency.component';
import { MoodProductivityComponent } from './charts/mood-productivity.component';
import { HabitOverviewComponent } from './charts/habit-overview.component';
import { FocusHoursTrendComponent } from './charts/focus-hours-trend.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    TaskCompletionTrendComponent,
    PlannedVsReactiveComponent,
    FocusTimeHeatmapComponent,
    HabitConsistencyComponent,
    MoodProductivityComponent,
    HabitOverviewComponent,
    FocusHoursTrendComponent,
  ],
  template: `
    <div class="p-4 sm:p-8 max-w-screen-2xl mx-auto">
      <header class="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <div>
          <h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
          <p class="text-lg text-slate-500 dark:text-slate-400 mt-2">Your productivity and mindfulness journey, visualized.</p>
        </div>
        <div class="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-1 mt-4 sm:mt-0 self-start sm:self-center">
          @for (range of dateRanges; track range.key) {
            <button
              (click)="setDateRange(range.key)"
              class="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center"
              [class.bg-white]="selectedDateRange() === range.key"
              [class.dark:bg-slate-800]="selectedDateRange() === range.key"
              [class.text-slate-800]="selectedDateRange() === range.key"
              [class.dark:text-slate-100]="selectedDateRange() === range.key"
              [class.text-slate-500]="selectedDateRange() !== range.key"
              [class.dark:text-slate-400]="selectedDateRange() !== range.key"
            >
              <i class="w-4 text-center mr-1.5" [class]="range.icon"></i>
              {{ range.label }}
            </button>
          }
        </div>
      </header>

      <main class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Main charts column -->
        <div class="lg:col-span-2 xl:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div class="xl:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
             <app-task-completion-trend [dateRange]="selectedDateRange()" />
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-planned-vs-reactive [dateRange]="selectedDateRange()" />
          </div>
           <div class="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-focus-hours-trend [dateRange]="selectedDateRange()" />
          </div>
          <div class="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-focus-time-heatmap />
          </div>
           <div class="xl:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-habit-overview />
          </div>
          <div class="xl:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-habit-consistency />
          </div>
          <div class="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <app-mood-productivity [dateRange]="selectedDateRange()" />
          </div>
        </div>

        <!-- AI Insights Column -->
        <aside class="lg:col-span-1 xl:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 h-fit sticky top-6">
          <h2 class="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <i class="fas fa-brain text-primary-500 mr-3"></i>
            AI Insights
          </h2>
          <div class="space-y-4">
             @for (insight of aiInsights(); track $index) {
              <p class="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg text-sm">{{ insight }}</p>
             } @empty {
                <p class="text-slate-500 dark:text-slate-400">No insights to display for the selected period.</p>
             }
          </div>
        </aside>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  private analyticsService = inject(AnalyticsService);
  private readonly rangeKey = 'analytics-date-range';

  dateRanges: { key: DateRange, label: string, icon: string }[] = [
    { key: 'daily', label: 'Daily', icon: 'fas fa-sun' },
    { key: 'weekly', label: 'Weekly', icon: 'fas fa-calendar-week' },
    { key: 'monthly', label: 'Monthly', icon: 'fas fa-calendar-alt' },
  ];
  
  selectedDateRange = signal<DateRange>(this.loadInitialDateRange());

  filteredData = computed(() => this.analyticsService.getFilteredData(this.selectedDateRange()));
  aiInsights = computed(() => this.analyticsService.getAIInsights(this.filteredData()));

  setDateRange(range: DateRange): void {
    this.selectedDateRange.set(range);
    localStorage.setItem(this.rangeKey, range);
  }
  
  private loadInitialDateRange(): DateRange {
    return (localStorage.getItem(this.rangeKey) as DateRange) || 'weekly';
  }
}
