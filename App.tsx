import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskItem } from './components/TaskItem';
import { AiChatPanel } from './components/AiChatPanel';
import { Task, ViewType, Subtask, Priority, Project, Language, UserProfile, Attachment } from './types';
import { analyzeTaskWithAI } from './services/geminiService';
import { translations } from './translations';
import { Plus, SlidersHorizontal, Flag, Calendar, Inbox as InboxIcon, Sparkles, Loader2, FolderOpen, Languages, Moon, Sun, User, Bell, Info, Pencil, Check, X, Camera, Quote, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const initialProjects: Project[] = [
  { id: 'p1', name: 'Personal', color: 'bg-emerald-500' },
  { id: 'p2', name: 'Work', color: 'bg-blue-500' },
  { id: 'p3', name: 'Shopping', color: 'bg-orange-500' },
];

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Review Q3 Marketing Report',
    description: 'Analyze the performance metrics from the last quarter and identify key growth areas.',
    completed: false,
    project: 'p2', // Work
    dueDate: new Date(),
    priority: Priority.HIGH,
    subtasks: [],
    motivation: 'You crunched the numbers last time and found gold. This report is your victory lap.',
    notes: 'Key metrics to look for: \n- CTR\n- Conversion Rate\n- CAC',
    attachments: []
  },
  {
    id: '2',
    title: 'Buy groceries for the week',
    completed: false,
    project: 'p1', // Personal
    priority: Priority.NONE,
    subtasks: [
      { id: '2-1', title: 'Milk', completed: false },
      { id: '2-2', title: 'Bread', completed: true }
    ],
    attachments: []
  },
  {
    id: '3',
    title: 'Schedule dentist appointment',
    completed: true,
    priority: Priority.LOW,
    subtasks: [],
    attachments: []
  }
];

