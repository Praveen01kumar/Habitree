import { Injectable, signal, effect } from '@angular/core';
import { Task, TaskStatus } from '../types';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tasksKey = 'habitree-tasks';
  private _tasks = signal<Task[]>(this.loadFromLocalStorage());
  
  public readonly tasks$ = this._tasks.asReadonly();

  constructor() {
    effect(() => {
        this.saveToLocalStorage(this._tasks());
    });
  }

  addTask(taskData: Omit<Task, 'id' | 'status' | 'focusTime' | 'pomodoros'>): Task {
    const newTask: Task = {
      id: Date.now(),
      status: 'To Do',
      allDay: true,
      color: '#22c55e', // primary-500
      focusTime: 0,
      pomodoros: 0,
      ...taskData,
    };
    this._tasks.update(tasks => [newTask, ...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    return newTask;
  }

  updateTask(updatedTask: Task): void {
    this._tasks.update(tasks => 
        tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
             .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    );
  }

  deleteTask(id: number): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));
  }

  updateTaskStatus(id: number, status: TaskStatus): void {
    this._tasks.update(tasks => 
        tasks.map(t => t.id === id ? { ...t, status } : t)
    );
  }

  logPomodoroToTask(taskId: number, durationSeconds: number): void {
    this._tasks.update(tasks => {
        return tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    pomodoros: task.pomodoros + 1,
                    focusTime: task.focusTime + Math.round(durationSeconds / 60)
                };
            }
            return task;
        });
    });
  }

  private loadFromLocalStorage(): Task[] {
    try {
      const storedTasks = localStorage.getItem(this.tasksKey);
      return storedTasks ? JSON.parse(storedTasks) : this.getInitialMockData();
    } catch (e) {
      console.error('Error reading tasks from localStorage', e);
      return this.getInitialMockData();
    }
  }

  private saveToLocalStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks to localStorage', e);
    }
  }

  private getInitialMockData(): Task[] {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(today.getDate() + 2);

    const mockTasks: Task[] = [
      { id: 1, title: 'Finalize Q3 report', description: 'Compile all team data and charts for the quarterly report.', dueDate: today.toISOString().split('T')[0], priority: 'High', status: 'In Progress', focusTime: 75, pomodoros: 3, allDay: true, color: '#22c55e' },
      { id: 2, title: 'Design new landing page mockups', description: 'Create at least two different design concepts in Figma.', dueDate: dayAfter.toISOString().split('T')[0], priority: 'Medium', status: 'To Do', focusTime: 0, pomodoros: 0, allDay: true, color: '#22c55e' },
      { id: 3, title: 'Book flight tickets for conference', description: 'Check for best deals and book round-trip tickets.', dueDate: tomorrow.toISOString().split('T')[0], priority: 'Low', status: 'To Do', focusTime: 0, pomodoros: 0, allDay: true, color: '#22c55e' },
      { id: 4, title: 'Review user feedback from last sprint', description: '', dueDate: today.toISOString().split('T')[0], priority: 'Medium', status: 'Done', focusTime: 50, pomodoros: 2, allDay: true, color: '#22c55e' },
    ];
    
    return mockTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
}