import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { HabitService } from '../../services/habit.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Task, Habit } from '../../types';
// FIX: Use modular imports for date-fns to resolve export errors.
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import { TaskFormComponent } from '../task-form/task-form.component';

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  completedHabits: Habit[];
  productivityScore?: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskFormComponent],
  template: `
    <div class="p-4 sm:p-6 h-full flex flex-col xl:flex-row gap-6">
      <!-- Left Sidebar -->
      <aside class="w-full xl:w-80 flex-shrink-0 space-y-6">
        <!-- Controls -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
              {{ activeDate() | date:'MMMM yyyy' }}
            </h2>
            <div class="flex items-center space-x-1">
              <button (click)="changeMonth(-1)" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Previous month">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button (click)="goToToday()" class="px-3 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Today
              </button>
              <button (click)="changeMonth(1)" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Next month">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Selected Day Details -->
        @if (selectedDay(); as day) {
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100">{{ day.date | date:'fullDate' }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 h-5">
              @if (day.isToday) {
                <span class="font-semibold text-primary-600 dark:text-primary-400">Today</span>
              }
              @if (day.productivityScore) {
                <span>
                  @if (day.isToday) { &middot; }
                  Productivity: {{ day.productivityScore }}%
                </span>
              }
            </p>
            <button (click)="openTaskForm()" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mb-4 text-sm">
              <i class="fas fa-plus mr-2"></i> Add Task for this day
            </button>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              @if (filters().tasks) {
                @for (task of day.tasks; track task.id) {
                  <div class="flex items-center justify-between group p-2 rounded-md" [style.background-color]="task.color + '20'">
                    <p class="text-sm truncate text-slate-700 dark:text-slate-200" [title]="task.title">{{ task.title }}</p>
                    <button (click)="openTaskForm(task)" class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-800 dark:hover:text-slate-100">
                      <i class="fas fa-edit text-xs"></i>
                    </button>
                  </div>
                }
              }
              @if (filters().habits) {
                @for (habit of day.completedHabits; track habit.id) {
                  <div class="flex items-center p-2 rounded-md bg-green-500/20">
                    <i class="fas fa-check-circle text-green-600 dark:text-green-400 mr-2"></i>
                    <p class="text-sm truncate text-slate-700 dark:text-slate-200" [title]="habit.title">{{ habit.title }}</p>
                  </div>
                }
              }
              @if ((!filters().tasks || day.tasks.length === 0) && (!filters().habits || day.completedHabits.length === 0)) {
                 <p class="text-slate-400 text-center text-sm py-4">No events scheduled.</p>
              }
            </div>
          </div>
        }

        <!-- Collapsible Sections -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md">
           <button (click)="toggleSidebarSection('filters')" class="w-full flex justify-between items-center p-4 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-t-lg">
             <span>Filters</span>
             <i class="fas transition-transform" [class.fa-chevron-down]="!sidebarSections().filters" [class.fa-chevron-up]="sidebarSections().filters"></i>
           </button>
           @if (sidebarSections().filters) {
             <div class="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
               <label class="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" class="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" [checked]="filters().tasks" (change)="toggleFilter('tasks')">
                 <span class="text-slate-600 dark:text-slate-300">Tasks</span>
               </label>
               <label class="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" class="h-4 w-4 rounded text-green-500 focus:ring-green-400" [checked]="filters().habits" (change)="toggleFilter('habits')">
                 <span class="text-slate-600 dark:text-slate-300">Habits</span>
               </label>
             </div>
           }
        </div>
        
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md">
           <button (click)="toggleSidebarSection('insights')" class="w-full flex justify-between items-center p-4 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-t-lg">
             <span>AI Insights</span>
             <i class="fas transition-transform" [class.fa-chevron-down]="!sidebarSections().insights" [class.fa-chevron-up]="sidebarSections().insights"></i>
           </button>
           @if (sidebarSections().insights) {
             <div class="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
               @for (insight of aiInsights(); track $index) {
                 <p class="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg text-sm">{{ insight }}</p>
               }
             </div>
           }
        </div>
      </aside>

      <!-- Main Calendar Grid -->
      <main class="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col min-h-[80vh]" cdkDropListGroup>
        <div class="grid grid-cols-7 text-center font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          @for (day of weekDays; track day) {
            <div class="py-3 hidden sm:block">{{ day }}</div>
            <div class="py-3 sm:hidden">{{ day.slice(0, 3) }}</div>
          }
        </div>
        <div class="grid grid-cols-7 grid-rows-6 flex-1">
          @for (day of calendarDays(); track day.date.toISOString()) {
            <div 
              cdkDropList
              [id]="day.dateString"
              [cdkDropListData]="day.tasks"
              (cdkDropListDropped)="drop($event)"
              (click)="selectDay(day)"
              class="relative p-1 sm:p-2 border-t border-r border-slate-200 dark:border-slate-700 flex flex-col cursor-pointer transition-colors duration-200"
              [class.opacity-50]="!day.isCurrentMonth"
              [class.bg-slate-50]="!day.isCurrentMonth && day !== selectedDay()"
              [class.dark:bg-slate-900]="!day.isCurrentMonth && day !== selectedDay()"
              [class.hover:bg-slate-100]="day.isCurrentMonth"
              [class.dark:hover:bg-slate-700/50]="day.isCurrentMonth"
              [class.bg-primary-50]="day === selectedDay()"
              [class.dark:bg-primary-900/20]="day === selectedDay()"
              [style.background-color]="day !== selectedDay() ? getHeatmapColor(day.productivityScore) : ''"
              >
              <span class="font-medium mb-1 self-start sm:self-end text-sm w-7 h-7 flex items-center justify-center rounded-full"
                [class.ring-2]="day.isToday"
                [class.ring-primary-500]="day.isToday"
                [class.text-primary-600]="day.isToday"
                [class.dark:text-primary-400]="day.isToday"
                [class.font-bold]="day.isToday"
                >
                {{ day.date | date:'d' }}
              </span>
              <div class="flex-1 overflow-y-auto text-xs space-y-1 pr-1 custom-scrollbar">
                @if (filters().tasks) {
                  @for (task of day.tasks; track task.id) {
                    <div cdkDrag [cdkDragData]="task" [title]="task.title" class="p-1.5 rounded text-white cursor-grab active:cursor-grabbing shadow-sm flex items-center" [style.background-color]="task.color || '#0ea5e9'">
                      <i class="fas fa-tasks mr-1.5 text-white/70"></i>
                      <p class="truncate">{{ task.title }}</p>
                    </div>
                  }
                }
                @if (filters().habits) {
                  @for (habit of day.completedHabits; track habit.id) {
                    <div [title]="'Habit: ' + habit.title" class="p-1.5 rounded bg-green-500 text-white shadow-sm flex items-center">
                       <i class="fas fa-check-circle mr-1 text-xs"></i>
                       <p class="truncate">{{ habit.title }}</p>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      </main>

      @if (isTaskFormOpen()) {
        <app-task-form 
          [task]="selectedTask()"
          [defaultDueDate]="selectedTask() ? undefined : selectedDay()?.dateString"
          (close)="closeTaskForm()"
          (save)="saveTask($event)"
        />
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #94a3b8; /* slate-400 */
      border-radius: 4px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #475569; /* slate-600 */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
  private taskService = inject(TaskService);
  private habitService = inject(HabitService);
  private analyticsService = inject(AnalyticsService);
  
  activeDate = signal(new Date());
  weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  filters = signal({ tasks: true, habits: true });

  selectedDay = signal<CalendarDay | null>(null);
  isTaskFormOpen = signal(false);
  selectedTask = signal<Task | null>(null);
  sidebarSections = signal({ filters: true, insights: true });

  private allTasks = this.taskService.tasks$;
  private allHabits = this.habitService.habits$;
  
  aiInsights = computed(() => this.analyticsService.getAIInsights(this.analyticsService.getFilteredData('monthly')));

  calendarDays = computed<CalendarDay[]>(() => {
    const date = this.activeDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const days: CalendarDay[] = [];
    let currentDate = new Date(startDate);
    const today = startOfDay(new Date());

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      days.push({
        date: new Date(currentDate),
        dateString: dateStr,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        tasks: this.allTasks().filter(t => t.dueDate === dateStr),
        completedHabits: this.allHabits().filter(h => h.completions[dateStr]),
        productivityScore: this.analyticsService.getDailyProductivityScore(dateStr)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  });

  constructor() {
    effect(() => {
      const days = this.calendarDays();
      const selected = this.selectedDay();

      if (!selected) {
        this.selectInitialDay(days);
        return;
      }
      
      const stillVisible = days.find(d => d.dateString === selected.dateString);
      if (stillVisible) {
        this.selectedDay.set(stillVisible); // Update with new task/habit data
      } else {
        this.selectedDay.set(days.find(d => d.isCurrentMonth) ?? days[7] ?? null);
      }
    });
  }

  ngOnInit(): void {
    // Effect handles initial selection.
  }

  private selectInitialDay(days: CalendarDay[]): void {
      const todayString = format(new Date(), 'yyyy-MM-dd');
      const todayInView = days.find(d => d.dateString === todayString);
      if (todayInView) {
          this.selectedDay.set(todayInView);
      } else {
          this.selectedDay.set(days.find(d => d.isCurrentMonth) ?? days[7] ?? null);
      }
  }

  changeMonth(delta: number): void {
    this.activeDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + delta, 1);
      return newDate;
    });
  }

  goToToday(): void {
    this.activeDate.set(new Date());
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const todayInView = this.calendarDays().find(d => d.dateString === todayString);
    if(todayInView) {
      this.selectDay(todayInView);
    }
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  toggleFilter(type: 'tasks' | 'habits'): void {
    this.filters.update(f => ({ ...f, [type]: !f[type] }));
  }

  toggleSidebarSection(section: 'filters' | 'insights'): void {
    this.sidebarSections.update(s => ({...s, [section]: !s[section]}));
  }
  
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const task = event.item.data as Task;
    const newDueDate = event.container.id;
    if (task.dueDate !== newDueDate) {
      this.taskService.updateTask({ ...task, dueDate: newDueDate });
    }
  }
  
  getHeatmapColor(score: number | undefined): string {
    if (score === undefined) return '';
    const opacity = score / 250; 
    return `rgba(251, 191, 36, ${opacity})`; // yellow-400
  }

  openTaskForm(task: Task | null = null): void {
    this.selectedTask.set(task);
    this.isTaskFormOpen.set(true);
  }

  closeTaskForm(): void {
    this.isTaskFormOpen.set(false);
    this.selectedTask.set(null);
  }

  saveTask(taskData: Omit<Task, 'id' | 'status'> | Task): void {
    if ('id' in taskData) {
      this.taskService.updateTask(taskData);
    } else {
      this.taskService.addTask(taskData);
    }
    this.closeTaskForm();
  }
}
