import { StarterAnalysisResult } from '../services/aiService';

// Comprehensive color directory for starter analysis
export const STARTER_COLOR_MAP: Record<string, string> = {
  // Cream and white tones
  'light-cream': '#FFF8DC',
  'cream': '#F5F5DC',
  'ivory': '#FFFFF0',
  'off-white': '#FAF0E6',
  'creamy-white': '#FDF5E6',
  'pearl': '#F8F6F0',
  
  // Beige and tan tones
  'beige': '#F5F5DC',
  'light-beige': '#F7F3E3',
  'tan': '#D2B48C',
  'light-tan': '#E6D3A3',
  'wheat': '#F5DEB3',
  'bisque': '#FFE4C4',
  
  // Gray tones
  'gray-white': '#F5F5F5',
  'light-gray': '#D3D3D3',
  'gray': '#808080',
  'grayish': '#C0C0C0',
  'dove-gray': '#6D6D6D',
  
  // Yellow tones (healthy fermentation)
  'pale-yellow': '#FFFFE0',
  'light-yellow': '#FFFF99',
  'golden': '#FFD700',
  'straw': '#E4D96F',
  
  // Brown tones (whole grain starters)
  'light-brown': '#CD853F',
  'brown': '#A0522D',
  'wheat-brown': '#D2691E',
  'caramel': '#C77B3C',
  
  // Warning colors (concerning signs)
  'pink-tinted': '#FFB6C1',
  'orange-tinted': '#FFE4B5',
  'greenish': '#90EE90',
  'bluish': '#ADD8E6',
  'moldy-green': '#228B22',
  
  // Healthy activity colors
  'uniform': '#F5F5DC',
  'consistent': '#FFF8DC',
  'natural': '#FAF0E6',
};

// Activity stage configurations
export const ACTIVITY_STAGE_CONFIG = {
  'lag': {
    position: 0,
    color: '#6B7280', // Gray
    label: 'Lag Phase',
    description: 'Starter is adapting, minimal visible activity'
  },
  'early-growth': {
    position: 1,
    color: '#F59E0B', // Yellow
    label: 'Early Growth',
    description: 'Initial fermentation activity beginning'
  },
  'peak': {
    position: 2,
    color: '#10B981', // Green
    label: 'Peak Activity',
    description: 'Maximum fermentation and rise'
  },
  'late-decline': {
    position: 3,
    color: '#EF4444', // Red
    label: 'Late Decline',
    description: 'Past peak, beginning to settle'
  },
  'dormant': {
    position: 4,
    color: '#374151', // Dark gray
    label: 'Dormant',
    description: 'Minimal activity, needs feeding'
  }
};

// Health status mapping
export const HEALTH_STATUS_MAP = {
  5: { 
    text: "Excellent Health", 
    color: "#10B981", 
    chip: "Peak Activity",
    chipColor: "#10B981"
  },
  4: { 
    text: "Very Good Health", 
    color: "#059669", 
    chip: "Active",
    chipColor: "#059669"
  },
  3: { 
    text: "Good Health", 
    color: "#F59E0B", 
    chip: "Moderate Activity",
    chipColor: "#F59E0B"
  },
  2: { 
    text: "Needs Attention", 
    color: "#EF4444", 
    chip: "Low Activity",
    chipColor: "#EF4444"
  },
  1: { 
    text: "Needs Care", 
    color: "#DC2626", 
    chip: "Critical",
    chipColor: "#DC2626"
  }
};

// Parse color descriptions from AI response
export const parseStarterColors = (colorNotes: string): string[] => {
  const colors: string[] = [];
  const lowercaseNotes = colorNotes.toLowerCase();
  
  // Extract color keywords and map to hex values
  Object.keys(STARTER_COLOR_MAP).forEach(colorKey => {
    if (lowercaseNotes.includes(colorKey)) {
      colors.push(STARTER_COLOR_MAP[colorKey]);
    }
  });
  
  // Fallback colors if no matches found
  if (colors.length === 0) {
    colors.push('#FFF8DC', '#F5F5DC'); // Default cream colors
  }
  
  // Ensure we have at least 2-3 colors for variety
  while (colors.length < 3 && colors.length < Object.keys(STARTER_COLOR_MAP).length) {
    if (!colors.includes('#F5F5DC')) colors.push('#F5F5DC');
    if (!colors.includes('#FAF0E6')) colors.push('#FAF0E6');
    if (!colors.includes('#E6D3A3')) colors.push('#E6D3A3');
    break;
  }
  
  return colors.slice(0, 3); // Return max 3 colors
};

