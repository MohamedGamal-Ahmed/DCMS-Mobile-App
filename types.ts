
export type Category = 'Inbound' | 'Outbound' | 'General';

export interface Correspondence {
  id: number;
  subject: string;
  date: string;
  status: string;
  referenceNumber: string;
  responsibleEngineer?: string;
  description?: string;
  originalAttachmentUrl?: string;
  replyAttachmentUrl?: string;
  category?: Category;
  reply?: string;
  pdfUrl?: string; // Kept for backward compatibility
  attachments?: { title: string; url: string; type: 'original' | 'reply' | 'other' }[];
}

export interface Meeting {
  id: number;
  title: string;
  time: string;
  date?: string;
  startTime?: Date | string;
  location: string;
  participants: number;
  platform: string;
  status: string;
  // Is this an online meeting?
  isOnline?: boolean;
  // Meeting join link
  meetingLink?: string;
  // Keep old fields for compatibility
  attendees?: number;
}

export interface User {
  id: number;
  name: string;
  username?: string;
  role: string;
}

export interface Stats {
  meetingsToday: number;
  pendingIssues: number;
  completedReports: number;
}

export interface ApiResponse {
  user: User;
  correspondences: Correspondence[];
  meetings: Meeting[];
  stats: Stats;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
}
