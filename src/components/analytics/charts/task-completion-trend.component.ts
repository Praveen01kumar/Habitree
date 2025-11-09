


import { Component, ChangeDetectionStrategy, inject, input, viewChild, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';
import { DateRange } from '../../../types';
// FIX: Use modular imports for date-fns to resolve export errors.
import { format } from 'date-fns/format';

@Component({
  selector: 'app-task-completion-trend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Task Completion Trend</h3>
    <div class="relative h-64">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCompletionTrendComponent implements AfterViewInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;
  
  dateRange = input.required<DateRange>();

  constructor() {
    effect(() => {
        this.updateChartData();
    });

    effect(() => {
      if (this.chart) {
        this.updateChartTheme();
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const data = this.analyticsService.getFilteredData(this.dateRange());
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'line',
      data: {
        labels: data.timeSeries.map(d => format(new Date(d.date), 'MMM d')),
        datasets: [
          {
            label: 'Tasks Completed',
            data: data.timeSeries.map(d => d.completed),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#38bdf8',
          },
          {
            label: 'Tasks Created',
            data: data.timeSeries.map(d => d.created),
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167, 139, 250, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#a78bfa',
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          x: {
            grid: { color: 'transparent' },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor }
          }
        }
      },
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    const data = this.analyticsService.getFilteredData(this.dateRange());
    this.chart.data.labels = data.timeSeries.map(d => format(new Date(d.date), this.dateRange() === 'daily' ? 'HH:mm' : 'MMM d'));
    this.chart.data.datasets[0].data = data.timeSeries.map(d => d.completed);
    this.chart.data.datasets[1].data = data.timeSeries.map(d => d.created);
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
    if (this.chart.options.plugins?.legend) {
        this.chart.options.plugins.legend.labels!.color = textColor;
    }
    this.chart.update();
  }
}