// Generate bubble pattern based on density score
export const generateBubblePattern = (densityScore: number) => {
  const score = parseInt(densityScore.toString());
  
  if (score <= 3) {
    return {
      count: 3,
      sizes: [8, 6, 4],
      pattern: 'sparse',
      description: 'Few scattered bubbles'
    };
  } else if (score <= 6) {
    return {
      count: 6,
      sizes: [10, 8, 6, 8, 5, 7],
      pattern: 'moderate',
      description: 'Moderate bubble formation'
    };
  } else {
    return {
      count: 8,
      sizes: [12, 8, 10, 6, 9, 7, 5, 8],
      pattern: 'dense',
      description: 'High bubble density'
    };
  }
};

// Generate rise height chart data
export const generateRiseChartData = (riseScore: number, description: string) => {
  const score = parseInt(riseScore.toString());
  const baseHeight = 10;
  
  // Parse description for additional context
  const hasDoubled = description.toLowerCase().includes('doubled');
  const hasTripled = description.toLowerCase().includes('tripled');
  const minimal = description.toLowerCase().includes('minimal') || description.toLowerCase().includes('slight');
  
  let multiplier = score / 10;
  if (hasTripled) multiplier = Math.max(multiplier, 0.9);
  if (hasDoubled) multiplier = Math.max(multiplier, 0.7);
  if (minimal) multiplier = Math.min(multiplier, 0.3);
  
  return [
    baseHeight * 0.3,
    baseHeight * 0.5,
    baseHeight * 0.4,
    baseHeight * multiplier,
    baseHeight * (multiplier * 0.9)
  ];
};

// Parse activity stage from AI response
export const parseActivityStage = (activityStage: string) => {
  const stage = activityStage.toLowerCase().replace(/[^a-z-]/g, '');
  
  // Map variations to standard stages
  const stageMap: Record<string, keyof typeof ACTIVITY_STAGE_CONFIG> = {
    'lag': 'lag',
    'lagphase': 'lag',
    'early': 'early-growth',
    'earlygrowth': 'early-growth',
    'growth': 'early-growth',
    'peak': 'peak',
    'peakactivity': 'peak',
    'maximum': 'peak',
    'decline': 'late-decline',
    'latedecline': 'late-decline',
    'falling': 'late-decline',
    'dormant': 'dormant',
    'inactive': 'dormant',
    'spent': 'dormant'
  };
  
  return stageMap[stage] || 'peak'; // Default to peak if unknown
};

// Get health status configuration
export const getHealthStatus = (rating: number | string) => {
  const numRating = parseInt(rating.toString());
  return HEALTH_STATUS_MAP[numRating as keyof typeof HEALTH_STATUS_MAP] || HEALTH_STATUS_MAP[3];
};

// Parse confidence percentage
export const parseConfidence = (confidencePct: string | number | undefined): number => {
  if (!confidencePct) return 75; // Default if undefined
  
  const strValue = confidencePct.toString();
  const match = strValue.match(/(\d+)/);
  return match ? parseInt(match[1]) : 75; // Default to 75% if parsing fails
};

// Convert AI analysis result to UI-friendly format
export const convertAIAnalysisToUI = (aiAnalysis: any) => {
  const activityStage = parseActivityStage(aiAnalysis.activity_stage || 'peak');
  const healthStatus = getHealthStatus(aiAnalysis.health_rating || '3');
  const colors = parseStarterColors(aiAnalysis.color_notes || 'light-cream');
  const bubblePattern = generateBubblePattern(parseInt(aiAnalysis.bubble_density_score || '5'));
  const riseData = generateRiseChartData(
    parseInt(aiAnalysis.rise_height_score || '5'), 
    aiAnalysis.rise_height || 'Moderate rise activity'
  );
  
  return {
    // Health status
    healthStatus,
    rating: parseInt(aiAnalysis.health_rating),
    
    // Activity stage
    activityStage: ACTIVITY_STAGE_CONFIG[activityStage],
    
    // Visual elements
    colors,
    bubblePattern,
    riseData,
    
    // Confidence
    confidence: parseConfidence(aiAnalysis.confidence_pct),
    
    // Scores
    riseScore: parseInt(aiAnalysis.rise_height_score || '5'),
    bubbleScore: parseInt(aiAnalysis.bubble_density_score || '5'),
    
    // Text descriptions
    riseDescription: aiAnalysis.rise_height,
    bubbleDescription: aiAnalysis.bubble_density,
    surfaceDescription: aiAnalysis.surface_texture,
    colorDescription: aiAnalysis.color_notes,
    recommendation: aiAnalysis.recommended_next_step,
    rationale: aiAnalysis.rationale
  };
}; 