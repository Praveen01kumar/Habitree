
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { HabitFormComponent } from '../habit-form/habit-form.component';
import { Habit } from '../../types';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [CommonModule, HabitFormComponent],
  template: `
    <div class="p-4 sm:p-8 max-w-7xl mx-auto">
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100">Habit Forest</h1>
        <button (click)="openHabitForm()" class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
          <i class="fas fa-plus mr-2"></i>
          New Habit
        </button>
      </header>

      <main>
        @if (habits().length === 0) {
          <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400 text-lg">Your forest is empty.</p>
            <p class="text-slate-500 dark:text-slate-400 mt-2">Click "New Habit" to plant your first seed!</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (habit of habits(); track habit.id) {
              <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 flex flex-col">
                <!-- Card Header -->
                <header class="flex justify-between items-start mb-4">
                  <div>
                    <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2" [style.background-color]="habit.color+'30'" [style.color]="habit.color">
                      {{ habit.category }}
                    </span>
                    <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">{{ habit.title }}</h2>
                  </div>
                  <div class="flex space-x-2">
                    <button (click)="openHabitForm(habit)" class="text-slate-400 hover:text-primary-500 dark:hover:text-primary-400" title="Edit Habit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button (click)="deleteHabit(habit.id)" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400" title="Delete Habit">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </header>
                
                <!-- Main Content -->
                <div class="flex-grow flex items-center gap-6 my-4">
                  <!-- Tree Visualization -->
                  <div class="text-center w-24 flex-shrink-0">
                    @let tree = getTreeStage(habit);
                    <i class="fas {{ tree.icon }} {{ tree.size }} {{ tree.color }} transition-all duration-500"></i>
                  </div>
                  
                  <!-- Stats and Description -->
                  <div class="flex-grow">
                    @if(habit.description) {
                      <p class="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">{{ habit.description }}</p>
                    }
                     <!-- Stats -->
                    <div class="flex items-center justify-around text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <span class="font-bold text-lg text-orange-500">🔥 {{ habit.currentStreak }}</span>
                        <span class="text-sm block text-slate-500 dark:text-slate-400">Current</span>
                      </div>
                      <div>
                        <span class="font-bold text-lg">{{ habit.longestStreak }}</span>
                        <span class="text-sm block text-slate-500 dark:text-slate-400">Longest</span>
                      </div>
                    </div>
                  </div>
                </div>


                <!-- Action Button -->
                <div class="mt-auto">
                    <button (click)="habitService.toggleHabitCompletionForToday(habit.id)" 
                        class="w-full py-2 font-semibold rounded-lg transition-colors"
                        [class.text-white]="isHabitCompletedToday(habit.id)"
                        [class.bg-slate-200]="!isHabitCompletedToday(habit.id)"
                        [class.dark:bg-slate-700]="!isHabitCompletedToday(habit.id)"
                        [style.background-color]="isHabitCompletedToday(habit.id) ? habit.color : ''"
                        >
                        {{ isHabitCompletedToday(habit.id) ? 'Completed Today!' : 'Mark as Done' }}
                    </button>
                </div>
              </div>
            }
          </div>
        }
      </main>

      @if (isHabitFormOpen()) {
        <app-habit-form [habit]="selectedHabit()" (close)="closeHabitForm()" (save)="saveHabit($event)" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsComponent {
  habitService = inject(HabitService);

  isHabitFormOpen = signal(false);
  selectedHabit = signal<Habit | null>(null);
  habits = this.habitService.habits$;
  
  getTreeStage(habit: Habit): { icon: string; color: string; size: string } {
    const streak = habit.currentStreak;
    if (streak < 3) {
      return { icon: 'fa-seedling', color: 'text-green-400', size: 'text-4xl' };
    }
    if (streak < 7) {
      return { icon: 'fa-leaf', color: 'text-green-500', size: 'text-5xl' };
    }
    if (streak < 14) {
      return { icon: 'fa-tree', color: 'text-green-600', size: 'text-6xl' };
    }
    return { icon: 'fa-tree', color: 'text-green-700', size: 'text-7xl' };
  }


  isHabitCompletedToday(habitId: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const habit = this.habits().find(h => h.id === habitId);
    return habit?.completions[today] ?? false;
  }

  openHabitForm(habit: Habit | null = null): void {
    this.selectedHabit.set(habit);
    this.isHabitFormOpen.set(true);
  }

  closeHabitForm(): void {
    this.isHabitFormOpen.set(false);
    this.selectedHabit.set(null);
  }

  saveHabit(habitData: Pick<Habit, 'title' | 'description' | 'category'> | Habit): void {
    if ('id' in habitData) {
      this.habitService.updateHabit(habitData);
    } else {
      this.habitService.addHabit(habitData);
    }
    this.closeHabitForm();
  }

  deleteHabit(id: number): void {
    if (confirm('Are you sure you want to delete this habit? This cannot be undone.')) {
      this.habitService.deleteHabit(id);
    }
  }
}
