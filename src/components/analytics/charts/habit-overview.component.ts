

import { Component, ChangeDetectionStrategy, inject, viewChild, ElementRef, AfterViewInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';
import { Habit, HabitCategory } from '../../../types';
import { HABIT_CATEGORIES } from '../../../services/habit.service';

@Component({
  selector: 'app-habit-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Habit Categories</h3>
    <div class="relative h-48">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitOverviewComponent implements AfterViewInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;

  chartData = computed(() => {
    const habits = this.analyticsService.getFilteredData('monthly').habits;
    const categoryCounts = habits.reduce((acc, habit) => {
      acc[habit.category] = (acc[habit.category] || 0) + 1;
      return acc;
    }, {} as { [key in HabitCategory]?: number });

    const labels = Object.keys(categoryCounts) as HabitCategory[];
    const data = labels.map(label => categoryCounts[label]!);
    const colors = labels.map(label => HABIT_CATEGORIES[label]);
    return { labels, data, colors };
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
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const borderColor = isDark ? '#1e293b' : '#ffffff';
    
    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: borderColor,
          borderWidth: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { 
                color: textColor,
                boxWidth: 12,
                padding: 10
            }
          }
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
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    if (this.chart.options.plugins?.legend) {
        this.chart.options.plugins.legend.labels!.color = textColor;
    }
    this.chart.data.datasets[0].borderColor = borderColor;
    this.chart.update();
  }
}
