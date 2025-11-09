
export interface JournalEntry {
  id: number;
  date: string;
  content: string;
  mood?: string;
  insights?: string[];
}

export interface MoodAnalysis {
  mood: string;
  insights: string[];
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  focusTime: number; // in minutes
  pomodoros: number;
  allDay?: boolean;
  color?: string;
}

export type PomodoroMode = 'Pomodoro' | 'Short Break' | 'Long Break';

export interface PomodoroSettings {
  'Pomodoro': number; // duration in seconds
  'Short Break': number;
  'Long Break': number;
  pomodorosPerLongBreak: number;
  autoStartNext: boolean;
}

export interface PomodoroStats {
  sessionsCompletedToday: number;
  lastSessionDate: string;
  focusStreak: number;
}

export interface PomodoroSession {
  date: string; // ISO string
  taskId?: number;
  interruptions: number;
  duration: number; // in seconds
}

export type HabitFrequency = 'Daily';
export type HabitCategory = 'Health' | 'Productivity' | 'Learning' | 'Personal' | 'Finance';

export interface Habit {
  id: number;
  title: string;
  description: string;
  category: HabitCategory;
  color: string;
  frequency: HabitFrequency;
  createdAt: string; // ISO string
  completions: { [date: string]: boolean }; // date as 'YYYY-MM-DD'
  currentStreak: number;
  longestStreak: number;
}

// Analytics Dashboard Types
export type DateRange = 'daily' | 'weekly' | 'monthly';

export interface TimeEntry {
  date: string;
  completed: number;
  created: number;
  planned: number;
  reactive: number;
}

export interface MoodEntry {
  date: string;
  moodScore: number; // e.g., 1-5
  productivityScore: number; // 0-100
}

export interface HeatmapData {
  day: string; // 'Mon', 'Tue', etc.
  hour: number; // 0-23
  value: number; // intensity
}

export interface AnalyticsData {
  timeSeries: TimeEntry[];
  // Habits are now sourced directly from HabitService
  moodProductivity: MoodEntry[];
  focusHeatmap: HeatmapData[];
}