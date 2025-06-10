import { create } from 'zustand';
import { Starter, Feeding, PhotoAnalysis, ChatMessage, CameraAnalysisResult } from '../types';

interface StarterStore {
  starters: Starter[];
  feedings: Feeding[];
  photoAnalyses: PhotoAnalysis[];
  cameraAnalyses: CameraAnalysisResult[];
  chatMessages: ChatMessage[];
  
  // Starter actions
  addStarter: (starter: Omit<Starter, 'id' | 'createdAt'>) => void;
  updateStarter: (id: string, updates: Partial<Starter>) => void;
  deleteStarter: (id: string) => void;
  getStarter: (id: string) => Starter | undefined;
  getStarterById: (id: string) => Starter | undefined;
  
  // Feeding actions
  addFeeding: (feeding: Omit<Feeding, 'id'>) => void;
  getFeedingsForStarter: (starterId: string) => Feeding[];
  
  // Photo analysis actions
  addPhotoAnalysis: (analysis: CameraAnalysisResult) => void;
  getPhotoAnalysesForStarter: (starterId: string) => PhotoAnalysis[];
  getPhotoAnalysis: (id: string) => PhotoAnalysis | undefined;
  getCameraAnalysesForStarter: (starterId: string) => CameraAnalysisResult[];
  
  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id'>) => void;
  getChatMessagesForAnalysis: (analysisId: string) => ChatMessage[];
  
  // Utility actions
  clearAllData: () => void;
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Sample data for the MVP
const sampleStarters: Starter[] = [
  {
    id: '1',
    name: 'Rustic Rye',
    flourType: 'Rye flour',
    hydrationPct: 75,
    defaultRatio: '1:1:1',
    createdAt: new Date('2024-01-01'),
    lastFedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    imageUri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/76db10a609-fd9fa4614d7eed2bcfcf.png',
    healthStatus: 'healthy',
  },
  {
    id: '2',
    name: 'Classic White',
    flourType: 'White flour',
    hydrationPct: 100,
    defaultRatio: '1:2:2',
    createdAt: new Date('2024-01-02'),
    lastFedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    imageUri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4eaa785e8c-cb1d4301da57ba450f5c.png',
    healthStatus: 'attention',
  },
  {
    id: '3',
    name: 'Whole Wheat',
    flourType: 'Whole wheat',
    hydrationPct: 80,
    defaultRatio: '1:1:1',
    createdAt: new Date('2024-01-03'),
    lastFedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    imageUri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b8bda5961f-38b80e9080c02dccab0b.png',
    healthStatus: 'healthy',
  },
];

// Sample feeding data
const sampleFeedings: Feeding[] = [
  {
    id: 'feeding1',
    starterId: '1', // Rustic Rye
    fedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    ratio: '1:1:1',
    starterWeight: 50,
    flourWeight: 50,
    waterWeight: 50,
    tempC: 22,
    notes: 'Regular feeding schedule',
  },
  {
    id: 'feeding2',
    starterId: '1', // Rustic Rye
    fedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    ratio: '1:2:2',
    starterWeight: 25,
    flourWeight: 50,
    waterWeight: 50,
    tempC: 23,
    notes: 'Increased feeding ratio for stronger activity',
  },
];

// Sample photo analysis data
const samplePhotoAnalyses: PhotoAnalysis[] = [
  {
    id: 'analysis1',
    starterId: '1', // Rustic Rye
    takenAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    imageUri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/89fea2d58b-abc4397a905dd264ad81.png',
    jsonResult: {
      healthStatus: 'healthy',
      riseHeight: 95,
      bubbleDensity: 85,
      activityStage: 'Peak stage',
      rating: 4.8,
      nextStep: 'Excellent activity with good bubble formation. Ready for feeding in 2-4 hours.',
      confidence: 0.92,
      notes: 'Perfect fermentation activity detected',
    },
  },
  {
    id: 'analysis2',
    starterId: '1', // Rustic Rye
    takenAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    imageUri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/5d92ad8f35-41a2669bff079c28a36a.png',
    jsonResult: {
      healthStatus: 'attention',
      riseHeight: 65,
      bubbleDensity: 45,
      activityStage: 'Early fermentation stage',
      rating: 3.2,
      nextStep: 'Early fermentation stage • Good progress',
      confidence: 0.78,
      notes: 'Starter showing early activity signs',
    },
  },
];

export const useStarterStore = create<StarterStore>((set, get) => ({
  starters: sampleStarters, // Start with sample data
  feedings: sampleFeedings,
  photoAnalyses: samplePhotoAnalyses,
  cameraAnalyses: [],
  chatMessages: [],
  
  addStarter: (starterData) => {
    const newStarter: Starter = {
      ...starterData,
      id: generateId(),
      createdAt: new Date(),
    };
    set((state) => ({
      starters: [...state.starters, newStarter]
    }));
  },
  
  updateStarter: (id, updates) => {
    set((state) => ({
      starters: state.starters.map((starter) =>
        starter.id === id ? { ...starter, ...updates } : starter
      )
    }));
  },
  
  deleteStarter: (id) => {
    set((state) => ({
      starters: state.starters.filter((starter) => starter.id !== id),
      feedings: state.feedings.filter((feeding) => feeding.starterId !== id),
      photoAnalyses: state.photoAnalyses.filter((analysis) => analysis.starterId !== id),
    }));
  },
  
  getStarter: (id) => {
    return get().starters.find((starter) => starter.id === id);
  },
  
  getStarterById: (id) => {
    return get().starters.find((starter) => starter.id === id);
  },
  
  addFeeding: (feedingData) => {
    const newFeeding: Feeding = {
      ...feedingData,
      id: generateId(),
    };
    set((state) => ({
      feedings: [...state.feedings, newFeeding]
    }));
    
    // Update starter's lastFedAt
    get().updateStarter(feedingData.starterId, { lastFedAt: feedingData.fedAt });
  },
  
  getFeedingsForStarter: (starterId) => {
    return get().feedings.filter((feeding) => feeding.starterId === starterId)
      .sort((a, b) => b.fedAt.getTime() - a.fedAt.getTime());
  },
  
  addPhotoAnalysis: (analysisData) => {
    set((state) => ({
      cameraAnalyses: [...state.cameraAnalyses, analysisData]
    }));
    
    // Update starter's health status based on analysis
    const healthStatus = analysisData.healthScore >= 7 ? 'healthy' : 
                        analysisData.healthScore >= 4 ? 'attention' : 'unhealthy';
    get().updateStarter(analysisData.starterId, { healthStatus });
  },
  
  getPhotoAnalysesForStarter: (starterId) => {
    return get().photoAnalyses.filter((analysis) => analysis.starterId === starterId)
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
  },
  
  getPhotoAnalysis: (id) => {
    return get().photoAnalyses.find((analysis) => analysis.id === id);
  },

  getCameraAnalysesForStarter: (starterId) => {
    return get().cameraAnalyses.filter((analysis) => analysis.starterId === starterId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
  
  addChatMessage: (messageData) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: generateId(),
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage]
    }));
  },
  
  getChatMessagesForAnalysis: (analysisId) => {
    return get().chatMessages.filter((message) => message.analysisId === analysisId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },
  
  clearAllData: () => {
    set({
      starters: [],
      feedings: [],
      photoAnalyses: [],
      cameraAnalyses: [],
      chatMessages: [],
    });
  },
})); 