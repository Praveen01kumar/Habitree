import { Component, ChangeDetectionStrategy, inject, input, viewChild, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';
import { DateRange } from '../../../types';
// FIX: Use modular imports for date-fns to resolve export errors.
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';

@Component({
  selector: 'app-focus-hours-trend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Focus Hours Trend</h3>
    <div class="relative h-64">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusHoursTrendComponent implements AfterViewInit, OnDestroy {
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
        this.updateChartTheme();
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private getChartData() {
    const data = this.analyticsService.getFilteredData(this.dateRange());
    const dailyFocus: { [key: string]: number } = {};

    for (const session of data.pomodoroSessions) {
        const dateStr = session.date.split('T')[0];
        dailyFocus[dateStr] = (dailyFocus[dateStr] || 0) + (session.duration / 60);
    }
    
    const labels = Object.keys(dailyFocus).sort();
    const chartData = labels.map(label => dailyFocus[label]);

    return {
        labels: labels.map(l => format(parseISO(l), 'MMM d')),
        data: chartData
    };
  }

  private createChart(): void {
    const { labels, data } = this.getChartData();
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Focus Time (minutes)',
            data: data,
            borderColor: '#10b981', // emerald-500
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
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
            ticks: { color: textColor },
            title: { display: true, text: 'Minutes', color: textColor }
          },
          x: {
            grid: { color: 'transparent' },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      },
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    const { labels, data } = this.getChartData();
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
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
        // FIX: Cast the scale options to access title property, which is not available on all scale types in the union.
        const yTitle = (scales.y as { title?: { color: string } }).title;
        if (yTitle) yTitle.color = textColor;
    }
    if (scales?.x) {
        scales.x.ticks!.color = textColor;
    }
    this.chart.update();
  }
}