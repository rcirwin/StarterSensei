export interface Starter {
  id: string;
  name: string;
  flourType: string;
  hydrationPct: number;
  defaultRatio: string;
  createdAt: Date;
  lastFedAt?: Date;
  imageUri?: string;
  healthStatus: 'healthy' | 'attention' | 'unhealthy';
}

export interface Feeding {
  id: string;
  starterId: string;
  fedAt: Date;
  ratio: string;
  starterWeight: number;
  flourWeight: number;
  waterWeight: number;
  tempC: number;
  notes?: string;
}

export interface PhotoAnalysis {
  id: string;
  starterId: string;
  takenAt: Date;
  imageUri: string;
  jsonResult: AnalysisResult;
}

export interface AnalysisResult {
  healthStatus: 'healthy' | 'attention' | 'unhealthy';
  riseHeight: number;
  bubbleDensity: number;
  activityStage: string;
  rating: number;
  nextStep: string;
  confidence: number;
  notes?: string;
}

export interface CameraAnalysisResult {
  id: string;
  starterId: string;
  photoUri: string;
  timestamp: Date;
  healthScore: number;
  riseActivity: string;
  bubbleFormation: string;
  fermentationStage: string;
  recommendations: string[];
  context: {
    timeSinceFeed: string;
    lastFeedRatio: string;
    flourType: string;
    roomTemp: number;
    goal: string;
  };
}

export interface ChatMessage {
  id: string;
  analysisId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type RootStackParamList = {
  StarterList: undefined;
  StarterDetail: { starterId: string };
  AddStarter: undefined;
  EditStarter: { starterId: string };
  CameraCapture: { starterId: string };
  PhotoAnalysisDetail: { starterId: string; analysisId: string };
  Chat: { starterId: string; analysisId?: string };
};

export type BottomTabParamList = {
  Starters: undefined;
  Settings: undefined;
}; 