export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export type View = 'home' | 'auth' | 'quiz' | 'results' | 'dashboard' | 'directory' | 'profile' | 'blog' | 'about' | 'skillQuiz';

export interface UserProfile {
  fullName: string;
  username: string;
  education: string;
  country: string;
  currentRole?: string;
  interests?: string;
  careerPlan?: string;
  matchedJobId?: string | null;
  milestones: Record<string, boolean>;
  cvLink?: string;
  socialLinks?: { platform: string; url: string }[];
  documents?: { title: string; url: string }[];
  points?: number;
  badges?: string[];
  quizResults?: Record<string, number>;
  profileImage?: string;
}

export interface Todo {
  id: string;
  text: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  createdAt: any;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  date?: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
