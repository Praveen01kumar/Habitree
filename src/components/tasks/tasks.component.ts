import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskFormComponent],
  template: `
    <div class="p-4 sm:p-8 max-w-7xl mx-auto">
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100">Task Board</h1>
        <button (click)="openTaskForm()" class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
          <i class="fas fa-plus mr-2"></i>
          New Task
        </button>
      </header>

      <main class="grid grid-cols-1 md:grid-cols-3 gap-6" cdkDropListGroup>
        <!-- To Do Column -->
        <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
          <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b-2 border-red-400 pb-2">To Do ({{ todoTasks().length }})</h2>
          <div cdkDropList id="todo" [cdkDropListData]="todoTasks()" (cdkDropListDropped)="drop($event)" class="space-y-4 min-h-[200px]">
            @for (task of todoTasks(); track task.id) {
              <div cdkDrag [cdkDragData]="task" class="bg-white dark:bg-slate-700 rounded-lg shadow-md p-4 cursor-grab active:cursor-grabbing">
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">{{ task.title }}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 my-2">{{ task.description }}</p>
                <div class="flex justify-between items-center mt-3 text-sm">
                  <span [class]="getPriorityClass(task.priority)">
                    <i class="mr-1.5" [class]="getPriorityIcon(task.priority)"></i>{{ task.priority }}
                  </span>
                  <span class="text-slate-500 dark:text-slate-400"><i class="far fa-calendar-alt mr-1"></i>{{ task.dueDate | date:'MMM d' }}</span>
                </div>
                @if(task.pomodoros > 0) {
                    <div class="flex justify-start items-center space-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><i class="fas fa-stopwatch mr-1"></i>{{ task.pomodoros }} session{{ task.pomodoros > 1 ? 's' : '' }}</span>
                        <span><i class="fas fa-clock mr-1"></i>{{ task.focusTime }} min</span>
                    </div>
                }
                 <div class="flex justify-end space-x-2 mt-3 -mb-2">
                    <button (click)="openTaskForm(task)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i class="fas fa-edit"></i></button>
                    <button (click)="deleteTask(task.id)" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
          <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b-2 border-yellow-400 pb-2">In Progress ({{ inProgressTasks().length }})</h2>
          <div cdkDropList id="inprogress" [cdkDropListData]="inProgressTasks()" (cdkDropListDropped)="drop($event)" class="space-y-4 min-h-[200px]">
             @for (task of inProgressTasks(); track task.id) {
              <div cdkDrag [cdkDragData]="task" class="bg-white dark:bg-slate-700 rounded-lg shadow-md p-4 cursor-grab active:cursor-grabbing">
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">{{ task.title }}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 my-2">{{ task.description }}</p>
                <div class="flex justify-between items-center mt-3 text-sm">
                   <span [class]="getPriorityClass(task.priority)">
                    <i class="mr-1.5" [class]="getPriorityIcon(task.priority)"></i>{{ task.priority }}
                  </span>
                  <span class="text-slate-500 dark:text-slate-400"><i class="far fa-calendar-alt mr-1"></i>{{ task.dueDate | date:'MMM d' }}</span>
                </div>
                 @if(task.pomodoros > 0) {
                    <div class="flex justify-start items-center space-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><i class="fas fa-stopwatch mr-1"></i>{{ task.pomodoros }} session{{ task.pomodoros > 1 ? 's' : '' }}</span>
                        <span><i class="fas fa-clock mr-1"></i>{{ task.focusTime }} min</span>
                    </div>
                }
                 <div class="flex justify-end space-x-2 mt-3 -mb-2">
                    <button (click)="openTaskForm(task)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i class="fas fa-edit"></i></button>
                    <button (click)="deleteTask(task.id)" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            }
          </div>
        </div>
        
        <!-- Done Column -->
        <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
          <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b-2 border-green-400 pb-2">Done ({{ doneTasks().length }})</h2>
          <div cdkDropList id="done" [cdkDropListData]="doneTasks()" (cdkDropListDropped)="drop($event)" class="space-y-4 min-h-[200px]">
             @for (task of doneTasks(); track task.id) {
              <div cdkDrag [cdkDragData]="task" class="bg-white dark:bg-slate-700 rounded-lg shadow-md p-4 cursor-grab active:cursor-grabbing">
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">{{ task.title }}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 my-2">{{ task.description }}</p>
                <div class="flex justify-between items-center mt-3 text-sm">
                   <span [class]="getPriorityClass(task.priority)">
                    <i class="mr-1.5" [class]="getPriorityIcon(task.priority)"></i>{{ task.priority }}
                  </span>
                  <span class="text-slate-500 dark:text-slate-400"><i class="far fa-calendar-alt mr-1"></i>{{ task.dueDate | date:'MMM d' }}</span>
                </div>
                 @if(task.pomodoros > 0) {
                    <div class="flex justify-start items-center space-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><i class="fas fa-stopwatch mr-1"></i>{{ task.pomodoros }} session{{ task.pomodoros > 1 ? 's' : '' }}</span>
                        <span><i class="fas fa-clock mr-1"></i>{{ task.focusTime }} min</span>
                    </div>
                }
                 <div class="flex justify-end space-x-2 mt-3 -mb-2">
                    <button (click)="openTaskForm(task)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i class="fas fa-edit"></i></button>
                    <button (click)="deleteTask(task.id)" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            }
          </div>
        </div>
      </main>

      @if (isTaskFormOpen()) {
        <app-task-form 
          [task]="selectedTask()"
          (close)="closeTaskForm()"
          (save)="saveTask($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent {
  private taskService = inject(TaskService);

  isTaskFormOpen = signal(false);
  selectedTask = signal<Task | null>(null);
  
  tasks = this.taskService.tasks$;
  
  todoTasks = computed(() => this.tasks().filter(t => t.status === 'To Do'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'In Progress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'Done'));

  openTaskForm(task: Task | null = null): void {
    this.selectedTask.set(task);
    this.isTaskFormOpen.set(true);
  }

  closeTaskForm(): void {
    this.isTaskFormOpen.set(false);
    this.selectedTask.set(null);
  }

  saveTask(taskData: Omit<Task, 'id' | 'status' | 'focusTime' | 'pomodoros'> | Task): void {
    if ('id' in taskData) {
      this.taskService.updateTask(taskData);
    } else {
      this.taskService.addTask(taskData);
    }
    this.closeTaskForm();
  }

  deleteTask(id: number): void {
      if (confirm('Are you sure you want to delete this task?')) {
          this.taskService.deleteTask(id);
      }
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same list is not implemented.
      return; 
    }
    
    const task = event.item.data as Task;
    const newStatus = this.getStatusFromContainerId(event.container.id);
    if (task.status !== newStatus) {
      this.taskService.updateTaskStatus(task.id, newStatus);
    }
  }
  
  private getStatusFromContainerId(containerId: string): TaskStatus {
    switch(containerId) {
      case 'inprogress': return 'In Progress';
      case 'done': return 'Done';
      default: return 'To Do';
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (priority) {
      case 'High': return `${base} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'Medium': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'Low': return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    }
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case 'High': return 'fas fa-exclamation-circle';
      case 'Medium': return 'fas fa-minus-circle';
      case 'Low': return 'fas fa-check-circle';
    }
  }
}
