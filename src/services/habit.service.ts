
import { Injectable, signal, effect } from '@angular/core';
import { Habit, HabitCategory } from '../types';

export const HABIT_CATEGORIES: { [key in HabitCategory]: string } = {
  Health: '#22c55e',       // green-500
  Productivity: '#3b82f6', // blue-500
  Learning: '#a855f7',     // purple-500
  Personal: '#f97316',     // orange-500
  Finance: '#eab308',      // yellow-500
};

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private readonly habitsKey = 'habitree-habits';
  private _habits = signal<Habit[]>(this.loadFromLocalStorage());

  public readonly habits$ = this._habits.asReadonly();

  constructor() {
    effect(() => {
      this.saveToLocalStorage(this._habits());
    });
    this.updateStreaksOnLoad();
  }

  addHabit(data: Pick<Habit, 'title' | 'description' | 'category'>): Habit {
    const newHabit: Habit = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      category: data.category,
      color: HABIT_CATEGORIES[data.category],
      frequency: 'Daily',
      createdAt: new Date().toISOString(),
      completions: {},
      currentStreak: 0,
      longestStreak: 0,
    };
    this._habits.update(habits => [newHabit, ...habits]);
    return newHabit;
  }

  updateHabit(updatedHabit: Habit): void {
    const color = HABIT_CATEGORIES[updatedHabit.category] || '#64748b';
    this._habits.update(habits =>
      habits.map(h => h.id === updatedHabit.id ? { ...updatedHabit, color } : h)
    );
  }

  deleteHabit(id: number): void {
    this._habits.update(habits => habits.filter(h => h.id !== id));
  }

  toggleHabitCompletionForToday(habitId: number): void {
    const today = new Date().toISOString().split('T')[0];
    this._habits.update(habits => {
      const habitIndex = habits.findIndex(h => h.id === habitId);
      if (habitIndex === -1) return habits;

      const newHabits = [...habits];
      const habitToUpdate = { ...newHabits[habitIndex] };
      habitToUpdate.completions = { ...habitToUpdate.completions };

      habitToUpdate.completions[today] = !habitToUpdate.completions[today];

      newHabits[habitIndex] = this.recalculateStreaks(habitToUpdate);
      return newHabits;
    });
  }
  
  private updateStreaksOnLoad(): void {
    this._habits.update(habits => 
        habits.map(habit => this.recalculateStreaks(habit))
    );
  }

  private recalculateStreaks(habit: Habit): Habit {
    const completedDates = Object.keys(habit.completions)
      .filter(date => habit.completions[date])
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (completedDates.length === 0) {
      return { ...habit, currentStreak: 0 };
    }

    let longestStreak = 0;
    if (completedDates.length > 0) {
      longestStreak = 1;
      let currentSegmentStreak = 1;
      for (let i = 1; i < completedDates.length; i++) {
        const currentDate = new Date(completedDates[i]);
        const previousDate = new Date(completedDates[i - 1]);
        currentDate.setHours(12, 0, 0, 0);
        previousDate.setHours(12, 0, 0, 0);

        const diffDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 3600 * 24);

        if (diffDays === 1) {
          currentSegmentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentSegmentStreak);
          currentSegmentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentSegmentStreak);
    }
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(12,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (habit.completions[todayStr] || habit.completions[yesterdayStr]) {
      let checkDate = new Date(today);
      if (!habit.completions[todayStr]) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      while (habit.completions[checkDate.toISOString().split('T')[0]]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    return { 
      ...habit, 
      currentStreak, 
      longestStreak: Math.max(habit.longestStreak, longestStreak) 
    };
  }

  private loadFromLocalStorage(): Habit[] {
    try {
      const stored = localStorage.getItem(this.habitsKey);
      return stored ? JSON.parse(stored) : this.getInitialMockData();
    } catch (e) {
      console.error('Error reading habits from localStorage', e);
      return this.getInitialMockData();
    }
  }

  private saveToLocalStorage(habits: Habit[]): void {
    try {
      localStorage.setItem(this.habitsKey, JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits to localStorage', e);
    }
  }

  private getInitialMockData(): Habit[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return [
      {
        id: 1,
        title: 'Read for 15 minutes',
        description: 'Read a book from my list to expand my knowledge.',
        category: 'Learning',
        color: HABIT_CATEGORIES['Learning'],
        frequency: 'Daily',
        createdAt: new Date().toISOString(),
        completions: {
          [threeDaysAgo.toISOString().split('T')[0]]: true,
          [twoDaysAgo.toISOString().split('T')[0]]: true,
          [yesterday.toISOString().split('T')[0]]: true,
        },
        currentStreak: 0,
        longestStreak: 0,
      },
      {
        id: 2,
        title: 'Morning walk',
        description: 'A 20-minute walk outside to start the day.',
        category: 'Health',
        color: HABIT_CATEGORIES['Health'],
        frequency: 'Daily',
        createdAt: new Date().toISOString(),
        completions: {},
        currentStreak: 0,
        longestStreak: 0,
      },
       {
        id: 3,
        title: 'Plan the next day',
        description: 'Spend 10 minutes before bed to outline tasks for tomorrow.',
        category: 'Productivity',
        color: HABIT_CATEGORIES['Productivity'],
        frequency: 'Daily',
        createdAt: new Date().toISOString(),
        completions: {
            [yesterday.toISOString().split('T')[0]]: true,
        },
        currentStreak: 0,
        longestStreak: 0,
      }
    ];
  }
}