const motivationalQuotes: Record<Language, string[]> = {
  en: [
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "Small steps every day lead to big results.",
    "You don't have to see the whole staircase, just take the first step.",
    "Done is better than perfect.",
    "Your future is created by what you do today, not tomorrow.",
    "Simplicity boils down to two steps: Identify the essential. Eliminate the rest."
  ],
  ar: [
    "سر التقدم هو البداية.",
    "ركز على الإنتاجية لا الانشغال.",
    "خطوات صغيرة كل يوم تؤدي إلى نتائج كبيرة.",
    "لا تحتاج لرؤية الدرج كاملاً، فقط اصعد الدرجة الأولى.",
    "إنجاز العمل خير من كماله.",
    "مستقبلك يُصنع بما تفعله اليوم، لا غداً.",
    "البساطة تتلخص في خطوتين: حدد الضروري، وتخلص من الباقي."
  ]
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [view, setView] = useState<ViewType>(ViewType.INBOX);
  
  // Calendar & Project State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [newTaskInput, setNewTaskInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(Priority.NONE);
  
  // Theme & Language State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [currentQuote, setCurrentQuote] = useState('');

  // Sidebar State (Left)
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);

  // AI Chat State (Right Sidebar)
  const [isChatOpen, setIsChatOpen] = useState(false); // "Open" means Expanded (380px), "False" means Compact (60px)
  const [chatContextTask, setChatContextTask] = useState<Task | null>(null);
  
  // Mobile Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // AI Analysis State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [enhancedData, setEnhancedData] = useState<{
    description: string;
    subtasks: string[];
    motivation: string;
  } | null>(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    initials: 'JD'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState<UserProfile>(userProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // 1024px breakpoint for tablet/mobile
      setIsMobile(mobile);
      if (!mobile) {
        // Reset mobile states when switching to desktop
        setIsMobileSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Theme Management ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Language Management ---
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // --- Quote Management ---
  useEffect(() => {
    const quotes = motivationalQuotes[language];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, [language]); 

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  
  const t = translations[language];

  // --- Profile Management ---
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveProfile = () => {
    setUserProfile({
      ...editProfileForm,
      initials: getInitials(editProfileForm.name)
    });
    setIsEditingProfile(false);
  };

  const handleCancelEditProfile = () => {
    setEditProfileForm(userProfile);
    setIsEditingProfile(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEditingProfile) {
          setEditProfileForm(prev => ({ ...prev, avatarUrl: result }));
        } else {
           // Fallback if triggered outside edit mode (if enabled later)
           setEditProfileForm(prev => ({ ...prev, avatarUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Project Management ---
  const handleAddProject = (name: string) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      color: randomColor
    };
    setProjects([...projects, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    // Remove project assignment from tasks
    setTasks(tasks.map(t => t.project === id ? { ...t, project: undefined } : t));
    
    if (view === ViewType.PROJECT && selectedProjectId === id) {
      setView(ViewType.INBOX);
      setSelectedProjectId(null);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setView(ViewType.PROJECT);
  };

  // --- Task Management ---

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    // Determine due date based on view
    let taskDueDate: Date | undefined = undefined;
    if (view === ViewType.TODAY) {
      taskDueDate = new Date();
    } else if (view === ViewType.CALENDAR_DATE) {
      taskDueDate = selectedDate;
    }

    // Determine project based on view
    let taskProject: string | undefined = undefined;
    if (view === ViewType.PROJECT && selectedProjectId) {
      taskProject = selectedProjectId;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskInput,
      completed: false,
      subtasks: enhancedData 
        ? enhancedData.subtasks.map((st, i) => ({ id: `sub-${Date.now()}-${i}`, title: st, completed: false })) 
        : [],
      description: enhancedData?.description,
      motivation: enhancedData?.motivation,
      dueDate: taskDueDate,
      project: taskProject,
      priority: selectedPriority,
      notes: '',
      attachments: []
    };

    setTasks([newTask, ...tasks]);
    setNewTaskInput('');
    setSelectedPriority(Priority.NONE);
    setEnhancedData(null); // Reset AI data
  };

  // Handle creation from Chat Panel Tool Call
  const handleAiTaskCreation = (data: any) => {
    const { title, description, priority, subtasks, motivation } = data;
    
    const newTask: Task = {
      id: `ai-${Date.now()}`,
      title: title || 'New Project',
      description: description || '',
      completed: false,
      priority: (priority as Priority) || Priority.MEDIUM,
      dueDate: new Date(), // Default to today for focus
      subtasks: Array.isArray(subtasks) 
        ? subtasks.map((st: string, i: number) => ({ id: `ai-sub-${Date.now()}-${i}`, title: st, completed: false }))
        : [],
      motivation: motivation || "Let's get this done!",
      notes: '',
      attachments: []
    };

    setTasks(prev => [newTask, ...prev]);
  };

  // Handle update from Chat Panel Tool Call
  const handleAiTaskUpdate = (data: any) => {
    const { taskId, title, description, priority, subtasks, motivation } = data;

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const updated = { ...t };
      if (title) updated.title = title;
      if (description) updated.description = description;
      if (priority) updated.priority = priority as Priority;
      if (motivation) updated.motivation = motivation;
      
      if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
        const newSubtasks = subtasks.map((st: string, i: number) => ({
          id: `ai-upd-${Date.now()}-${i}`,
          title: st,
          completed: false
        }));
        // We append new subtasks to existing ones
        updated.subtasks = [...updated.subtasks, ...newSubtasks];
      }

      return updated;
    }));
  };

  const handleAiEnhance = async () => {
    if (!newTaskInput.trim()) return;
    setIsAiAnalyzing(true);
    
    const result = await analyzeTaskWithAI(newTaskInput);
    
    if (result) {
      setNewTaskInput(result.refinedTitle);
      setSelectedPriority(result.priority);
      setEnhancedData({
        description: result.description,
        subtasks: result.subtasks,
        motivation: result.motivation
      });
    }
    setIsAiAnalyzing(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: task.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        )
      };
    }));
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks(tasks.map(task => {
      if (task.id !== taskId) return task;
      const newSubtask: Subtask = {
        id: `sub-${Date.now()}`,
        title,
        completed: false
      };
      return { ...task, subtasks: [...task.subtasks, newSubtask] };
    }));
  };

  const handleUpdateNotes = (taskId: string, notes: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, notes } : task
    ));
  };

  const handleAddAttachment = (taskId: string, file: File) => {
    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };

    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, attachments: [...(task.attachments || []), newAttachment] } : task
    ));
  };

  const handleDeleteAttachment = (taskId: string, attachmentId: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
       if (task.id !== taskId) return task;
       return {
         ...task,
         attachments: (task.attachments || []).filter(a => a.id !== attachmentId)
       };
    }));
  };

  const handleTaskChat = (task: Task) => {
    setChatContextTask(task);
    setIsChatOpen(true); // Auto-expand when context is set
  };

  // --- Date Helper ---
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setView(ViewType.CALENDAR_DATE);
  };

  // --- AI Optimization (Replaces simple subtask generation) ---

  const handleSmartOptimize = async (id: string, title: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isAiGenerating: true } : t));
    try {
      const result = await analyzeTaskWithAI(title);
      if (result) {
        setTasks(prev => prev.map(t => {
          if (t.id !== id) return t;
          
          const newSubtasks: Subtask[] = result.subtasks.map((st, index) => ({
            id: `${id}-opt-${Date.now()}-${index}`,
            title: st,
            completed: false
          }));

          return { 
            ...t, 
            isAiGenerating: false,
            // Smartly update fields if they are empty or if AI suggests improvements
            description: t.description || result.description,
            priority: t.priority === Priority.NONE ? result.priority : t.priority,
            motivation: result.motivation,
            subtasks: [...t.subtasks, ...newSubtasks]
          };
        }));
      } else {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isAiGenerating: false } : t));
      }
    } catch (err) {
      console.error(err);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isAiGenerating: false } : t));
    }
  };

  // --- View Logic ---

  const getFilteredTasks = () => {
    switch (view) {
      case ViewType.COMPLETED:
        return tasks.filter(t => t.completed);
      case ViewType.TODAY:
        return tasks.filter(t => 
          !t.completed && 
          t.dueDate && 
          isSameDay(t.dueDate, new Date())
        );
      case ViewType.CALENDAR_DATE:
        return tasks.filter(t => 
          !t.completed && 
          t.dueDate && 
          isSameDay(t.dueDate, selectedDate)
        );
      case ViewType.UPCOMING:
        return tasks.filter(t => !t.completed && t.dueDate && t.dueDate > new Date());
      case ViewType.PROJECT:
        return tasks.filter(t => !t.completed && t.project === selectedProjectId);
      case ViewType.INBOX:
      default:
        return tasks.filter(t => !t.completed);
    }
  };

  // --- Overall Progress Calculation ---
  const getProgressTasks = () => {
    switch (view) {
      case ViewType.COMPLETED:
        return tasks.filter(t => t.completed);
      case ViewType.TODAY:
        return tasks.filter(t => t.dueDate && isSameDay(t.dueDate, new Date()));
      case ViewType.CALENDAR_DATE:
        return tasks.filter(t => t.dueDate && isSameDay(t.dueDate, selectedDate));
      case ViewType.UPCOMING:
        return tasks.filter(t => t.dueDate && t.dueDate > new Date());
      case ViewType.PROJECT:
        return tasks.filter(t => t.project === selectedProjectId);
      case ViewType.INBOX:
      default:
        return tasks;
    }
  };

  const progressTasks = getProgressTasks();
  const totalProgressTasks = progressTasks.length;
  const completedProgressTasks = progressTasks.filter(t => t.completed).length;
  const overallProgress = totalProgressTasks === 0 ? 0 : (completedProgressTasks / totalProgressTasks) * 100;

  const taskCounts = {
    [ViewType.INBOX]: tasks.filter(t => !t.completed).length,
    [ViewType.TODAY]: tasks.filter(t => !t.completed && t.dueDate && isSameDay(t.dueDate, new Date())).length,
    [ViewType.UPCOMING]: tasks.filter(t => !t.completed && t.dueDate && t.dueDate > new Date()).length,
    [ViewType.COMPLETED]: tasks.filter(t => t.completed).length,
    [ViewType.CALENDAR_DATE]: tasks.filter(t => !t.completed && t.dueDate && isSameDay(t.dueDate, selectedDate)).length,
    [ViewType.PROJECT]: tasks.filter(t => !t.completed && t.project === selectedProjectId).length,
    [ViewType.SETTINGS]: 0
  };

  // --- Counts for Sidebar ---
  const projectTaskCounts = tasks.reduce((acc, t) => {
    if (!t.completed && t.project) {
      acc[t.project] = (acc[t.project] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const calendarTaskCounts = tasks.reduce((acc, t) => {
    if (!t.completed && t.dueDate) {
      const dateKey = t.dueDate.toDateString();
      acc[dateKey] = (acc[dateKey] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);


  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.HIGH: return 'text-red-500 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
      case Priority.MEDIUM: return 'text-orange-500 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
      case Priority.LOW: return 'text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
      default: return 'text-gray-400 hover:bg-gray-100 border-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-500';
    }
  };

  const getHeaderTitle = () => {
    if (view === ViewType.CALENDAR_DATE) {
      return selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric' });
    }
    if (view === ViewType.PROJECT && selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      return proj ? proj.name : t.project;
    }
    if (view === ViewType.INBOX) return t.inbox;
    if (view === ViewType.TODAY) return t.today;
    if (view === ViewType.UPCOMING) return t.upcoming;
    if (view === ViewType.COMPLETED) return t.completed;
    if (view === ViewType.SETTINGS) return t.settings;
    return view;
  };

  // Layout styles - Explicitly handling responsiveness for JIT
  const mainContentMarginLeft = isMobile ? 'ms-0' : (isSidebarCompact ? 'ms-[80px]' : 'ms-[280px]');
  const mainContentMarginRight = isMobile ? 'me-0' : (isChatOpen ? 'me-[380px]' : 'me-[60px]');

  return (
    <div className="flex min-h-screen bg-white dark:bg-dark-bg text-charcoal dark:text-gray-200 font-sans selection:bg-gray-200 dark:selection:bg-gray-800 overflow-x-hidden transition-colors duration-300 w-full">
      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        taskCounts={taskCounts}
        projectTaskCounts={projectTaskCounts}
        calendarTaskCounts={calendarTaskCounts}
        isCompact={isSidebarCompact}
        onToggleCompact={() => setIsSidebarCompact(!isSidebarCompact)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        lang={language}
        onToggleLang={toggleLanguage}
        userProfile={userProfile}
        isMobile={isMobile}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main 
        className={`
          flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out w-full
          ${mainContentMarginLeft} ${mainContentMarginRight}
        `}
      >
        {/* Header */}
        <header className="h-16 px-4 lg:px-10 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md z-20 border-b border-transparent dark:border-dark-border transition-colors duration-300 w-full">
           <div className="flex items-center gap-3">
              {isMobile && (
                 <button 
                   onClick={() => setIsMobileSidebarOpen(true)}
                   className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                 >
                   <Menu size={24} strokeWidth={1.5} />
                 </button>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-charcoal dark:text-white transition-colors">{getHeaderTitle()}</h1>
                {view === ViewType.CALENDAR_DATE && (
                   <span className="text-xs text-gray-400 font-medium mt-1 px-2">
                     {selectedDate.toLocaleString(language === 'ar' ? 'ar-SA' : 'default', { year: 'numeric' })}
                   </span>
                )}
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              {isMobile && (
                 <button 
                   onClick={() => setIsChatOpen(true)}
                   className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-colors"
                 >
                   <Sparkles size={24} strokeWidth={1.5} />
                 </button>
              )}
              {!isMobile && (
                <button className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800">
                  <SlidersHorizontal size={18} strokeWidth={1.5} />
                </button>
              )}
           </div>
        </header>

        <div className="flex-1 px-4 lg:px-10 max-w-4xl mx-auto w-full pb-24 pt-4">
          
          {view === ViewType.SETTINGS ? (
            /* Settings Page */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto py-8"
            >
              {/* Profile Card */}
              <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-6 mb-8 relative flex-col sm:flex-row">
                  {/* Avatar Section */}
                  <div className="relative group/avatar mx-auto sm:mx-0">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => isEditingProfile && fileInputRef.current?.click()}
                        className={`w-20 h-20 rounded-full bg-charcoal dark:bg-white text-white dark:text-black flex items-center justify-center text-2xl font-bold shadow-md flex-shrink-0 overflow-hidden ${isEditingProfile ? 'cursor-pointer' : ''}`}
                    >
                        {(isEditingProfile ? editProfileForm.avatarUrl : userProfile.avatarUrl) ? (
                             <img src={isEditingProfile ? editProfileForm.avatarUrl : userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                             userProfile.initials
                        )}
                    </motion.div>
                    
                    {/* Camera Overlay in Edit Mode */}
                    {isEditingProfile && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                        >
                           <Camera className="text-white" size={20} />
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                  </div>
                  
                  {isEditingProfile ? (
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider block mb-1">{t.name}</label>
                        <input 
                          type="text" 
                          value={editProfileForm.name}
                          onChange={(e) => setEditProfileForm({...editProfileForm, name: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider block mb-1">{t.email}</label>
                        <input 
                          type="email" 
                          value={editProfileForm.email}
                          onChange={(e) => setEditProfileForm({...editProfileForm, email: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={handleSaveProfile}
                          className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          <Check size={12} /> {t.save}
                        </button>
                        <button 
                          onClick={handleCancelEditProfile}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X size={12} /> {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-between">
                           <h2 className="text-xl font-bold text-charcoal dark:text-white">{userProfile.name}</h2>
                           <button 
                              onClick={() => {
                                setEditProfileForm(userProfile);
                                setIsEditingProfile(true);
                              }}
                              className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-2"
                              title={t.editProfile}
                           >
                             <Pencil size={16} />
                           </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                        <button className="mt-3 text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                            {t.logOut}
                        </button>
                    </div>
                  )}
              </div>

              {/* Settings Sections */}
              <div className="space-y-6">
                  <section>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.general}</h3>
                      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                          {/* Language */}
                          <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                      <Languages size={18} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-charcoal dark:text-white">{t.language}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'en' ? 'English' : 'Arabic'}</p>
                                  </div>
                              </div>
                              <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                  {t.switch}
                              </button>
                          </div>

                          {/* Theme */}
                          <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                                      {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-charcoal dark:text-white">{t.theme}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? t.darkMode : t.lightMode}</p>
                                  </div>
                              </div>
                              <button onClick={toggleTheme} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                  {t.toggle}
                              </button>
                          </div>
                      </div>
                  </section>

                   <section>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.account}</h3>
                      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                          <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                                      <Bell size={18} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-charcoal dark:text-white">{t.notifications}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">On</p>
                                  </div>
                              </div>
                              <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-green-500">
                                <span className="translate-x-5 inline-block h-3 w-3 transform rounded-full bg-white transition" />
                              </div>
                          </div>
                           <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                                      <Info size={18} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-charcoal dark:text-white">{t.about}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">v1.2.0</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </section>
              </div>
            </motion.div>
          ) : (
            /* Main Task View */
            <>
              {/* Quote & Overall Progress */}
              {view !== ViewType.COMPLETED && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                   <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                         <Quote size={14} className="text-purple-400 flex-shrink-0 mt-1 transform scale-x-[-1]" />
                         <p className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed font-medium">
                            {currentQuote}
                         </p>
                      </div>
                      
                      {/* Overall Progress Bar */}
                      {totalProgressTasks > 0 && (
                        <div className="mt-2">
                           <div className="flex justify-between text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                              <span>Overall Progress</span>
                              <span>{Math.round(overallProgress)}%</span>
                           </div>
                           <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-black dark:bg-white" 
                                initial={{ width: 0 }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                           </div>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {/* Smart Input Area */}
              {view !== ViewType.COMPLETED && (
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`
                    mb-8 rounded-xl transition-all duration-300 border
                    ${isInputFocused 
                      ? 'bg-white dark:bg-dark-surface shadow-soft dark:shadow-none border-transparent ring-1 ring-gray-100 dark:ring-gray-700' 
                      : 'bg-transparent border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-700'}
                  `}
                >
                  <form onSubmit={addTask} className="relative">
                     <div className="flex items-center px-4 py-3">
                       <div className={`me-3 transition-colors ${isInputFocused ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                          <Plus size={22} strokeWidth={2} />
                       </div>
                       <input 
                         type="text"
                         value={newTaskInput}
                         onChange={(e) => {
                            setNewTaskInput(e.target.value);
                            if (enhancedData) setEnhancedData(null); // Clear enhanced data if user types manually
                         }}
                         onFocus={() => setIsInputFocused(true)}
                         onBlur={() => { if(!newTaskInput) setIsInputFocused(false); }}
                         placeholder={
                            view === ViewType.CALENDAR_DATE 
                            ? `${t.addTaskPlaceholder} ${selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {month:'short', day:'numeric'})}` 
                            : view === ViewType.PROJECT && selectedProjectId
                            ? `${t.addTaskPlaceholder}`
                            : t.addTaskPlaceholder
                         }
                         className="w-full bg-transparent border-none text-[16px] placeholder-gray-400 focus:outline-none font-normal text-charcoal dark:text-gray-100"
                       />
                     </div>
                     
                     {/* Extended Input Actions */}
                     <AnimatePresence>
                     {isInputFocused && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="px-4 pb-3 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"
                       >
                          <div className="flex items-center gap-2 flex-wrap">
                             <button 
                                type="button"
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                             >
                                <Calendar size={12} />
                                {view === ViewType.CALENDAR_DATE ? selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {month: 'short', day: 'numeric'}) : t.today}
                             </button>
                             
                             <div className="relative group">
                               <button 
                                  type="button"
                                  onClick={() => {
                                    const next = selectedPriority === Priority.NONE ? Priority.HIGH : 
                                                 selectedPriority === Priority.HIGH ? Priority.MEDIUM :
                                                 selectedPriority === Priority.MEDIUM ? Priority.LOW : Priority.NONE;
                                    setSelectedPriority(next);
                                  }}
                                  className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded-md transition-all ${getPriorityColor(selectedPriority)}`}
                               >
                                  <Flag size={12} fill={selectedPriority !== Priority.NONE ? "currentColor" : "none"} />
                                  {selectedPriority === Priority.NONE ? t.priority : selectedPriority}
                               </button>
                             </div>
                             
                             {/* AI Assistant Button */}
                             <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                             
                             <button
                                type="button"
                                onClick={handleAiEnhance}
                                disabled={isAiAnalyzing || !newTaskInput.trim()}
                                className={`
                                  flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded-md transition-all
                                  ${enhancedData 
                                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' 
                                    : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800'}
                                `}
                             >
                                {isAiAnalyzing ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} className={enhancedData ? "fill-purple-700 dark:fill-purple-400" : ""} />
                                )}
                                {enhancedData ? t.enhanced : t.aiAssist}
                             </button>
                          </div>
                          
                          <button 
                            type="submit" 
                            disabled={!newTaskInput.trim()}
                            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-800 dark:hover:bg-gray-200 w-full sm:w-auto"
                          >
                            {t.addTaskBtn}
                          </button>
                       </motion.div>
                     )}
                     </AnimatePresence>
                  </form>
                </motion.div>
              )}

              {/* Task List */}
              <div className="flex flex-col gap-1">
                <AnimatePresence mode='popLayout'>
                {getFilteredTasks().length === 0 ? (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="flex flex-col items-center justify-center py-24 text-gray-300 dark:text-gray-600 transition-colors"
                   >
                      {view === ViewType.PROJECT && selectedProjectId ? (
                        <>
                          <FolderOpen size={48} strokeWidth={1} className="mb-4 opacity-50" />
                          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{t.emptyProject}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.startAdding}</p>
                        </>
                      ) : (
                        <>
                          <InboxIcon size={48} strokeWidth={1} className="mb-4 opacity-50" />
                          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                             {view === ViewType.CALENDAR_DATE ? `${t.emptyCalendar} ${selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {month:'short', day:'numeric'})}` : t.emptyInbox}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.enjoyDay}</p>
                        </>
                      )}
                   </motion.div>
                ) : (
                   getFilteredTasks().map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={toggleTask} 
                      onOptimize={handleSmartOptimize}
                      onDelete={deleteTask}
                      onToggleSubtask={toggleSubtask}
                      onAddSubtask={handleAddSubtask}
                      onUpdateNotes={handleUpdateNotes}
                      onAddAttachment={handleAddAttachment}
                      onDeleteAttachment={handleDeleteAttachment}
                      onChat={handleTaskChat}
                      lang={language}
                    />
                   ))
                )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>

      {/* AI Chat Panel (Right Sidebar) */}
      <AiChatPanel 
        isOpen={isMobile ? (isChatOpen && isMobile) : isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        onAddTasks={handleAiTaskCreation}
        onUpdateTask={handleAiTaskUpdate}
        activeTask={chatContextTask}
        isMobile={isMobile}
      />
    </div>
  );
};

export default App;