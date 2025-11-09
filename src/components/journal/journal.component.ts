import { Component, OnInit, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalService } from '../../services/journal.service';
import { GeminiService } from '../../services/gemini.service';
import { JournalEntry } from '../../types';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-4 sm:p-8">
      <header class="mb-4">
        <button (click)="goBack()" class="text-blue-500 hover:underline mb-4">&larr; Back to Journal</button>
        <h1 class="text-4xl font-bold text-gray-800">{{ isNewEntry() ? 'New Journal Entry' : 'Edit Journal Entry' }}</h1>
        @if (!isNewEntry() && entry()) {
          
          <p class="text-gray-500 mt-2">{{ entry()!.date | date:'fullDate' }}</p>
        }
      </header>

      @if (isNewEntry() && reflectionPrompt()) {
        <div class="mb-6 p-4 bg-primary-50 dark:bg-slate-800 rounded-lg border border-primary-200 dark:border-slate-700">
          <div class="flex justify-between items-center">
             <p class="text-slate-600 dark:text-slate-300 italic">{{ reflectionPrompt() }}</p>
             <button (click)="setRandomPrompt()" title="Get another prompt" class="text-primary-600 hover:text-primary-800 transition-colors">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      }
      
      <main>
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <label for="journal-content" class="block text-lg font-medium text-gray-700">How was your day?</label>
            <button 
              (click)="toggleRecording()" 
              [disabled]="!speechSupported"
              title="Record from microphone" 
              class="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed" 
              [class.bg-red-500]="isRecording()" 
              [class.text-white]="isRecording()" 
              [class.bg-slate-200]="!isRecording()" 
              [class.dark:bg-slate-700]="!isRecording()">
              <i class="fas fa-microphone"></i>
            </button>
          </div>
          <textarea 
            id="journal-content"
            [(ngModel)]="content"
            [disabled]="isLoading()"
            class="w-full h-64 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Write about your day..."></textarea>
           @if (recognitionError()) {
            <p class="text-red-500 text-xs mt-1">{{ recognitionError() }}</p>
           }
        </div>

         <div class="mb-6">
          <label class="block text-lg font-medium text-gray-700 mb-2">How are you feeling?</label>
          <div class="flex flex-wrap gap-2">
            @for (mood of moods; track mood.name) {
              <button 
                (click)="selectMood(mood.name)" 
                [class.ring-2]="selectedMood() === mood.name" 
                [class.ring-offset-2]="selectedMood() === mood.name" 
                [class.dark:ring-offset-slate-900]="selectedMood() === mood.name"
                class="px-4 py-2 text-2xl rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ring-primary-500"
                [title]="mood.name">
                {{ mood.emoji }}
              </button>
            }
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row justify-end mt-4 space-y-2 sm:space-y-0 sm:space-x-4">
          <button 
            (click)="analyzeEntry()" 
            [disabled]="isLoading() || content.trim().length === 0"
            class="w-full sm:w-auto flex justify-center items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            @if (isLoading()) {
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            } @else {
              <i class="fas fa-magic-wand-sparkles mr-2"></i>
              <span>Analyze Mood & Insights</span>
            }
          </button>
          <button 
            (click)="saveEntry()" 
            [disabled]="isLoading() || content.trim().length === 0"
            class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            <i class="fas fa-save mr-2"></i>
            Save Entry
          </button>
        </div>

        @if (isLoading()) {
          <div class="mt-8 p-6 bg-gray-50 rounded-lg text-center">
            <p class="text-gray-600 animate-pulse">Analyzing your entry with Gemini...</p>
          </div>
        }

        @if (entry()?.insights) {
          <section class="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">AI Insights</h2>
             @if (entry()?.mood && !selectedMood()) {
                <div class="mb-4">
                    <h3 class="font-bold text-lg text-gray-600">AI Detected Mood:</h3>
                    <p class="text-gray-800 text-xl ml-4">{{ entry()?.mood }}</p>
                </div>
             }
            @if (entry()?.insights && entry()!.insights!.length > 0) {
              <div>
                <ul class="list-disc list-inside ml-4 space-y-2 text-gray-800">
                  @for (insight of entry()!.insights; track $index) {
                    <li>{{ insight }}</li>
                  }
                </ul>
              </div>
            }
          </section>
        }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private journalService = inject(JournalService);
  private geminiService = inject(GeminiService);

  entry = signal<JournalEntry | undefined>(undefined);
  isNewEntry = signal(false);
  content: string = '';
  isLoading = signal(false);

  // New features state
  isRecording = signal(false);
  recognitionError = signal<string | null>(null);
  reflectionPrompt = signal<string>('');
  selectedMood = signal<string | undefined>(undefined);
  speechSupported = false;
  private recognition: any;

  readonly moods = [
    { emoji: '😊', name: 'Happy' }, { emoji: '😌', name: 'Calm' },
    { emoji: '😐', name: 'Neutral' }, { emoji: '😔', name: 'Sad' },
    { emoji: '😠', name: 'Angry' }, { emoji: '😥', name: 'Anxious' },
    { emoji: '🤩', name: 'Excited' }, { emoji: '😴', name: 'Tired' },
  ];

  readonly prompts = [
    "What was the best part of your day?", "What is one thing you learned today?",
    "What are you grateful for today?", "What challenged you today and how did you handle it?",
    "How did you take a step towards a long-term goal today?", "What's one thing you could do differently tomorrow?"
  ];

  constructor() {
    this.initializeSpeechRecognition();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isNewEntry.set(false);
      const entry = this.journalService.getEntry(+idParam);
      if (entry) {
        this.entry.set(entry);
        this.content = entry.content;
        this.selectedMood.set(entry.mood);
      } else {
        this.router.navigate(['/journal']);
      }
    } else {
      this.isNewEntry.set(true);
      this.setRandomPrompt();
    }
  }
  
  ngOnDestroy(): void {
    this.stopRecording();
  }

  async analyzeEntry(): Promise<void> {
    if (this.content.trim().length === 0) return;

    this.isLoading.set(true);
    try {
      const analysis = await this.geminiService.analyzeJournalEntry(this.content);
      const currentEntry = this.entry();
      if (currentEntry) {
        this.entry.update(e => e ? { ...e, ...analysis, content: this.content } : undefined);
      } else {
        this.entry.set({ id: 0, date: new Date().toISOString(), content: this.content, ...analysis });
      }
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  saveEntry(): void {
    if (this.content.trim().length === 0) return;
    
    const moodToSave = this.selectedMood() ?? this.entry()?.mood;
    const insightsToSave = this.entry()?.insights;

    if (this.isNewEntry()) {
        this.journalService.addEntry(this.content, moodToSave, insightsToSave);
    } else {
        const currentEntry = this.entry();
        if (currentEntry) {
            const updatedEntry: JournalEntry = { 
              ...currentEntry, 
              content: this.content, 
              mood: moodToSave,
              insights: insightsToSave ?? currentEntry.insights
            };
            this.journalService.updateEntry(updatedEntry);
        }
    }
    this.router.navigate(['/journal']);
  }

  goBack(): void {
    this.router.navigate(['/journal']);
  }
  
  setRandomPrompt(): void {
    const randomIndex = Math.floor(Math.random() * this.prompts.length);
    this.reflectionPrompt.set(this.prompts[randomIndex]);
  }

  selectMood(moodName: string): void {
    this.selectedMood.set(this.selectedMood() === moodName ? undefined : moodName);
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.content += transcript + ' ';
      };
      this.recognition.onerror = (event: any) => {
        this.recognitionError.set(`Speech recognition error: ${event.error}`);
        this.stopRecording();
      };
      this.recognition.onend = () => {
        if (this.isRecording()) {
          this.recognition.start(); // Restart if it stops automatically
        }
      };
    } else {
      this.speechSupported = false;
      this.recognitionError.set('Speech recognition is not supported in this browser.');
    }
  }

  toggleRecording(): void {
    if (!this.speechSupported) return;
    this.isRecording() ? this.stopRecording() : this.startRecording();
  }

  private startRecording(): void {
    this.isRecording.set(true);
    this.recognitionError.set(null);
    this.recognition.start();
  }

  private stopRecording(): void {
    this.isRecording.set(false);
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
