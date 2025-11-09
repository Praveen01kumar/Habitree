import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
      <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
        <i class="fas fa-brain text-primary-500 mr-3"></i>
        AI Productivity Assistant
      </h3>
      <div class="space-y-3">
        @for (insight of aiInsights(); track $index) {
          <p class="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg text-sm">{{ insight }}</p>
        } @empty {
          <p class="text-slate-500 dark:text-slate-400 text-sm">No insights to display. Complete more activities to get feedback.</p>
        }
      </div>
       <div class="mt-4 space-y-2">
            <button class="w-full text-left text-sm p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                💡 Suggest a schedule for tomorrow
            </button>
             <button class="w-full text-left text-sm p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                🔔 Remind me during peak focus hours
            </button>
        </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantComponent {
  private analyticsService = inject(AnalyticsService);

  aiInsights = computed(() => {
    const weeklyData = this.analyticsService.getFilteredData('weekly');
    return this.analyticsService.getAIInsights(weeklyData);
  });
}
