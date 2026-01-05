import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Target,
  Download,
  Upload,
  Moon,
  Sun,
  LayoutDashboard,
  Bug,
  Mail,
  Heart,
  X
} from 'lucide-react';

/**
 * UTILS & CONSTANTS
 */
const STORAGE_KEY = 'on_track_data_v2';

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

// --- SUB-COMPONENTS ---

const EditableText = ({ text, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value.trim() && value !== text) {
      onSave(value);
    } else {
      setValue(text); // Revert if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-transparent outline-none border-b-2 border-emerald-500 w-full rounded-sm px-1 ${className}`}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={`cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${className}`}
      title="Click to edit"
    >
      {text}
    </span>
  );
};

const StatCard = ({ icon: Icon, value, label, highlight }) => (
  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all 
    ${highlight 
      ? 'bg-emerald-900 dark:bg-emerald-950 text-white border-emerald-800 dark:border-emerald-900' 
      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
    }`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className={highlight ? 'text-emerald-300' : 'text-stone-400'} />
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
    </div>
    <span className="text-2xl font-bold tracking-tight">{value}</span>
  </div>
);

const NavButton = ({ active, onClick, icon: Icon, label, isSidebar }) => {
  if (isSidebar) {
    return (
      <button 
        onClick={onClick}
        className={`flex items-center gap-3 transition-all duration-200 w-full p-3 rounded-xl text-left hidden md:flex
          ${active 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm' 
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }
        `}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span className="text-sm">{label}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-300 md:hidden
        ${active 
          ? 'text-emerald-400 transform -translate-y-2' 
          : 'text-stone-500 hover:text-stone-300'
        }
      `}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : ""} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

