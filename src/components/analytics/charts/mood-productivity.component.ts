



import { Component, ChangeDetectionStrategy, inject, input, viewChild, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';
import { DateRange } from '../../../types';
// FIX: Use modular imports for date-fns to resolve export errors.
import { format } from 'date-fns/format';

@Component({
  selector: 'app-mood-productivity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Mood vs. Productivity</h3>
    <div class="relative h-64">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodProductivityComponent implements AfterViewInit, OnDestroy {
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

  private createChart(): void {
    const data = this.analyticsService.getFilteredData(this.dateRange());
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'line',
      data: {
        labels: data.moodProductivity.map(d => format(new Date(d.date), 'MMM d')),
        datasets: [
          {
            label: 'Productivity Score',
            data: data.moodProductivity.map(d => d.productivityScore),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Mood Score',
            data: data.moodProductivity.map(d => d.moodScore),
            borderColor: '#facc15',
            backgroundColor: 'rgba(250, 204, 21, 0.2)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
          x: {
            grid: { color: 'transparent' },
            ticks: { color: textColor }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: { color: textColor },
            title: { display: true, text: 'Productivity', color: textColor }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 1,
            max: 5,
            grid: { display: false },
            ticks: { color: textColor },
            title: { display: true, text: 'Mood', color: textColor }
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
    this.chart.data.labels = data.moodProductivity.map(d => format(new Date(d.date), 'MMM d'));
    this.chart.data.datasets[0].data = data.moodProductivity.map(d => d.productivityScore);
    this.chart.data.datasets[1].data = data.moodProductivity.map(d => d.moodScore);
    this.chart.update('none');
  }

  private updateChartTheme(): void {
    if (!this.chart) return;
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const scales = this.chart.options.scales;
    if (scales?.x) scales.x.ticks!.color = textColor;
    if (scales?.y) {
        scales.y.grid!.color = gridColor;
        scales.y.ticks!.color = textColor;
        // FIX: Cast the scale options to access title property, which is not available on all scale types in the union.
        const yTitle = (scales.y as { title?: { color: string } }).title;
        if(yTitle) yTitle.color = textColor;
    }
    if (scales?.y1) {
        scales.y1.ticks!.color = textColor;
        // FIX: Cast the scale options to access title property, which is not available on all scale types in the union.
        const y1Title = (scales.y1 as { title?: { color: string } }).title;
        if(y1Title) y1Title.color = textColor;
    }
    if (this.chart.options.plugins?.legend) {
        this.chart.options.plugins.legend.labels!.color = textColor;
    }
    this.chart.update();
  }
}