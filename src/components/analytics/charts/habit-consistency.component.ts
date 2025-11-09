

import { Component, ChangeDetectionStrategy, inject, viewChild, ElementRef, AfterViewInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-habit-consistency',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Longest Streaks</h3>
    <div class="relative h-48">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitConsistencyComponent implements AfterViewInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;
  
  habits = computed(() => this.analyticsService.getFilteredData('monthly').habits);

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
    const habits = this.habits();
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    
    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'bar',
      data: {
        labels: habits.map(h => h.title),
        datasets: [{
          label: 'Longest Streak (days)',
          data: habits.map(h => h.longestStreak),
          backgroundColor: '#8b5cf6',
          borderRadius: 4
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: 'transparent' },
            ticks: { color: textColor }
          },
          x: {
            beginAtZero: true,
            grid: { color: gridColor },
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
    const habits = this.habits();
    this.chart.data.labels = habits.map(h => h.title);
    this.chart.data.datasets[0].data = habits.map(h => h.longestStreak);
    this.chart.update('none');
  }

  private updateChartTheme(): void {
    if (!this.chart) return;
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const scales = this.chart.options.scales;
    if (scales?.y) {
        scales.y.ticks!.color = textColor;
    }
    if (scales?.x) {
        scales.x.grid!.color = gridColor;
        scales.x.ticks!.color = textColor;
    }
    this.chart.update();
  }
}
