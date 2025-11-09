

import { Component, ChangeDetectionStrategy, inject, input, viewChild, ElementRef, AfterViewInit, OnDestroy, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';
import { DateRange } from '../../../types';

@Component({
  selector: 'app-planned-vs-reactive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Planned vs. Reactive Work</h3>
    <div class="relative h-64">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedVsReactiveComponent implements AfterViewInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;
  
  dateRange = input.required<DateRange>();

  chartData = computed(() => {
    const data = this.analyticsService.getFilteredData(this.dateRange());
    const totalPlanned = data.timeSeries.reduce((sum, item) => sum + item.planned, 0);
    const totalReactive = data.timeSeries.reduce((sum, item) => sum + item.reactive, 0);
    return [totalPlanned, totalReactive];
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
    const data = this.chartData();
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const borderColor = isDark ? '#1e293b' : '#ffffff';
    
    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Planned', 'Reactive'],
        datasets: [{
          data: data,
          backgroundColor: ['#0ea5e9', '#f43f5e'],
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
            labels: { color: textColor }
          }
        }
      },
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = this.chartData();
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
