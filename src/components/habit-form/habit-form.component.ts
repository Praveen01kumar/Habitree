
import { Component, ChangeDetectionStrategy, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Habit, HabitCategory } from '../../types';
import { HABIT_CATEGORIES } from '../../services/habit.service';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="close.emit()"></div>
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <header class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {{ habit() ? 'Edit Habit' : 'New Habit' }}
          </h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i class="fas fa-times fa-lg"></i>
          </button>
        </header>

        <form [formGroup]="habitForm" (ngSubmit)="onSubmit()">
          <!-- Title -->
          <div class="mb-4">
            <label for="title" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Habit Title</label>
            <input 
              type="text" 
              id="title" 
              formControlName="title" 
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Read for 15 minutes">
            @if (habitForm.get('title')?.invalid && habitForm.get('title')?.touched) {
              <p class="text-red-500 text-xs mt-1">A title is required for your new habit.</p>
            }
          </div>
          
          <!-- Description -->
          <div class="mb-4">
            <label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Motivation</label>
            <textarea 
              id="description" 
              formControlName="description" 
              rows="3"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Why is this habit important to you?"></textarea>
          </div>

          <!-- Category -->
          <div class="mb-6">
            <label for="category" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select id="category" formControlName="category" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              @for (category of categories; track category) {
                <option [value]="category">{{ category }}</option>
              }
            </select>
          </div>
          
          <footer class="flex justify-end space-x-4 mt-8">
            <button type="button" (click)="close.emit()" class="px-6 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
              Cancel
            </button>
            <button type="submit" [disabled]="habitForm.invalid" class="px-6 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
              Save Habit
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitFormComponent implements OnInit {
  habit = input<Habit | null>(null);
  close = output<void>();
  save = output<Pick<Habit, 'title' | 'description' | 'category'> | Habit>();

  habitForm: FormGroup;
  categories = Object.keys(HABIT_CATEGORIES) as HabitCategory[];

  constructor(private fb: FormBuilder) {
    this.habitForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      category: ['Health' as HabitCategory, Validators.required],
    });
  }

  ngOnInit(): void {
    const currentHabit = this.habit();
    if (currentHabit) {
      this.habitForm.patchValue(currentHabit);
    }
  }

  onSubmit(): void {
    if (this.habitForm.invalid) {
      return;
    }

    const currentHabit = this.habit();
    if (currentHabit) {
      this.save.emit({
        ...currentHabit,
        ...this.habitForm.value
      });
    } else {
      this.save.emit(this.habitForm.value);
    }
  }
}
      