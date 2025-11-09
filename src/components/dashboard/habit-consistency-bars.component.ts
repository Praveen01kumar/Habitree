import { Component, ChangeDetectionStrategy, inject, viewChild, ElementRef, AfterViewInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { HabitService } from '../../services/habit.service';
import { ThemeService } from '../../services/theme.service';
// FIX: Use modular imports for date-fns to resolve export errors.
import { format } from 'date-fns/format';
import { subDays } from 'date-fns/subDays';

@Component({
  selector: 'app-habit-consistency-bars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Top Habit Consistency</h3>
    <div class="relative h-48">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitConsistencyBarsComponent implements AfterViewInit, OnDestroy {
  private habitService = inject(HabitService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;
  
  chartData = computed(() => {
      const topHabits = this.habitService.habits$()
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 3);
      
      const today = new Date();
      const weeklyCompletions = topHabits.map(habit => {
          let count = 0;
          for(let i=0; i<7; i++) {
              const day = subDays(today, i);
              const dateString = format(day, 'yyyy-MM-dd');
              if (habit.completions[dateString]) {
                  count++;
              }
          }
          return {
              habit,
              completionRate: (count / 7) * 100
          };
      });

      return {
          labels: weeklyCompletions.map(item => item.habit.title),
          data: weeklyCompletions.map(item => item.completionRate),
          colors: weeklyCompletions.map(item => item.habit.color)
      };
  });

  constructor() {
    effect(() => {
        this.updateChartData();
    });
    effect(() => {
        this.updateChartTheme();
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const { labels, data, colors } = this.chartData();
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    
    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weekly Completion %',
          data: data,
          backgroundColor: colors,
          borderRadius: 4
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
             beginAtZero: true,
             max: 100,
             grid: { color: gridColor },
             ticks: { color: textColor, callback: (value) => `${value}%` }
          },
          x: {
            grid: { color: 'transparent' },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: { display: false }
        }
      },
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    const { labels, data, colors } = this.chartData();
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.update('none');
  }

  private updateChartTheme(): void {
    if (!this.chart) return;
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const scales = this.chart.options.scales;
    if (scales?.y) {
        scales.y.grid!.color = gridColor;
        scales.y.ticks!.color = textColor;
    }
    if (scales?.x) {
        scales.x.ticks!.color = textColor;
    }
    this.chart.update();
  }
}
