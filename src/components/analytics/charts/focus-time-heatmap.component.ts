import { Component, ChangeDetectionStrategy, inject, viewChild, ElementRef, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, BubbleController } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { ThemeService } from '../../../services/theme.service';

// Register the bubble controller, which is needed for 'bubble' chart type.
// This ensures it's available before any component lifecycle hooks are executed.
Chart.register(BubbleController);

@Component({
  selector: 'app-focus-time-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Focus Time Heatmap</h3>
    <div class="relative h-[28rem] sm:h-96">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusTimeHeatmapComponent implements OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private themeService = inject(ThemeService);
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: Chart | null = null;
  private chartInitialized = false;

  constructor() {
    effect(() => {
      if (this.chartCanvas() && !this.chartInitialized) {
        this.createChart();
        this.chartInitialized = true;
      }
    });

    effect(() => {
      if(this.chart) {
        this.updateChartTheme();
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private createChart(): void {
    const data = this.analyticsService.getFilteredData('monthly').focusHeatmap;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const chartData = data
      .filter(item => item.value > 0)
      .map(item => ({
        x: item.day,
        y: item.hour,
        r: item.value * 4 + 2 // Radius: min 2, scales with value
    }));

    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    this.chart = new Chart(this.chartCanvas().nativeElement, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Pomodoro Sessions',
          data: chartData,
          backgroundColor: 'rgba(22, 163, 74, 0.7)', // green-600 with opacity
          borderColor: 'rgba(22, 163, 74, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            min: -1,
            max: 24,
            reverse: true, // Show 0h at the top
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: 2,
              padding: 5,
              callback: (value: string | number) => {
                if (typeof value === 'number' && value >= 0 && value <= 23) {
                  return `${String(value).padStart(2, '0')}:00`;
                }
                return ''; // Hide ticks for values outside the 0-23 range
              }
            }
          },
          x: {
            type: 'category',
            labels: days,
            grid: { display: false },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any) => {
                if (!items.length) return '';
                const item = items[0];
                return `${item.raw.x}, ${String(item.raw.y).padStart(2, '0')}:00`;
              },
              label: (item: any) => {
                const v = Math.round((item.raw.r - 2) / 4);
                return `Sessions: ${v}`;
              }
            }
          }
        }
      }
    });
  }

  private updateChartTheme(): void {
    if (!this.chart) return;
    const isDark = this.themeService.effectiveTheme$() === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

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
