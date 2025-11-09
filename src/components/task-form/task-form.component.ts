import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Task, TaskPriority } from '../../types';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="close.emit()"></div>
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <header class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {{ task() ? 'Edit Task' : 'New Task' }}
          </h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i class="fas fa-times fa-lg"></i>
          </button>
        </header>

        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
          <!-- Title -->
          <div class="mb-4">
            <label for="title" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input type="text" id="title" formControlName="title" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
              <p class="text-red-500 text-xs mt-1">Title is required.</p>
            }
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea id="description" formControlName="description" rows="4" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <!-- Priority -->
            <div>
              <label for="priority" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select id="priority" formControlName="priority" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                @for (priority of priorities; track priority) {
                  <option [value]="priority">{{ priority }}</option>
                }
              </select>
            </div>
            
            <!-- Due Date -->
            <div>
              <label for="dueDate" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input type="date" id="dueDate" formControlName="dueDate" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
               @if (taskForm.get('dueDate')?.invalid && taskForm.get('dueDate')?.touched) {
                <p class="text-red-500 text-xs mt-1">Due date is required.</p>
              }
            </div>
          </div>
          
          <!-- Actions -->
          <footer class="flex justify-end space-x-4">
            <button type="button" (click)="close.emit()" class="px-6 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
              Cancel
            </button>
            <button type="submit" [disabled]="taskForm.invalid" class="px-6 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
              Save Task
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  task = input<Task | null>(null);
  defaultDueDate = input<string | undefined>(undefined);
  close = output<void>();
  save = output<Omit<Task, 'id' | 'status'> | Task>();

  private fb = inject(FormBuilder);
  taskForm!: FormGroup;

  priorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      priority: ['Medium' as TaskPriority, Validators.required],
      dueDate: [this.defaultDueDate() ?? today, Validators.required],
    });

    const currentTask = this.task();
    if (currentTask) {
      this.taskForm.patchValue(currentTask);
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    const currentTask = this.task();
    if (currentTask) {
      // Editing existing task
      this.save.emit({
        ...currentTask,
        ...this.taskForm.value
      });
    } else {
      // Creating new task
      this.save.emit(this.taskForm.value);
    }
  }
}