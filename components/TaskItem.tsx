import React, { useState } from 'react';
import { Check, Sparkles, MoreHorizontal, Trash2, Folder, Calendar, Zap, BrainCircuit, MessageSquareText } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onOptimize: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onChat: (task: Task) => void;
}

const PriorityFlag = ({ priority }: { priority: Priority }) => {
  switch (priority) {
    case Priority.HIGH:
      return <div className="w-1 h-4 rounded-full bg-red-500 absolute left-0 top-1/2 -translate-y-1/2 -ml-[1px]" />;
    case Priority.MEDIUM:
      return <div className="w-1 h-4 rounded-full bg-orange-400 absolute left-0 top-1/2 -translate-y-1/2 -ml-[1px]" />;
    case Priority.LOW:
      return <div className="w-1 h-4 rounded-full bg-blue-400 absolute left-0 top-1/2 -translate-y-1/2 -ml-[1px]" />;
    default:
      return null;
  }
};

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onOptimize,
  onDelete,
  onToggleSubtask,
  onChat
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`
        group relative transition-all duration-200 rounded-lg
        ${isExpanded 
          ? 'bg-white dark:bg-dark-surface shadow-soft dark:shadow-none mb-3 mt-1 z-10 ring-1 ring-gray-100 dark:ring-gray-700' 
          : 'hover:bg-[#FAFAFA] dark:hover:bg-white/5 border-b border-gray-50 dark:border-gray-800 hover:border-transparent dark:hover:border-transparent'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority Indicator */}
      <PriorityFlag priority={task.priority} />

      <div className="flex items-start py-3.5 px-3 gap-3.5">
        {/* Custom Checkbox */}
        <button 
          onClick={(e) => {
             e.stopPropagation();
             onToggle(task.id);
          }}
          className={`
            check-animation mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all duration-200
            ${task.completed 
              ? 'bg-black dark:bg-white border-black dark:border-white' 
              : 'bg-transparent border-gray-300 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-400'}
          `}
        >
          {task.completed && <Check size={10} className="text-white dark:text-black stroke-[3]" />}
        </button>

        {/* Content */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5 w-full">
               <div className="flex items-center gap-2">
                 <h3 className={`text-[15px] font-normal leading-snug transition-colors duration-300 truncate max-w-xl
                    ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-charcoal dark:text-gray-200'}`}>
                   {task.title}
                 </h3>
                 {task.motivation && !task.completed && !isExpanded && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/40 text-[10px] font-medium text-purple-700 dark:text-purple-300">
                      <Zap size={8} className="mr-1 fill-purple-700 dark:fill-purple-300" /> AI Plan
                    </span>
                 )}
               </div>
               
               {/* Task Metadata (Collapsed State) */}
               {!isExpanded && (
                 <div className="flex items-center gap-3 mt-0.5 h-5">
                    {(task.dueDate || task.project || task.subtasks.length > 0) && (
                      <div className="flex items-center gap-3 opacity-60 text-[11px] text-gray-600 dark:text-gray-400">
                         {task.dueDate && (
                            <span className={`flex items-center gap-1 ${task.dueDate < new Date() && !task.completed ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                               <Calendar size={10} />
                               {task.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                         )}
                         {task.subtasks.length > 0 && (
                            <span className="flex items-center gap-1">
                               <div className="w-2.5 h-2.5 border border-gray-400 dark:border-gray-500 rounded-[2px] flex items-center justify-center text-[6px]">{task.subtasks.filter(s=>s.completed).length}</div>
                               <span>{task.subtasks.length}</span>
                            </span>
                         )}
                         {task.project && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                               <Folder size={10} />
                               {task.project}
                            </span>
                         )}
                      </div>
                    )}
                 </div>
               )}
            </div>
            
            {/* Quick Actions */}
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onChat(task);
                }}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="Chat with AI about this task"
              >
                <MessageSquareText size={15} />
              </button>

              {!task.completed && !task.isAiGenerating && task.subtasks.length === 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOptimize(task.id, task.title);
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors tooltip-trigger relative"
                  title="AI Optimize: Add structure, priority & strategy"
                >
                  <Sparkles size={15} />
                </button>
              )}

              {task.isAiGenerating && (
                <div className="p-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-gray-200 dark:border-gray-600 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                </div>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>

              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                 <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
             <div className="mt-4 mb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                
                {/* AI Coach / Motivation Section */}
                {task.motivation && !task.completed && (
                  <div className="mb-4 p-3 rounded-md bg-gradient-to-r from-[#F8FAFC] to-[#F3F4F6] dark:from-[#202020] dark:to-[#252525] border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                     <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm text-purple-600 dark:text-purple-400 mt-0.5">
                       <BrainCircuit size={14} />
                     </div>
                     <div>
                       <p className="text-[10px] uppercase tracking-wider font-bold text-purple-900 dark:text-purple-300 mb-0.5">AI Coach</p>
                       <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">"{task.motivation}"</p>
                     </div>
                  </div>
                )}

                {task.description && (
                  <div className="mb-3 pl-1">
                     <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{task.description}</p>
                  </div>
                )}

                {/* Chat CTA in expanded view */}
                <div className="mb-3 pl-1">
                   <button 
                      onClick={(e) => { e.stopPropagation(); onChat(task); }}
                      className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium transition-colors"
                   >
                      <MessageSquareText size={12} />
                      Ask AI to optimize this task...
                   </button>
                </div>
                
                {/* Subtasks */}
                <div className="space-y-1 pl-1">
                   {task.subtasks.length > 0 && (
                     <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-4">Structure & Plan</p>
                   )}
                   
                   {task.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 py-1.5 group/sub cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, sub.id); }}>
                         <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${sub.completed ? 'bg-gray-400 border-gray-400 dark:bg-gray-600 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 group-hover/sub:border-gray-500 dark:group-hover/sub:border-gray-400'}`}>
                             {sub.completed && <Check size={10} className="text-white" />}
                         </div>
                         <span className={`text-[13px] ${sub.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{sub.title}</span>
                      </div>
                   ))}
                   
                   {/* Add Subtask Placeholder */}
                   <div className="flex items-center gap-3 py-1.5 opacity-50 hover:opacity-100 cursor-text mt-1">
                      <div className="w-3.5 h-3.5 rounded-sm border border-dashed border-gray-400 dark:border-gray-500"></div>
                      <span className="text-[13px] text-gray-400 dark:text-gray-500">Add step...</span>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};