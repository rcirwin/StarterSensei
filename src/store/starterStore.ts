import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  initializeWithSampleData: () => void;
  fixDateObjects: () => void;
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

// Date serialization helpers
const serializeDate = (obj: any): any => {
  if (obj instanceof Date) {
    return { __isDate: true, value: obj.toISOString() };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDate);
  }
  if (obj && typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDate(value);
    }
    return serialized;
  }
  return obj;
};

const deserializeDate = (obj: any): any => {
  if (obj && typeof obj === 'object' && obj.__isDate) {
    return new Date(obj.value);
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeDate);
  }
  if (obj && typeof obj === 'object') {
    const deserialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      deserialized[key] = deserializeDate(value);
    }
    return deserialized;
  }
  return obj;
};

export const useStarterStore = create<StarterStore>()(
  persist(
    (set, get) => ({
      starters: [],
      feedings: [],
      photoAnalyses: [],
      cameraAnalyses: [],
      chatMessages: [],
  
  addStarter: (starterData) => {
    const newStarter: Starter = {
      ...starterData,
      id: generateId(),
      createdAt: new Date(),
      lastFedAt: starterData.lastFedAt || new Date(),
    };
    set((state) => ({
      starters: [...state.starters, newStarter]
    }));
    console.log('Added starter:', newStarter.name, 'Total starters:', get().starters.length);
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
      fedAt: new Date(feedingData.fedAt), // Ensure it's a proper Date object
    };
    set((state) => ({
      feedings: [...state.feedings, newFeeding]
    }));
    
    // Update starter's lastFedAt
    get().updateStarter(feedingData.starterId, { lastFedAt: newFeeding.fedAt });
    console.log('Added feeding for starter:', feedingData.starterId, 'Total feedings:', get().feedings.length);
  },
  
  getFeedingsForStarter: (starterId) => {
    return get().feedings.filter((feeding) => feeding.starterId === starterId)
      .sort((a, b) => b.fedAt.getTime() - a.fedAt.getTime());
  },
  
  addPhotoAnalysis: (analysisData) => {
    const analysisWithDate = {
      ...analysisData,
      timestamp: new Date(analysisData.timestamp), // Ensure it's a proper Date object
    };
    
    set((state) => ({
      cameraAnalyses: [...state.cameraAnalyses, analysisWithDate]
    }));
    
    // Update starter's health status based on analysis
    const healthStatus = analysisData.healthScore >= 7 ? 'healthy' : 
                        analysisData.healthScore >= 4 ? 'attention' : 'unhealthy';
    get().updateStarter(analysisData.starterId, { healthStatus });
    console.log('Added photo analysis for starter:', analysisData.starterId, 'Health score:', analysisData.healthScore, 'Total analyses:', get().cameraAnalyses.length);
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

  // Initialize with sample data if store is empty
  initializeWithSampleData: () => {
    const currentState = get();
    if (currentState.starters.length === 0) {
      set({
        starters: sampleStarters,
        feedings: sampleFeedings,
        photoAnalyses: samplePhotoAnalyses,
      });
    }
  },

  // Fix any Date objects that might be strings after loading from storage
  fixDateObjects: () => {
    const state = get();
    
    const fixedStarters = state.starters.map(starter => ({
      ...starter,
      createdAt: typeof starter.createdAt === 'string' ? new Date(starter.createdAt) : starter.createdAt,
      lastFedAt: starter.lastFedAt && typeof starter.lastFedAt === 'string' ? new Date(starter.lastFedAt) : starter.lastFedAt,
    }));
    
    const fixedFeedings = state.feedings.map(feeding => ({
      ...feeding,
      fedAt: typeof feeding.fedAt === 'string' ? new Date(feeding.fedAt) : feeding.fedAt,
    }));
    
    const fixedPhotoAnalyses = state.photoAnalyses.map(analysis => ({
      ...analysis,
      takenAt: typeof analysis.takenAt === 'string' ? new Date(analysis.takenAt) : analysis.takenAt,
    }));
    
    const fixedCameraAnalyses = state.cameraAnalyses.map(analysis => ({
      ...analysis,
      timestamp: typeof analysis.timestamp === 'string' ? new Date(analysis.timestamp) : analysis.timestamp,
    }));
    
    set({
      starters: fixedStarters,
      feedings: fixedFeedings,
      photoAnalyses: fixedPhotoAnalyses,
      cameraAnalyses: fixedCameraAnalyses,
    });
  },
}),
{
  name: 'starter-storage',
  storage: createJSONStorage(() => AsyncStorage),
}
)
);