// --- NEW COMPONENT: Task Modal for Calendar ---
const TaskModal = ({ isOpen, onClose, date, tasks, addTask, editTask, toggleTask, deleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dateKey = formatDate(date);
  const dailyTasks = tasks.filter(t => t.date === dateKey);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, 'daily', dateKey); // Explicitly pass dateKey
    setNewTaskTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Manage tasks for this day</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          {dailyTasks.length === 0 ? (
            <div className="text-center py-8 text-stone-400 dark:text-stone-600">
              <ListTodo size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks yet.</p>
            </div>
          ) : (
            dailyTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 text-emerald-600 dark:text-emerald-500">
                  {task.completed ? <CheckCircle2 size={20} fill="currentColor" fillOpacity={0.2} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <EditableText 
                    text={task.title} 
                    onSave={(newTitle) => editTask(task.id, newTitle)}
                    className={`text-sm block truncate ${task.completed ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-200'}`}
                  />
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-stone-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-4 pr-12 py-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="submit" 
              disabled={!newTaskTitle.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-900 dark:bg-stone-700 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: Welcome Modal (First Time User) ---
const WelcomeModal = ({ isOpen, onClose, user, updateUser }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
          <User size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Welcome!</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">Let's personalize your experience to keep you On Track.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 ml-1">Your Name</label>
            <input 
              required
              value={user.name === 'Traveler' ? '' : user.name}
              onChange={(e) => updateUser('name', e.target.value)}
              placeholder="e.g. Asad"
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 ml-1">Your Main Goal</label>
            <textarea 
              value={user.goals === 'Stay consistent and disciplined with the 80% Rule.' ? '' : user.goals}
              onChange={(e) => updateUser('goals', e.target.value)}
              placeholder="e.g. Pray 5 times daily & launch my project."
              className="w-full h-24 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-stone-900 dark:bg-emerald-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity mt-4"
          >
            Start My Journey
          </button>
        </form>
      </div>
    </div>
  );
};

const HomeView = ({ user, selectedDate, setSelectedDate, currentStats, currentStreak, getDayStats, dateKey, tasks, addTask, editTask, toggleTask, deleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthDays = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const daysArray = Array.from({ length: monthDays }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6 pb-28 md:pb-6 animate-fade-in max-w-4xl mx-auto">
        
        {/* Greeting & Goal Section */}
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="text-emerald-700 dark:text-emerald-400">{user.name.split(' ')[0]}</span>
          </h1>
          {user.goals && (
            <div className="mt-4 flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
               <Target className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" size={20} />
               <p className="text-sm md:text-base font-medium text-emerald-900 dark:text-emerald-200 italic">"{user.goals}"</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Zap} value={`${currentStreak} Days`} label="Streak" highlight={true} />
            <StatCard icon={Target} value={`${currentStats.percentage}%`} label="Today" highlight={false} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Insight */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
             <div className="flex justify-between items-end mb-3">
                <div>
                  <h3 className="text-stone-900 dark:text-stone-100 font-bold text-lg">Daily Goal</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
                    {currentStats.isStreak ? "Excellent! You've maintained the 80% rule." : "Complete tasks & habits to hit 80%."}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentStats.isStreak ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'}`}>
                  {currentStats.isStreak ? 'ON TRACK' : 'PENDING'}
                </div>
             </div>
             
             <div className="h-4 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 w-0.5 bg-stone-300 dark:bg-stone-700 z-10" style={{ left: '80%' }}></div>
                <div 
                  className={`h-full transition-all duration-700 ease-out rounded-full ${currentStats.isStreak ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-stone-800 dark:bg-stone-600'}`}
                  style={{ width: `${currentStats.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-1 px-1">
                <span>0%</span>
                <span className="text-stone-600 dark:text-stone-400">80% Target</span>
                <span>100%</span>
              </div>
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1 rounded-full transition-colors"
              >
                Today
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
                      onClick={() => handleDateClick(d)}
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                        ${isSelected ? 'bg-stone-900 dark:bg-emerald-500 text-white shadow-lg scale-110 z-10' : ''}
                        ${!isSelected && stats.isStreak ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : ''}
                        ${!isSelected && !stats.isStreak && !isToday ? 'text-stone-500 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800' : ''}
                        ${!isSelected && isToday ? 'border-2 border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100' : ''}
                      `}
                    >
                      {day}
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
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        tasks={tasks}
        addTask={addTask}
        editTask={editTask}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
      />
    </>
  );
};

// ... TasksView, HabitsView, ProfileView components ...
const TasksView = ({ tasks, dateKey, addTask, editTask, toggleTask, deleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('daily'); 
  
  const displayedTasks = tasks.filter(t => {
     if (filter === 'all') return true;
     
     if (filter === 'daily') {
       return t.date === dateKey;
     }
     
     if (filter === 'weekly') {
       const selected = new Date(dateKey);
       const day = selected.getDay(); 
       const diff = selected.getDate() - day; 
       
       const startOfWeek = new Date(selected);
       startOfWeek.setDate(diff);
       startOfWeek.setHours(0,0,0,0);

       const endOfWeek = new Date(startOfWeek);
       endOfWeek.setDate(startOfWeek.getDate() + 6);
       endOfWeek.setHours(23,59,59,999);
       
       const taskDate = new Date(t.date);
       taskDate.setHours(0,0,0,0);
       
       return taskDate.getTime() >= startOfWeek.getTime() && taskDate.getTime() <= endOfWeek.getTime();
     }
     
     return t.type === filter;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    // Default to adding to the selected date (dateKey)
    addTask(newTaskTitle, 'daily', dateKey);
    setNewTaskTitle('');
  };

  return (
    <div className="h-full pb-28 md:pb-6 flex flex-col max-w-4xl mx-auto w-full">
      <div className="flex gap-2 mb-6 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        {['daily', 'weekly', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
              ${filter === f 
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' 
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
          >
            {f === 'daily' ? 'Today' : f === 'weekly' ? 'This Week' : 'All Time'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-stone-400 dark:text-stone-600">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-3">
               <ListTodo size={24} className="opacity-50" />
            </div>
            <p className="text-sm font-medium">No tasks found for this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedTasks.map(task => (
              <div key={task.id} className={`group p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 
                ${task.completed 
                  ? 'bg-stone-50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 opacity-75' 
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors duration-200 transform active:scale-90`}
                >
                  {task.completed ? 
                    <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-500" fill="currentColor" fillOpacity={0.2} /> : 
                    <Circle size={24} className="text-stone-300 dark:text-stone-600 hover:text-emerald-500" strokeWidth={2} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <EditableText 
                    text={task.title} 
                    onSave={(newTitle) => editTask(task.id, newTitle)}
                    className={`block text-sm font-medium truncate ${task.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-200'}`}
                  />
                  {filter === 'weekly' && (
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {new Date(task.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                    </span>
                  )}
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-4">
        <div className="relative">
           <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-4 pr-12 py-4 text-stone-900 dark:text-stone-100 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button 
            type="submit" 
            disabled={!newTaskTitle.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-900 dark:bg-stone-700 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 dark:hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

const HabitsView = ({ habits, habitLogs, dateKey, addHabit, editHabit, toggleHabit, deleteHabit }) => {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const dailyLog = habitLogs[dateKey] || { habitIds: [] };

  // FIX: Only show habits created on or before the selected date
  const visibleHabits = habits.filter(h => h.created_at <= dateKey);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addHabit(newHabitTitle);
    setNewHabitTitle('');
  };

  return (
    <div className="h-full pb-28 md:pb-6 flex flex-col max-w-4xl mx-auto w-full">
      <div className="bg-emerald-900 dark:bg-emerald-950 rounded-2xl p-5 mb-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Award size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">The 80% Rule</span>
          </div>
          <p className="text-sm leading-relaxed text-emerald-100 dark:text-emerald-300">
            Consistency beats perfection. You only need to complete <span className="font-bold text-white">80%</span> of your items to keep your streak alive.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-emerald-800 dark:bg-emerald-900 rounded-full opacity-50 blur-2xl"></div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {visibleHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-stone-400 dark:text-stone-600">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-3">
               <TrendingUp size={24} className="opacity-50" />
            </div>
            <p className="text-sm font-medium">No habits active for this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleHabits.map(habit => {
              const isDone = dailyLog.habitIds.includes(habit.id);
              return (
                <div key={habit.id} className={`group p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 
                  ${isDone 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50' 
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                  <button 
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex-shrink-0 transition-all duration-300 transform active:scale-90`}
                  >
                     {isDone ? 
                       <div className="bg-emerald-600 text-white p-1 rounded-full"><CheckCircle2 size={20} /></div> : 
                       <Circle size={28} className="text-stone-300 dark:text-stone-600 hover:text-emerald-500" strokeWidth={1.5} />
                     }
                  </button>
                  <div className="flex-1">
                    <EditableText 
                      text={habit.title}
                      onSave={(newTitle) => editHabit(habit.id, newTitle)} 
                      className={`block text-sm font-semibold transition-colors ${isDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-stone-700 dark:text-stone-300'}`}
                    />
                    <span className="text-[10px] text-stone-400">Daily Habit</span>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-4">
        <div className="relative">
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="Start a new habit..."
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-4 pr-12 py-4 text-stone-900 dark:text-stone-100 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button 
            type="submit" 
            disabled={!newHabitTitle.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-900 dark:bg-stone-700 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

const ProfileView = ({ user, updateUser, data, setData, isDarkMode, toggleTheme }) => {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ontrack_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.user && importedData.tasks && importedData.habits) {
          if (confirm("Replacing current data with backup. Are you sure?")) {
             setData(importedData);
             alert("Data restored successfully!");
          }
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 pb-28 md:pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500">
          <User size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Profile Settings</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">Manage your account and preferences</p>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400">Display Name</label>
        <input 
          value={user.name}
          onChange={(e) => updateUser('name', e.target.value)}
          className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-orange-100 text-orange-500'}`}>
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-white">Appearance</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Toggle dark mode</p>
            </div>
         </div>
         <button 
           onClick={toggleTheme}
           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${isDarkMode ? 'bg-emerald-600' : 'bg-stone-200'}`}
         >
           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
         </button>
      </div>

      {/* Goals */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold">
          <Target size={18} className="text-emerald-600" />
          <h3>My Goals</h3>
        </div>
        <textarea 
          value={user.goals}
          onChange={(e) => updateUser('goals', e.target.value)}
          className="w-full h-32 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="What are you working towards?"
        />
      </div>

      {/* Data Backup */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-stone-900 dark:text-white font-bold">Data Management</h3>
           <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-1 rounded">JSON Format</span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">Export your progress to safeguard your streak or move to another device.</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            <Download size={16} />
            Backup
          </button>
          
          <button 
            onClick={() => fileInputRef.current.click()}
            className="flex items-center justify-center gap-2 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 py-3 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
          >
            <Upload size={16} />
            Restore
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Feedback / Bug Report (Mailto) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold">
          <Bug size={18} className="text-red-500" />
          <h3>Feedback & Bugs</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">Found a bug or have a suggestion? Email us directly.</p>
        
        <a 
          href="mailto:gemorjim@gmail.com?subject=On%20Track%20Feedback%20%2F%20Bug%20Report"
          className="w-full flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 py-3 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          <Mail size={16} />
          Send Email
        </a>
      </div>
      
      <div className="text-center pt-4 pb-8 flex flex-col items-center justify-center text-stone-400 gap-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest">
          Made with <Heart size={12} className="text-red-500 fill-red-500" /> for you by Jim & Gemini
        </p>
        <p className="text-[10px] opacity-60">v2.3 • Halal & Productive</p>
      </div>
    </div>
  );
};

/**
 * MAIN APP COMPONENT
 */
export default function OnTrackApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse data", e);
      }
    } else {
      setShowWelcomeModal(true);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const dateKey = formatDate(selectedDate);

  // Engine
  const getDayStats = (targetDateStr) => {
    const activeHabits = data.habits.filter(h => h.created_at <= targetDateStr);
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

  // Actions
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

  const addTask = (title, type = 'daily', taskDate = null) => {
    const newTask = { 
      id: Date.now().toString(), 
      title, 
      type, 
      date: taskDate || dateKey, 
      completed: false 
    };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const editTask = (taskId, newTitle) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
    }));
  };

  const deleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }
  };

  const addHabit = (title) => {
    const newHabit = { id: Date.now().toString(), title, created_at: dateKey };
    setData(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const editHabit = (habitId, newTitle) => {
    setData(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === habitId ? { ...h, title: newTitle } : h)
    }));
  };

  const deleteHabit = (habitId) => {
    if (window.confirm("Delete this habit? This will remove it from all future dates.")) {
      setData(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== habitId) }));
    }
  };

  const updateUser = (field, value) => {
    setData(prev => ({ ...prev, user: { ...prev.user, [field]: value } }));
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Text:wght@700&display=swap');
      `}</style>
      
      {/* PC Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 h-screen sticky top-0 p-6">
        <div className="mb-10">
          <h1 
            className="text-4xl font-bold tracking-tight uppercase leading-none text-[#064E3B] dark:text-emerald-400 transition-colors"
            style={{ 
              fontFamily: "'Big Shoulders Stencil Text', cursive",
            }}
          >
            On Track
          </h1>
          <p className="text-xs font-medium text-stone-500 mt-2">Don't lose your life's track</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={LayoutDashboard} label="Dashboard" isSidebar />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ListTodo} label="Tasks" isSidebar />
          <NavButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={TrendingUp} label="Habits" isSidebar />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={Settings} label="Settings" isSidebar />
        </nav>

        <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
           <button 
             onClick={() => setActiveTab('profile')}
             className="flex items-center gap-3 p-3 rounded-xl w-full text-left transition-colors hover:bg-stone-100 dark:hover:bg-stone-800/80 group"
           >
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-bold group-hover:scale-105 transition-transform">
                {data.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-stone-900 dark:text-stone-100">{data.user.name}</p>
                <p className="text-xs text-stone-500 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">View Profile</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden px-6 pt-12 pb-4 flex justify-between items-center bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 
              className="text-3xl font-bold tracking-tight uppercase leading-none text-[#064E3B] dark:text-emerald-400 transition-colors"
              style={{ 
                fontFamily: "'Big Shoulders Stencil Text', cursive",
              }}
            >
              On Track
            </h1>
          </div>
        </header>

        {/* Desktop Date Header (Dynamic location based on tab) */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
          <div className="p-6 md:p-10 max-w-5xl mx-auto">
             
             {/* PC Header for Date (Only visible on pc if not profile) */}
             {activeTab !== 'profile' && (
               <div className="hidden md:flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
                    <p className="text-stone-500">Manage your day efficiently</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full p-1.5 shadow-sm">
                    <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-600 dark:text-stone-400 transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold w-32 text-center text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      {dateKey === formatDate(new Date()) ? 'Today' : 
                        dateKey === formatDate(new Date(Date.now() - 86400000)) ? 'Yesterday' : 
                        selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-600 dark:text-stone-400 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
               </div>
             )}

             {/* Mobile Date Nav (Hidden on Profile tab) */}
             {activeTab !== 'profile' && (
                <div className="md:hidden flex items-center justify-between mb-4 bg-white dark:bg-stone-900 p-2 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button onClick={() => changeDate(-1)} className="p-2"><ChevronLeft size={20} /></button>
                  <span className="font-bold">
                    {dateKey === formatDate(new Date()) ? 'Today' : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => changeDate(1)} className="p-2"><ChevronRight size={20} /></button>
                </div>
             )}

            {activeTab === 'home' && (
              <HomeView 
                user={data.user}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                currentStats={currentStats}
                currentStreak={currentStreak}
                getDayStats={getDayStats}
                dateKey={dateKey}
                tasks={data.tasks}
                addTask={addTask}
                editTask={editTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksView 
                tasks={data.tasks}
                dateKey={dateKey}
                addTask={addTask}
                editTask={editTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
              />
            )}
            {activeTab === 'habits' && (
              <HabitsView 
                habits={data.habits}
                habitLogs={data.habitLogs}
                dateKey={dateKey}
                addHabit={addHabit}
                editHabit={editHabit}
                toggleHabit={toggleHabit}
                deleteHabit={deleteHabit}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileView 
                user={data.user}
                updateUser={updateUser}
                data={data}
                setData={setData}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 w-full px-6 py-6 z-30 pointer-events-none">
          <nav className="bg-stone-900/95 dark:bg-stone-800/95 backdrop-blur-lg rounded-full px-6 py-4 flex justify-between items-center shadow-xl shadow-stone-900/20 text-stone-400 pointer-events-auto border border-stone-800">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={CalendarIcon} label="Home" />
            <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ListTodo} label="Tasks" />
            <NavButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={TrendingUp} label="Habits" />
            <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Profile" />
          </nav>
        </div>
        
        <WelcomeModal 
          isOpen={showWelcomeModal} 
          onClose={() => setShowWelcomeModal(false)}
          user={data.user}
          updateUser={updateUser}
        />
      </div>
    </div>
  );
}
