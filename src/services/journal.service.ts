import { Injectable, signal, effect } from '@angular/core';
import { JournalEntry } from '../types';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private readonly entriesKey = 'journal-entries';

  private _entries = signal<JournalEntry[]>(this.loadFromLocalStorage());
  
  public readonly entries$ = this._entries.asReadonly();

  constructor() {
    // Persist to local storage whenever entries change
    // FIX: Replaced `computed` with `effect` for side-effects, which is the correct semantic usage.
    effect(() => {
        this.saveToLocalStorage(this._entries());
    });
  }

  getEntry(id: number): JournalEntry | undefined {
    return this.entries$().find(e => e.id === id);
  }

  addEntry(content: string, mood?: string, insights?: string[]): JournalEntry {
    const newEntry: JournalEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      content,
      mood,
      insights
    };
    this._entries.update(entries => [newEntry, ...entries]); // Prepend new entries
    return newEntry;
  }

  updateEntry(updatedEntry: JournalEntry): void {
    this._entries.update(entries => 
        entries.map(e => e.id === updatedEntry.id ? updatedEntry : e)
    );
  }

  private loadFromLocalStorage(): JournalEntry[] {
    try {
      const storedEntries = localStorage.getItem(this.entriesKey);
      return storedEntries ? JSON.parse(storedEntries) : this.getInitialMockData();
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return this.getInitialMockData();
    }
  }

  private saveToLocalStorage(entries: JournalEntry[]): void {
    try {
      localStorage.setItem(this.entriesKey, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  private getInitialMockData(): JournalEntry[] {
    return [
      { id: 1, date: new Date(Date.now() - 86400000 * 2).toISOString(), content: 'Feeling optimistic about the new project. There is a lot to learn, but I am excited for the challenge.' , mood: 'Optimistic' },
      { id: 2, date: new Date(Date.now() - 86400000).toISOString(), content: 'A bit stressed today with the deadline approaching. Took a walk to clear my head, which helped a lot.' , mood: 'Stressed' },
    ];
  }
}