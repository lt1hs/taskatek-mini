import React, { useState } from 'react';
import { 
  Inbox, 
  Calendar as CalendarIcon, 
  Layers, 
  CheckCircle2, 
  Settings, 
  Search,
  Plus,
  PanelLeftClose,
  PanelRightClose,
  Folder,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Languages,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewType, NavItem, Project, Language, UserProfile } from '../types';
import { translations } from '../translations';

// --- Internal Calendar Widget ---
interface CalendarWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  taskCounts: Record<string, number>; // Key is date.toDateString()
  lang: Language;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onSelectDate, taskCounts, lang }) => {
  // State to track which month is being viewed, independent of selected date
  const [viewDate, setViewDate] = useState(new Date());

  // Format month based on language
  const currentMonth = viewDate.toLocaleString(lang === 'ar' ? 'ar-SA' : 'default', { month: 'long' });
  const currentYear = viewDate.toLocaleString(lang === 'ar' ? 'ar-SA' : 'default', { year: 'numeric' });

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // Calendar Grid Generation
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const days = [];
  
  // Empty slots for padding
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-7 h-7" />);
  }
  
  // Actual Days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
    
    // Zero out time for comparison
    const isSelected = 
      date.getDate() === selectedDate.getDate() && 
      date.getMonth() === selectedDate.getMonth() && 
      date.getFullYear() === selectedDate.getFullYear();
      
    const isToday = 
      date.getDate() === new Date().getDate() && 
      date.getMonth() === new Date().getMonth() && 
      date.getFullYear() === new Date().getFullYear();

    const taskCount = taskCounts[date.toDateString()] || 0;
    const dayNumber = lang === 'ar' ? i.toLocaleString('ar-SA') : i;
    const taskCountDisplay = lang === 'ar' ? taskCount.toLocaleString('ar-SA') : taskCount;

    days.push(
      <button 
        key={i} 
        onClick={() => onSelectDate(date)}
        className={`relative w-7 h-8 flex flex-col items-center justify-start pt-1 rounded-md cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-black dark:bg-white shadow-sm' 
            : isToday 
              ? 'bg-gray-200 dark:bg-gray-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
        `}
      >
        <span className={`text-[10px] leading-none ${isSelected ? 'text-white dark:text-black font-bold' : isToday ? 'text-black dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
          {dayNumber}
        </span>
        
        {/* Task Count Indicator */}
        {taskCount > 0 && (
           <span className={`mt-1 text-[8px] font-bold leading-none ${isSelected ? 'text-white/80 dark:text-black/80' : 'text-purple-600 dark:text-purple-400'}`}>
             {taskCountDisplay}
           </span>
        )}
      </button>
    );
  }

  const weekDays = lang === 'ar' 
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] 
    : ['S','M','T','W','T','F','S'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pb-8 pt-2"
    >
      <div className="flex items-center justify-between mb-4 pl-1 rtl:pr-1">
        <span className="text-xs font-semibold text-charcoal dark:text-gray-200 tracking-wide">{currentMonth} {currentYear}</span>
        <div className="flex items-center gap-1">
           <button onClick={lang === 'ar' ? nextMonth : prevMonth} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors">
             {lang === 'ar' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
           </button>
           <button onClick={lang === 'ar' ? prevMonth : nextMonth} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors">
             {lang === 'ar' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
           </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 place-items-center dir-ltr">
        {weekDays.map((d, i) => (
          <span key={i} className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 mb-1">{d}</span>
        ))}
        {days}
      </div>
    </motion.div>
  );
};

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  taskCounts: Record<ViewType, number>;
  projectTaskCounts: Record<string, number>;
  calendarTaskCounts: Record<string, number>;
  isCompact: boolean;
  onToggleCompact: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  // Project Props
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  // Language
  lang: Language;
  onToggleLang: () => void;
  // User Profile
  userProfile: UserProfile;
  // Mobile
  isMobile?: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  taskCounts, 
  projectTaskCounts,
  calendarTaskCounts,
  isCompact, 
  onToggleCompact,
  isDarkMode,
  onToggleTheme,
  selectedDate,
  onSelectDate,
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  lang,
  onToggleLang,
  userProfile,
  isMobile = false,
  isOpen = true,
  onCloseMobile
}) => {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const t = translations[lang];

  const navItems: NavItem[] = [
    { id: ViewType.INBOX, label: t.inbox, icon: Inbox, count: taskCounts[ViewType.INBOX] },
    { id: ViewType.TODAY, label: t.today, icon: CalendarIcon, count: taskCounts[ViewType.TODAY] },
    { id: ViewType.UPCOMING, label: t.upcoming, icon: Layers, count: taskCounts[ViewType.UPCOMING] },
    { id: ViewType.COMPLETED, label: t.completed, icon: CheckCircle2 },
  ];

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  const handleViewChange = (id: ViewType) => {
    onChangeView(id);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  // Determine dynamic styles based on mobile state
  // Use h-[100dvh] for mobile to handle dynamic viewport height (address bar etc)
  const sidebarClasses = isMobile
    ? `fixed inset-0 w-full z-50 bg-[#FAFAFA] dark:bg-[#121212] transition-transform duration-300 flex flex-col h-[100dvh] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `h-full bg-[#FAFAFA] dark:bg-[#121212] flex flex-col border-e border-gray-200 dark:border-dark-border fixed start-0 top-0 z-30 transition-all duration-300 ease-in-out ${isCompact ? 'w-[80px] items-center' : 'w-[280px]'}`;

  // On mobile, we don't use the 'isCompact' logic for internal layout, we assume expanded view but full width
  const showExpanded = isMobile || !isCompact;

  return (
    <>
      {/* Backdrop for mobile - optional if we want the sidebar to feel like a sheet, but full screen was requested. 
          Adding a subtle shadow/overlay effect anyway for depth if it slides over */}
      
      <aside className={sidebarClasses}>
        {/* User Profile / Toggle Header */}
        <div className={`
          flex items-center pt-6 mb-2 transition-all duration-300
          ${!showExpanded ? 'flex-col gap-4 px-0 pb-4' : 'justify-between px-5 pb-0'}
        `}>
          <div 
            className="flex items-center gap-3 cursor-pointer group relative" 
            onClick={() => handleViewChange(ViewType.SETTINGS)}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-charcoal dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-soft overflow-hidden"
            >
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                userProfile.initials
              )}
            </motion.div>
            
            {/* Full Profile Info (Expanded Only) */}
            <div className={`overflow-hidden transition-all duration-300 ${!showExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
               <span className="text-[13px] font-semibold text-charcoal dark:text-gray-200 group-hover:text-black dark:group-hover:text-white whitespace-nowrap">
                 {userProfile.name}
               </span>
            </div>
          </div>

          {/* Sidebar Toggle Button (Desktop) or Close Button (Mobile) */}
          {isMobile ? (
            <button 
              onClick={onCloseMobile}
              className="p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95"
            >
              <X size={24} />
            </button>
          ) : (
            <button 
              onClick={onToggleCompact}
              className={`
                text-gray-400 hover:text-black dark:hover:text-white transition-colors
                ${!showExpanded ? 'mt-2' : ''}
              `}
              title={isCompact ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCompact ? (lang === 'ar' ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />) : (lang === 'ar' ? <PanelLeftClose size={18} /> : <PanelRightClose size={18} />)}
            </button>
          )}
        </div>
        
        {/* Expanded: Settings Icon next to profile */}
        {showExpanded && (
            <div className="px-5 mb-4 relative">
               {/* Placeholder for spacing if needed */}
            </div>
        )}

        {/* Navigation */}
        <div className="mb-2 w-full flex flex-col gap-1">
            {navItems.map((item, i) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleViewChange(item.id)}
                  className={`
                    group relative flex items-center transition-all duration-200
                    ${!showExpanded 
                      ? 'justify-center w-[44px] h-[44px] mx-auto rounded-xl' 
                      : 'w-full px-5 py-3'} 
                    ${isActive 
                      ? (!showExpanded ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-[#F0F0F0] dark:bg-white/10 text-black dark:text-white font-medium') 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}
                  `}
                  title={!showExpanded ? item.label : undefined}
                >
                  {/* Expanded: Active Indicator Bar */}
                  {showExpanded && isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute start-0 top-0 bottom-0 w-[3px] bg-black dark:bg-white" 
                    />
                  )}
                  
                  <Icon 
                    size={!showExpanded ? 20 : 20} 
                    className={`
                      transition-all duration-200
                      ${showExpanded && 'me-3'} 
                      ${isActive ? (!showExpanded ? 'text-white dark:text-black' : 'opacity-100 text-black dark:text-white') : 'opacity-70 group-hover:opacity-100'}
                    `} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* Label (Expanded Only) */}
                  <span className={`flex-1 text-start whitespace-nowrap overflow-hidden transition-all duration-200 ${!showExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 text-base'}`}>
                    {item.label}
                  </span>
                  
                  {/* Count */}
                  {item.count && item.count > 0 && (
                     <span className={`
                       text-xs transition-all duration-200
                       ${!showExpanded 
                          ? 'absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#FAFAFA] dark:border-gray-800' 
                          : (isActive ? 'font-bold text-black dark:text-white' : 'text-gray-400')}
                     `}>
                       {lang === 'ar' ? item.count.toLocaleString('ar-SA') : item.count}
                     </span>
                  )}
                </motion.button>
              );
            })}
        </div>

        {/* Calendar Widget (Expanded Only) */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${!showExpanded ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100'}`}>
           <CalendarWidget selectedDate={selectedDate} onSelectDate={(d) => { onSelectDate(d); if(isMobile && onCloseMobile) onCloseMobile(); }} taskCounts={calendarTaskCounts} lang={lang} />
        </div>
        
        {/* Divider for compact mode */}
        {!showExpanded && <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800 my-2"></div>}

        {/* Projects Section */}
        <div className={`mt-2 w-full ${!showExpanded ? 'px-0 flex flex-col items-center gap-2' : 'px-5'}`}>
          
          {showExpanded ? (
            // Expanded Projects View
            <>
              <div className="flex items-center justify-between mb-1 group cursor-pointer">
                <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors uppercase tracking-wider">{t.projects}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreatingProject(true);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Plus size={14} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </button>
              </div>
              
              {/* New Project Input */}
              {isCreatingProject && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  onSubmit={handleCreateProjectSubmit} 
                  className="mb-2"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onBlur={() => { if(!newProjectName) setIsCreatingProject(false); }}
                    placeholder={`${t.projects}...`}
                    className="w-full text-[13px] px-2 py-1.5 bg-white dark:bg-white/10 border border-purple-300 dark:border-purple-700 rounded focus:outline-none text-charcoal dark:text-white placeholder-gray-400"
                  />
                </motion.form>
              )}

              <div className="flex flex-col gap-1">
                {projects.map(p => {
                  const isActive = currentView === ViewType.PROJECT && selectedProjectId === p.id;
                  const count = projectTaskCounts[p.id] || 0;
                  
                  return (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        onSelectProject(p.id);
                        if(isMobile && onCloseMobile) onCloseMobile();
                      }}
                      className={`
                        flex items-center gap-3 py-2 px-2 rounded transition-colors text-[13px] group relative
                        ${isActive ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.color} opacity-80 group-hover:opacity-100`}></span>
                      <span className="truncate flex-1 text-start">{p.name}</span>
                      
                      {count > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                          {lang === 'ar' ? count.toLocaleString('ar-SA') : count}
                        </span>
                      )}
                      
                      {/* Delete Action (Hover Only) */}
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-red-500 transition-all"
                        title="Delete Project"
                      >
                         <Trash2 size={12} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            // Compact Projects View (Colored Dots)
            <>
               {/* Header Icon */}
               <div className="mb-2 text-gray-300 dark:text-gray-600">
                 <Folder size={14} />
               </div>

               {projects.map(p => {
                 const count = projectTaskCounts[p.id] || 0;
                 return (
                   <button 
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all group relative"
                   >
                      <div className={`w-2.5 h-2.5 rounded-full ${p.color}`}></div>
                      <div className={`absolute ${lang === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 flex items-center gap-2`}>
                         {p.name}
                         {count > 0 && <span className="opacity-70 font-mono">({count})</span>}
                      </div>
                   </button>
                 );
               })}
               
               {/* Add Project (Compact) */}
               <button 
                 onClick={() => onToggleCompact()} 
                 className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all"
                 title="Expand to add project"
               >
                 <Plus size={14} />
               </button>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className={`mt-auto p-5 w-full ${!showExpanded ? 'px-2 space-y-3' : 'space-y-1'}`}>
           
           {/* Search Button */}
           <button className={`
              flex items-center transition-colors w-full rounded-lg group relative
              ${!showExpanded 
                 ? 'justify-center w-[44px] h-[44px] mx-auto text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white' 
                 : 'gap-3 py-2 px-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
           `}>
              <Search size={18} />
              {showExpanded && (
                <>
                  <span className="text-sm font-medium">{t.search}</span>
                  <span className="ms-auto text-[10px] font-mono bg-gray-200 dark:bg-gray-700 px-1.5 rounded text-gray-500 dark:text-gray-400">Cmd K</span>
                </>
              )}
              
              {!showExpanded && (
                 <div className={`absolute ${lang === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                    {t.search}
                 </div>
              )}
           </button>

           {/* Theme Toggle */}
           <button 
              onClick={onToggleTheme}
              className={`
                flex items-center transition-colors w-full rounded-lg group relative
                ${!showExpanded 
                  ? 'justify-center w-[44px] h-[44px] mx-auto text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white' 
                  : 'gap-3 py-2 px-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
              `}
           >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             {showExpanded && <span className="text-sm font-medium">{isDarkMode ? t.lightMode : t.darkMode}</span>}

             {!showExpanded && (
                 <div className={`absolute ${lang === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                    {isDarkMode ? t.lightMode : t.darkMode}
                 </div>
              )}
           </button>

           {/* Language Toggle */}
           <button 
              onClick={onToggleLang}
              className={`
                flex items-center transition-colors w-full rounded-lg group relative
                ${!showExpanded 
                  ? 'justify-center w-[44px] h-[44px] mx-auto text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white' 
                  : 'gap-3 py-2 px-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
              `}
           >
             <Languages size={18} />
             {showExpanded && <span className="text-sm font-medium">{lang === 'en' ? 'Arabic' : 'English'}</span>}

             {!showExpanded && (
                 <div className={`absolute ${lang === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                    {lang === 'en' ? 'Arabic' : 'English'}
                 </div>
              )}
           </button>

           {/* Settings */}
           {!showExpanded && (
              <button 
                onClick={() => handleViewChange(ViewType.SETTINGS)}
                className="flex items-center justify-center w-[44px] h-[44px] mx-auto text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white rounded-lg group relative"
              >
                <Settings size={18} />
                 <div className={`absolute ${lang === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                    {t.settings}
                 </div>
              </button>
           )}
        </div>
      </aside>
    </>
  );
};