import AsyncStorage from '@react-native-async-storage/async-storage';

// Model configurations
const IMAGE_ANALYSIS_MODEL = 'o3-2025-04-16';
const CHAT_MODEL = 'gpt-4o-2024-11-20';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface AnalysisContext {
  timeSinceFeed: string;
  lastFeedRatio: string;
  flourType: string;
  roomTemp: number;
  goal: string;
}

export interface StarterAnalysisResult {
  rise_height: string;
  rise_height_score: string;
  bubble_density: string;
  bubble_density_score: string;
  surface_texture: string;
  color_notes: string;
  activity_stage: string;
  health_rating: string;
  recommended_next_step: string;
  confidence_pct: string;
  rationale: string;
}

class AIService {
  private async getApiKey(): Promise<string> {
    const apiKey = await AsyncStorage.getItem('dev_api_key');
    if (!apiKey) {
      throw new Error('No API key found. Please set your OpenAI API key in Settings.');
    }
    return apiKey;
  }

  private createDiagnosticPrompt(context: AnalysisContext): string {
    const { timeSinceFeed, lastFeedRatio, flourType, roomTemp, goal } = context;
    
    // Convert goal to readable format
    const goalMap = {
      'baking': 'Bake this weekend',
      'maintenance': 'Regular maintenance',
      'troubleshoot': 'Troubleshoot issues',
      'revive': 'Revive dormant starter'
    };
    
    return `You are "Starter-Sensei," a master sourdough coach with 20 years of hands-on baking and fermentation troubleshooting.

**Task**: Diagnose the health and stage of a sourdough starter from ONE photo and the context provided. Then give specific next-step instructions. **Look out for any pink or orange tint/streak—this is a sure sign the starter has gone bad and must be discarded.**

**Instructions**
1. Inspect the photo for: rise height (relative to jar markings), bubble size & density, surface texture, color layers, presence of hooch, and sidewall residue.
2. Combine that with the context (time since last feed, feed ratio, flour type, current room temp).
3. Determine the starter's current fermentation stage (lag, early growth, peak, late decline).
4. Rate overall health on a 1-5 scale (5 = vibrant, 1 = needs rescue).
5. Recommend the *single best* next step (e.g., feed ratio, temperature adjustment, discard amount) to keep it on track for baking within 12–24 h.
6. Provide a confidence score (0-100 %) and a one-sentence rationale.

**Context**
– Time since last feed: ${timeSinceFeed}
– Last feed ratio & flour: ${lastFeedRatio} (${flourType})
– Current room temp: ${Math.round((roomTemp - 32) * 5/9)}°C (${roomTemp}°F)
– Goal: ${goalMap[goal as keyof typeof goalMap] || goal}

Respond in this JSON format so it's easy to parse:
{
  "rise_height": "detailed description of rise activity",
  "rise_height_score": "numeric score 1-10",
  "bubble_density": "detailed description of bubble formation",
  "bubble_density_score": "numeric score 1-10",
  "surface_texture": "detailed surface analysis",
  "color_notes": "specific color descriptions (e.g. light-cream, beige, gray-white)",
  "activity_stage": "one of: lag, early-growth, peak, late-decline, dormant",
  "health_rating": "numeric rating 1-5",
  "recommended_next_step": "specific actionable recommendation",
  "confidence_pct": "confidence percentage 0-100",
  "rationale": "one sentence explanation of assessment"
}`;
  }

  async analyzeStarterImage(imageUri: string, context: AnalysisContext): Promise<StarterAnalysisResult> {
    try {
      const apiKey = await this.getApiKey();
      
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: IMAGE_ANALYSIS_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: this.createDiagnosticPrompt(context)
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 1000
          // Note: o3 model only supports default temperature (1), no temperature parameter allowed
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        return result as StarterAnalysisResult;
      } catch (parseError) {
        console.error('Failed to parse analysis result:', parseError);
        throw new Error('Failed to parse analysis result from AI');
      }

    } catch (error) {
      console.error('Error analyzing starter image:', error);
      throw error;
    }
  }

  async sendChatMessage(message: string, context?: string): Promise<string> {
    try {
      const apiKey = await this.getApiKey();
      
      const systemPrompt = `You are "Starter-Sensei," a master sourdough coach with 20 years of hands-on baking and fermentation troubleshooting. You help users with questions about their sourdough starters, providing practical, actionable advice based on your expertise.

${context ? `Context from recent analysis: ${context}` : ''}

Keep your responses helpful, conversational, and focused on practical sourdough guidance.`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_completion_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return content;

    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we need to read the file and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }
}

export const aiService = new AIService(); 