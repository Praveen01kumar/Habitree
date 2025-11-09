

import { Injectable, signal, inject, computed } from '@angular/core';
import { AnalyticsData, DateRange, Habit } from '../types';
// FIX: Use modular imports for date-fns to resolve export errors.
import { subDays } from 'date-fns/subDays';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import { HabitService } from './habit.service';
import { PomodoroService } from './pomodoro.service';
import { TaskService } from './task.service';
import { JournalService } from './journal.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private habitService = inject(HabitService);
  private pomodoroService = inject(PomodoroService);
  private taskService = inject(TaskService);
  private journalService = inject(JournalService);
  
  private rawData = signal<Omit<AnalyticsData, 'focusHeatmap'>>(this.generateMockData());

  private fullData = computed(() => {
    return {
      ...this.rawData(),
      habits: this.habitService.habits$(),
      pomodoroSessions: this.pomodoroService.sessions$()
    }
  });

  public getFilteredData(range: DateRange) {
    const data = this.fullData();
    const now = startOfDay(new Date());
    let startDate: Date;

    switch (range) {
      case 'daily':
        startDate = now;
        break;
      case 'weekly':
        startDate = subDays(now, 6);
        break;
      case 'monthly':
        startDate = subDays(now, 29);
        break;
    }

    const filteredTimeSeries = data.timeSeries.filter(d => new Date(d.date) >= startDate);
    const filteredMoodProductivity = data.moodProductivity.filter(d => new Date(d.date) >= startDate);
    const filteredPomodoroSessions = data.pomodoroSessions.filter(s => new Date(s.date) >= startDate);

    return {
        ...data,
        timeSeries: filteredTimeSeries,
        moodProductivity: filteredMoodProductivity,
        pomodoroSessions: filteredPomodoroSessions,
        focusHeatmap: this.generateFocusHeatmap(data.pomodoroSessions) // generate heatmap from all sessions
    };
  }
  
  public getDashboardKpis() {
    return computed(() => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const allTasks = this.taskService.tasks$();
      const allHabits = this.habitService.habits$();
      const pomodoroSessions = this.pomodoroService.sessions$();
      const journalEntries = this.journalService.entries$();
      const dailyAnalytics = this.getFilteredData('daily');

      // 1. Tasks Completed
      const tasksCreatedToday = allTasks.filter(t => format(new Date(t.dueDate), 'yyyy-MM-dd') <= todayStr && t.status !== 'Done').length + allTasks.filter(t => t.status === 'Done' && format(new Date(t.dueDate), 'yyyy-MM-dd') === todayStr).length;
      const tasksCompletedToday = allTasks.filter(t => t.status === 'Done' && format(new Date(t.dueDate), 'yyyy-MM-dd') === todayStr).length;
      const tasksCompletedPercentage = tasksCreatedToday > 0 ? (tasksCompletedToday / tasksCreatedToday) * 100 : 0;

      // 2. Focus Time (in minutes)
      const focusTimeToday = pomodoroSessions
        .filter(s => s.date.startsWith(todayStr))
        .reduce((sum, s) => sum + s.duration, 0) / 60;

      // 3. Reactive Work Ratio
      const dailyTimeSeries = dailyAnalytics.timeSeries.find(ts => ts.date === todayStr);
      const reactiveWorkRatio = (dailyTimeSeries && (dailyTimeSeries.planned + dailyTimeSeries.reactive) > 0)
        ? (dailyTimeSeries.reactive / (dailyTimeSeries.planned + dailyTimeSeries.reactive)) * 100
        : 0;

      // 4. Habit Consistency
      const habitsCompletedToday = allHabits.filter(h => h.completions[todayStr]).length;
      const habitConsistency = allHabits.length > 0 ? (habitsCompletedToday / allHabits.length) * 100 : 100;

      // 5. Mood Index (0-100)
      const moodMap: { [key: string]: number } = {
        'Happy': 5, 'Optimistic': 5, 'Excited': 5,
        'Calm': 4,
        'Neutral': 3,
        'Sad': 2, 'Anxious': 2,
        'Stressed': 1, 'Angry': 1, 'Tired': 1,
      };
      const todaysEntry = journalEntries.find(j => j.date.startsWith(todayStr));
      const moodScore = todaysEntry?.mood ? (moodMap[todaysEntry.mood.trim()] ?? 3) : null;
      const moodIndex = moodScore ? (moodScore / 5) * 100 : 0;

      // 6. Productivity Score
      const productivityScore = this.getDailyProductivityScore(todayStr) ?? 0;

      return {
        tasksCompleted: { value: tasksCompletedToday, percentage: tasksCompletedPercentage },
        focusTime: { value: focusTimeToday },
        reactiveWork: { value: reactiveWorkRatio },
        habitConsistency: { value: habitConsistency },
        moodIndex: { value: moodIndex },
        productivityScore: { value: productivityScore }
      };
    });
  }

  public getDailyProductivityScore(date: string): number | undefined {
    const entry = this.rawData().moodProductivity.find(d => d.date === date);
    return entry?.productivityScore;
  }

  public getAIInsights(data: ReturnType<typeof this.getFilteredData>): string[] {
    const insights: string[] = [];
    const { timeSeries, focusHeatmap, habits } = data;

    if (timeSeries.length > 0) {
      const totalReactive = timeSeries.reduce((acc, curr) => acc + curr.reactive, 0);
      const totalPlanned = timeSeries.reduce((acc, curr) => acc + curr.planned, 0);
      
      if (totalPlanned + totalReactive > 0) {
        const reactivePercentage = (totalReactive / (totalPlanned + totalReactive)) * 100;
        if(reactivePercentage > 30) {
          insights.push(`Your work was ${reactivePercentage.toFixed(0)}% reactive. Try to plan ahead to reduce stress.`);
        } else {
            insights.push(`Great job keeping reactive work low at only ${reactivePercentage.toFixed(0)}%!`);
        }
      }
    }
    
    const morningHours = focusHeatmap.filter(h => h.hour >= 8 && h.hour < 12);
    const afternoonHours = focusHeatmap.filter(h => h.hour >= 13 && h.hour < 17);
    const morningProductivity = morningHours.reduce((acc, curr) => acc + curr.value, 0) / (morningHours.length || 1);
    const afternoonProductivity = afternoonHours.reduce((acc, curr) => acc + curr.value, 0) / (afternoonHours.length || 1);

    if (morningProductivity > afternoonProductivity * 1.2) {
      insights.push("You're most productive in the morning. Capitalize on it for your most important tasks!");
    } else if (afternoonProductivity > morningProductivity * 1.2) {
      insights.push("Your focus peaks in the afternoon. Schedule deep work sessions accordingly.");
    }

    const sortedHabits = [...habits].sort((a,b) => b.currentStreak - a.currentStreak);
    if (sortedHabits.length > 0 && sortedHabits[0].currentStreak > 2) {
        insights.push(`Your '${sortedHabits[0].title}' habit is on a ${sortedHabits[0].currentStreak}-day streak! Keep the momentum going.`);
    }

    if(insights.length === 0) {
        insights.push("Keep logging your activities to unlock more personalized insights about your productivity patterns.")
    }

    return insights;
  }
  
  private generateFocusHeatmap(sessions: ReturnType<typeof this.pomodoroService.sessions$>) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap: { [key: string]: number } = {}; // key: "day-hour"

    for (const session of sessions) {
        const date = new Date(session.date);
        const day = date.getDay(); // 0 = Sun, 1 = Mon, ...
        const hour = date.getHours();
        const key = `${days[day]}-${hour}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
    }
    
    const heatmapData = [];
    for (const day of days) {
        for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            heatmapData.push({ day, hour, value: heatmap[key] || 0 });
        }
    }
    return heatmapData;
  }

  private generateMockData(): Omit<AnalyticsData, 'focusHeatmap'> {
    const timeSeries = [];
    const moodProductivity = [];
    const today = startOfDay(new Date());

    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const completed = Math.floor(Math.random() * 8) + 2;
      const created = completed + Math.floor(Math.random() * 4) - 2;
      const reactive = Math.floor(Math.random() * (completed / 2));
      const planned = completed - reactive;

      timeSeries.push({ date: dateStr, completed, created, planned, reactive });

      moodProductivity.push({
        date: dateStr,
        moodScore: Math.floor(Math.random() * 3) + 3, // 3 to 5
        productivityScore: Math.floor(Math.random() * 40) + 55, // 55 to 95
      });
    }

    return { timeSeries, moodProductivity };
  }
}