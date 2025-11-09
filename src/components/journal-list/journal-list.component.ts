import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../types';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 sm:p-8 max-w-7xl mx-auto">
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100">My Journal</h1>
        <button (click)="newEntry()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
          New Entry
        </button>
      </header>
      
      <div class="mb-6">
        <input 
          type="text" 
          placeholder="Search entries by content or mood..." 
          (input)="onSearch($event)"
          class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
      </div>

      <main>
        @if (filteredEntries().length === 0) {
          <div class="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
            @if (journalService.entries$().length > 0) {
              <p class="text-gray-500 dark:text-gray-400 text-lg">No entries found for your search.</p>
            } @else {
              <p class="text-gray-500 dark:text-gray-400 text-lg">No journal entries yet.</p>
              <p class="text-gray-500 dark:text-gray-400 mt-2">Click "New Entry" to get started!</p>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (entry of filteredEntries(); track entry.id) {
              <a [routerLink]="['/journal', entry.id]" class="block bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <div class="flex justify-between items-start mb-2">
                    <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">{{ entry.date | date:'longDate' }}</h2>
                    @if (entry.mood) {
                      <span class="text-2xl" [title]="entry.mood">{{ getMoodEmoji(entry.mood) }}</span>
                    }
                </div>
                <p class="text-gray-600 dark:text-gray-300 line-clamp-3">{{ entry.content }}</p>
              </a>
            }
          </div>
        }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalListComponent {
  journalService = inject(JournalService);
  private router: Router = inject(Router);

  searchTerm = signal('');
  
  filteredEntries = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
        return this.journalService.entries$();
    }
    return this.journalService.entries$().filter(entry => 
        entry.content.toLowerCase().includes(term) ||
        entry.mood?.toLowerCase().includes(term)
    );
  });

  newEntry(): void {
    this.router.navigate(['/journal/new']);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  getMoodEmoji(mood: string): string {
    const lowerMood = mood.toLowerCase();
    const moodMap: { [key: string]: string } = {
      happy: '😊', calm: '😌', neutral: '😐', sad: '😔',
      angry: '😠', anxious: '😥', excited: '🤩', tired: '😴',
      optimistic: '😊', stressed: '😥'
    };
    const key = Object.keys(moodMap).find(m => lowerMood.includes(m));
    return key ? moodMap[key] : '🤔';
  }
}
