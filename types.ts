
export enum Priority {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  project?: string; // Stores the Project ID
  subtasks: Subtask[];
  priority: Priority;
  isAiGenerating?: boolean;
  motivation?: string; // AI Coach message
  notes?: string;
  attachments?: Attachment[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export enum ViewType {
  INBOX = 'Inbox',
  TODAY = 'Today',
  UPCOMING = 'Upcoming',
  COMPLETED = 'Completed',
  CALENDAR_DATE = 'CalendarDate',
  PROJECT = 'Project',
  SETTINGS = 'Settings'
}

export interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  count?: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Define loose types for Gemini Tool Interactions to avoid strict type dependency issues in components
export interface FunctionCallPart {
  name: string;
  args: any;
}

export interface ToolCall {
  functionCalls: FunctionCallPart[];
}

export type Language = 'en' | 'ar';
