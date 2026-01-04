import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  User, 
  ListTodo, 
  Zap, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Award,
  Settings,
  Target
} from 'lucide-react';

/**
 * UTILS & CONSTANTS
 */
const STORAGE_KEY = 'on_track_data_v2';

// --- MODERN & HIGH CONTRAST PALETTE ---
// Background: Stone-50 (#fafaf9) - Easy on eyes
// Surface: White (#ffffff) - Clean cards
// Primary: Emerald-700 (#047857) - AAA Contrast on white
// Text Main: Emerald-950 (#022c22) - Almost black green
// Text Muted: Stone-500 (#78716c) - Readable gray

const INITIAL_DATA = {
  user: {
    name: 'Traveler',
    avatar: '',
    goals: 'Stay consistent and disciplined with the 80% Rule.',
  },
  habits: [
    { id: 'h1', title: 'Morning Prayer', created_at: '2024-01-01' },
    { id: 'h2', title: 'Read 10 Pages', created_at: '2024-01-01' },
    { id: 'h3', title: 'No Sugar', created_at: '2024-01-01' },
  ],
  tasks: [
    { id: 't1', title: 'Complete project report', type: 'daily', date: new Date().toISOString().split('T')[0], completed: false },
  ],
  habitLogs: {}, 
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/**
 * MAIN APP COMPONENT
 */
export default function OnTrackApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const dateKey = formatDate(selectedDate);

  const getDayStats = (targetDateStr) => {
    const activeHabits = data.habits;
    const dailyTasks = data.tasks.filter(t => t.date === targetDateStr);
    const totalItems = activeHabits.length + dailyTasks.length;
    
    if (totalItems === 0) return { score: 0, isStreak: false, completed: 0, total: 0 };

    const completedHabitsCount = data.habitLogs[targetDateStr]?.habitIds?.length || 0;
    const completedTasksCount = dailyTasks.filter(t => t.completed).length;
    const totalCompleted = completedHabitsCount + completedTasksCount;
    const score = totalCompleted / totalItems;
    const isStreak = score >= 0.8; 

    return {
      score,
      percentage: Math.round(score * 100),
      isStreak,
      completed: totalCompleted,
      total: totalItems
    };
  };

  const currentStats = useMemo(() => getDayStats(dateKey), [data, dateKey]);

  const calculateStreak = () => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const tempDate = new Date();
      tempDate.setDate(tempDate.getDate() - i);
      const tempKey = formatDate(tempDate);
      const stats = getDayStats(tempKey);
      
      if (i === 0) {
        if (stats.isStreak) streak++;
      } else {
        if (stats.isStreak) streak++;
        else break;
      }
    }
    return streak;
  };

  const currentStreak = useMemo(() => calculateStreak(), [data]);

  const toggleHabit = (habitId) => {
    setData(prev => {
      const log = prev.habitLogs[dateKey] || { habitIds: [] };
      const isCompleted = log.habitIds.includes(habitId);
      let newIds = isCompleted ? log.habitIds.filter(id => id !== habitId) : [...log.habitIds, habitId];

      return {
        ...prev,
        habitLogs: { ...prev.habitLogs, [dateKey]: { habitIds: newIds } }
      };
    });
  };

  const toggleTask = (taskId) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    }));
  };

  const addTask = (title, type = 'daily') => {
    const newTask = { id: Date.now().toString(), title, type, date: dateKey, completed: false };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const deleteTask = (taskId) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
  };

  const addHabit = (title) => {
    const newHabit = { id: Date.now().toString(), title, created_at: dateKey };
    setData(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const deleteHabit = (habitId) => {
    setData(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== habitId) }));
  };

  const updateUser = (field, value) => {
    setData(prev => ({ ...prev, user: { ...prev.user, [field]: value } }));
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // --- COMPONENT: STAT CARD ---
  const StatCard = ({ icon: Icon, value, label, highlight }) => (
    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${highlight ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-white border-stone-200 text-stone-600'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={highlight ? 'text-emerald-300' : 'text-stone-400'} />
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );

  // --- VIEWS ---

  const HomeView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const monthDays = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const daysArray = Array.from({ length: monthDays }, (_, i) => i + 1);
    const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
      <div className="space-y-6 pb-28 animate-fade-in">
        {/* Main Stats Area */}
        <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={Zap} 
              value={`${currentStreak} Days`} 
              label="Streak" 
              highlight={true} 
            />
            <StatCard 
              icon={Target} 
              value={`${currentStats.percentage}%`} 
              label="Today" 
              highlight={false} 
            />
        </div>

        {/* Progress Insight */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
           <div className="flex justify-between items-end mb-3">
              <div>
                <h3 className="text-stone-900 font-bold text-lg">Daily Goal</h3>
                <p className="text-stone-500 text-xs mt-1">
                  {currentStats.isStreak 
                  ? "Excellent! You've maintained the 80% rule." 
                  : "Complete tasks & habits to hit 80%."}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentStats.isStreak ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                {currentStats.isStreak ? 'ON TRACK' : 'PENDING'}
              </div>
           </div>
           
           <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden relative">
              {/* 80% Marker Line */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-stone-300 z-10" style={{ left: '80%' }}></div>
              <div 
                className={`h-full transition-all duration-700 ease-out rounded-full ${currentStats.isStreak ? 'bg-emerald-600' : 'bg-stone-800'}`}
                style={{ width: `${currentStats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-1 px-1">
              <span>0%</span>
              <span className="text-stone-600">80% Target</span>
              <span>100%</span>
            </div>
        </div>

        {/* Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-900 text-lg">
              {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 px-3 py-1 rounded-full transition-colors"
            >
              Jump to Today
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-y-4">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
              <div key={i} className="text-center text-xs text-stone-400 font-bold uppercase tracking-wider">{d}</div>
            ))}
            {emptySlots.map(i => <div key={`empty-${i}`} />)}
            {daysArray.map(day => {
              const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              const dKey = formatDate(d);
              const stats = getDayStats(dKey);
              const isToday = dKey === formatDate(new Date());
              const isSelected = dKey === dateKey;
              
              return (
                <div key={day} className="flex justify-center">
                  <button 
                    onClick={() => setSelectedDate(d)}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                      ${isSelected ? 'bg-stone-900 text-white shadow-lg scale-110 z-10' : ''}
                      ${!isSelected && stats.isStreak ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : ''}
                      ${!isSelected && !stats.isStreak && !isToday ? 'text-stone-500 hover:bg-stone-100' : ''}
                      ${!isSelected && isToday ? 'border-2 border-stone-900 text-stone-900' : ''}
                    `}
                  >
                    {day}
                    {/* Small dot for streak days if not selected */}
                    {!isSelected && stats.isStreak && (
                       <div className="absolute -bottom-1 w-1 h-1 bg-emerald-600 rounded-full"></div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const TasksView = () => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [filter, setFilter] = useState('daily'); 
    
    const displayedTasks = data.tasks.filter(t => {
       if (filter === 'all') return true;
       if (filter === 'daily') return t.date === dateKey;
       return t.type === filter;
    });

    const handleAdd = (e) => {
      e.preventDefault();
      if (!newTaskTitle.trim()) return;
      addTask(newTaskTitle, filter === 'all' ? 'daily' : filter);
      setNewTaskTitle('');
    };

    return (
      <div className="h-full pb-28 flex flex-col">
        {/* Filters */}
        <div className="flex gap-2 mb-6 p-1 bg-stone-100 rounded-xl w-fit">
          {['daily', 'weekly', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                ${filter === f ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              {f === 'daily' ? 'Today' : f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {displayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                 <ListTodo size={24} className="opacity-50" />
              </div>
              <p className="text-sm font-medium">No tasks for this day.</p>
            </div>
          ) : (
            displayedTasks.map(task => (
              <div key={task.id} className={`group p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 ${task.completed ? 'bg-stone-50 border-stone-100 opacity-75' : 'bg-white border-stone-200 shadow-sm hover:border-emerald-300'}`}>
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors duration-200 transform active:scale-90`}
                >
                  {task.completed ? 
                    <CheckCircle2 size={24} className="text-emerald-600" fill="#d1fae5" /> : 
                    <Circle size={24} className="text-stone-300 hover:text-emerald-500" strokeWidth={2} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`block text-sm font-medium truncate ${task.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                    {task.title}
                  </span>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="mt-4">
          <div className="relative">
             <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-white border border-stone-200 rounded-xl pl-4 pr-12 py-4 text-stone-900 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit" 
              disabled={!newTaskTitle.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-900 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>
      </div>
    );
  };

  const HabitsView = () => {
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const dailyLog = data.habitLogs[dateKey] || { habitIds: [] };

    const handleAdd = (e) => {
      e.preventDefault();
      if (!newHabitTitle.trim()) return;
      addHabit(newHabitTitle);
      setNewHabitTitle('');
    };

    return (
      <div className="h-full pb-28 flex flex-col">
        <div className="bg-emerald-900 rounded-2xl p-5 mb-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Award size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">The 80% Rule</span>
            </div>
            <p className="text-sm leading-relaxed text-emerald-100">
              Consistency beats perfection. You only need to complete <span className="font-bold text-white">80%</span> of your items to keep your streak alive.
            </p>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-emerald-800 rounded-full opacity-50 blur-2xl"></div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {data.habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                 <TrendingUp size={24} className="opacity-50" />
              </div>
              <p className="text-sm font-medium">No habits created yet.</p>
            </div>
          ) : (
            data.habits.map(habit => {
              const isDone = dailyLog.habitIds.includes(habit.id);
              return (
                <div key={habit.id} className={`group p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-stone-200 shadow-sm hover:border-emerald-300'}`}>
                  <button 
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex-shrink-0 transition-all duration-300 transform active:scale-90`}
                  >
                     {isDone ? 
                       <div className="bg-emerald-600 text-white p-1 rounded-full"><CheckCircle2 size={20} /></div> : 
                       <Circle size={28} className="text-stone-300 hover:text-emerald-500" strokeWidth={1.5} />
                     }
                  </button>
                  <div className="flex-1">
                    <span className={`block text-sm font-semibold transition-colors ${isDone ? 'text-emerald-900' : 'text-stone-700'}`}>
                      {habit.title}
                    </span>
                    <span className="text-[10px] text-stone-400">Daily Habit</span>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleAdd} className="mt-4">
          <div className="relative">
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="Start a new habit..."
              className="w-full bg-white border border-stone-200 rounded-xl pl-4 pr-12 py-4 text-stone-900 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit" 
              disabled={!newHabitTitle.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-900 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ProfileView = () => (
    <div className="space-y-6 pb-28">
      <div className="flex flex-col items-center py-10">
        <div className="w-28 h-28 bg-white border-4 border-emerald-100 rounded-full flex items-center justify-center mb-5 text-emerald-800 shadow-lg">
          <User size={48} />
        </div>
        <input 
          value={data.user.name}
          onChange={(e) => updateUser('name', e.target.value)}
          className="text-3xl font-bold text-stone-900 text-center bg-transparent border-none focus:ring-0 focus:underline decoration-emerald-500 w-full"
        />
        <p className="text-stone-400 text-sm mt-1">Tap name to edit</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center gap-3 text-stone-900 font-bold text-lg">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Settings size={20} />
          </div>
          <h3>My Goals</h3>
        </div>
        <textarea 
          value={data.user.goals}
          onChange={(e) => updateUser('goals', e.target.value)}
          className="w-full h-40 p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors resize-none"
          placeholder="What are you working towards?"
        />
      </div>
      
      <div className="text-center pt-8">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">On Track v2.0</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex justify-center">
      {/* Inject Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Text:wght@700&display=swap');
      `}</style>
      
      <div className="w-full max-w-md bg-stone-50 min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Navigation / Header */}
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-stone-50/90 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 
              className="text-3xl font-bold tracking-tight uppercase leading-none"
              style={{ 
                fontFamily: "'Big Shoulders Stencil Text', cursive",
                color: '#064E3B'
              }}
            >
              On Track
            </h1>
            <p className="text-xs font-medium text-stone-500 mt-1">Don't lose your life's track</p>
          </div>
          
          {/* Date Navigator - Minimalist */}
          {activeTab !== 'profile' && (
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full p-1 shadow-sm">
              <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-bold w-24 text-center text-stone-800 uppercase tracking-wide">
                 {dateKey === formatDate(new Date()) ? 'Today' : 
                  dateKey === formatDate(new Date(Date.now() - 86400000)) ? 'Yesterday' : 
                  selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-5 py-4 overflow-y-auto no-scrollbar relative z-0">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Bottom Navigation - Floating Style */}
        <div className="fixed bottom-0 w-full max-w-md px-6 py-6 z-30 pointer-events-none">
          <nav className="bg-stone-900/95 backdrop-blur-lg rounded-full px-6 py-4 flex justify-between items-center shadow-xl shadow-stone-900/20 text-stone-400 pointer-events-auto border border-stone-800">
            <NavButton 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
              icon={CalendarIcon} 
              label="Home" 
            />
            <NavButton 
              active={activeTab === 'tasks'} 
              onClick={() => setActiveTab('tasks')} 
              icon={ListTodo} 
              label="Tasks" 
            />
            <NavButton 
              active={activeTab === 'habits'} 
              onClick={() => setActiveTab('habits')} 
              icon={TrendingUp} 
              label="Habits" 
            />
            <NavButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
              icon={User} 
              label="Profile" 
            />
          </nav>
        </div>

      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 w-12 ${active ? 'text-emerald-400 transform -translate-y-1' : 'hover:text-stone-200'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : ""} />
  </button>
);
