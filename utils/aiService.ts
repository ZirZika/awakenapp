import axios from 'axios';
import { JournalEntry, Goal, CoreValue, Task } from '@/types/app';
import { config } from './config';

interface QuestGenerationContext {
  journalEntries: JournalEntry[];
  goals: Goal[];
  coreValues: CoreValue[];
  completedTasks: Task[];
  userLevel: number;
}

interface GeneratedQuest {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  xpReward: number;
  category: string;
  reasoning: string;
  estimatedDuration: string;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  private constructor() {
    this.apiKey = config.openRouter.apiKey;
    this.apiUrl = config.openRouter.apiUrl;
    this.model = config.openRouter.model;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async callOpenRouterAPI(prompt: string): Promise<string> {
    try {
      console.log('🌐 Calling OpenRouter API...');
      console.log('🔑 API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      console.log('🤖 Model:', this.model);
      console.log('📝 Prompt length:', prompt.length);
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: `You are an AI life coach and quest generator for a gamified personal development app called "LevelUpLife". 
              Your role is to analyze user data and generate personalized quests that help users achieve their goals and improve their lives.
              
              Guidelines:
              - Generate quests that are actionable and specific
              - Consider the user's mood, challenges, and achievements from journal entries
              - Align quests with their core values and existing goals
              - Provide quests of varying difficulty levels
              - Make quests engaging and motivating
              - Consider the user's current level and progress
              
              Always respond with valid JSON format.`
            },
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ OpenRouter API response received');
      console.log('📄 Response status:', response.status);
      console.log('📄 Response data keys:', Object.keys(response.data));
      
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('❌ Error calling OpenRouter API:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw new Error('Failed to generate quests with AI');
    }
  }

  private fixJson(jsonString: string): string {
    // Add missing commas between objects in arrays and fix common JSON issues
    let fixed = jsonString
      .replace(/}\s*{/g, '},\n{') // insert comma between }{
      .replace(/}\s*\n\s*{/g, '},\n{') // insert comma between } and { on newlines
      .replace(/,\s*([}\]])/g, '$1') // remove trailing commas before ] or }
      .replace(/([\w]+):/g, '"$1":'); // quote unquoted keys
    return fixed;
  }

  private extractJsonBlock(text: string): string | null {
    // Extract the first {...} or [...] block from the text
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) return arrayMatch[0];
    const objMatch = text.match(/\{[\s\S]*?\}/);
    if (objMatch) return objMatch[0];
    return null;
  }

  public async generatePersonalizedQuests(context: QuestGenerationContext): Promise<GeneratedQuest[]> {
    const prompt = this.buildQuestGenerationPrompt(context);
    
    try {
      const response = await this.callOpenRouterAPI(prompt);
      console.log("OpenRouter raw response for quests:", response);
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        // Try to extract the first JSON block (array or object)
        const extracted = response ? this.extractJsonBlock(response) : null;
        if (extracted) {
          try {
            parsedResponse = JSON.parse(extracted);
          } catch {
            parsedResponse = JSON.parse(this.fixJson(extracted));
          }
        } else {
          throw new Error("Failed to parse quest response");
        }
      }
      
      if (parsedResponse.quests && Array.isArray(parsedResponse.quests)) {
        return parsedResponse.quests;
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error generating quests:', error);
      // Return fallback quests if AI fails
      return this.generateFallbackQuests(context);
    }
  }

  private buildQuestGenerationPrompt(context: QuestGenerationContext): string {
    const recentEntries = context.journalEntries.slice(-3);
    const activeGoals = context.goals.filter(g => !g.isCompleted);
    const topValues = context.coreValues.sort((a, b) => b.importance - a.importance).slice(0, 3);
    const completedTasks = context.completedTasks.slice(-5); // Recent completions

    return `Generate 3-5 personalized quests for a user based on their data:

User Context:
- Level: ${context.userLevel}
- Recent Mood: ${recentEntries.map(e => e.mood).join(', ')}
- Active Goals: ${activeGoals.map(g => `${g.title} (${g.progress}% progress)`).join(', ')}
- Top Core Values: ${topValues.map(v => `${v.title} (importance: ${v.importance}/10)`).join(', ')}
- Recently Completed: ${completedTasks.map(t => t.title).join(', ')}

Recent Journal Entries:
${recentEntries.map(entry => `
Date: ${entry.date}
Mood: ${entry.mood}
Title: ${entry.title}
Content: ${entry.content}
Achievements: ${entry.achievements.join(', ')}
Challenges: ${entry.challenges.join(', ')}
Tomorrow's Goals: ${entry.tomorrowGoals.join(', ')}
`).join('\n')}

Goal Progress Analysis:
${activeGoals.map(goal => `
Goal: ${goal.title}
Progress: ${goal.progress}%
Description: ${goal.description}
Target Date: ${goal.targetDate || 'No deadline'}
`).join('\n')}

Please generate quests that:
1. **Help achieve specific goals** - Create quests that directly advance goal progress
2. **Address current challenges** - Based on journal entries, create quests that help overcome obstacles
3. **Build on recent achievements** - Leverage momentum from completed tasks
4. **Align with core values** - Ensure quests reflect the user's most important values
5. **Match energy level** - Consider mood and recent activity level
6. **Provide clear next steps** - Each quest should have actionable, specific instructions

Quest Guidelines:
- For goals with low progress (<30%): Create foundational quests that build momentum
- For goals with medium progress (30-70%): Create breakthrough quests that push toward completion
- For goals with high progress (>70%): Create finishing quests that help cross the finish line
- For challenging moods: Create supportive, self-care focused quests
- For positive moods: Create ambitious, growth-focused quests

Respond with **only valid JSON** in this format:
{
  "quests": [
    {
      "title": "Quest Title",
      "description": "Detailed quest description with specific steps",
      "difficulty": "Easy|Medium|Hard|Epic",
      "xpReward": 50,
      "category": "Personal|Health|Career|Relationships|Learning",
      "reasoning": "Why this quest was generated and how it helps achieve goals",
      "estimatedDuration": "15 minutes|1 hour|1 day|1 week"
    }
  ]
}

Do not include any explanations or formatting outside the JSON block.`;
  }

  private generateFallbackQuests(context: QuestGenerationContext): GeneratedQuest[] {
    const recentEntries = context.journalEntries.slice(-1);
    const mood = recentEntries.length > 0 ? recentEntries[0].mood : 'neutral';
    
    const fallbackQuests: GeneratedQuest[] = [
      {
        title: "Daily Reflection",
        description: "Take 10 minutes to reflect on your day and write down one thing you're grateful for",
        difficulty: "Easy",
        xpReward: 25,
        category: "Personal",
        reasoning: "Based on your recent journal entries, reflection helps maintain positive momentum",
        estimatedDuration: "10 minutes"
      },
      {
        title: "Goal Progress Check",
        description: "Review your active goals and identify one small step you can take today",
        difficulty: "Easy",
        xpReward: 30,
        category: "Personal",
        reasoning: "Regular goal review helps maintain focus and momentum",
        estimatedDuration: "15 minutes"
      }
    ];

    // Add mood-specific quests
    if (mood === 'difficult' || mood === 'challenging') {
      fallbackQuests.push({
        title: "Self-Care Moment",
        description: "Do something kind for yourself today - take a walk, listen to music, or practice deep breathing",
        difficulty: "Easy",
        xpReward: 40,
        category: "Health",
        reasoning: "Based on your current mood, self-care can help improve your well-being",
        estimatedDuration: "30 minutes"
      });
    }

    return fallbackQuests;
  }

  public async generateSuggestedGoals(journalEntry: JournalEntry, coreValues: CoreValue[]): Promise<string[]> {
    const prompt = `Based on this journal entry, suggest 2-3 specific goals the user might want to work on:

Journal Entry:
- Mood: ${journalEntry.mood}
- Content: ${journalEntry.content}
- Challenges: ${journalEntry.challenges.join(', ')}
- Tomorrow's Goals: ${journalEntry.tomorrowGoals.join(', ')}

Core Values: ${coreValues.map(v => v.title).join(', ')}

Suggest specific, actionable goals that address their challenges and align with their values.

Respond with **only valid JSON** in this format:
{
  "suggestedGoals": [
    "Goal suggestion 1",
    "Goal suggestion 2",
    "Goal suggestion 3"
  ]
}

Do not include any explanations or formatting outside the JSON block.`;

    try {
      const response = await this.callOpenRouterAPI(prompt);
      console.log("OpenRouter raw response for goals:", response);
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        // Try to extract the first JSON block (array or object)
        const extracted = response ? this.extractJsonBlock(response) : null;
        if (extracted) {
          try {
            parsedResponse = JSON.parse(extracted);
          } catch {
            parsedResponse = JSON.parse(this.fixJson(extracted));
          }
        } else {
          throw new Error("Failed to parse goal suggestions response");
        }
      }
      
      if (parsedResponse.suggestedGoals && Array.isArray(parsedResponse.suggestedGoals)) {
        return parsedResponse.suggestedGoals;
      } else {
        return this.generateFallbackGoalSuggestions(journalEntry);
      }
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      return this.generateFallbackGoalSuggestions(journalEntry);
    }
  }

  private generateFallbackGoalSuggestions(journalEntry: JournalEntry): string[] {
    const suggestions: string[] = [];
    
    if (journalEntry.challenges.length > 0) {
      suggestions.push(`Address challenge: ${journalEntry.challenges[0]}`);
    }
    
    if (journalEntry.tomorrowGoals.length > 0) {
      suggestions.push(`Work on: ${journalEntry.tomorrowGoals[0]}`);
    }
    
    suggestions.push("Improve daily routine and productivity");
    
    return suggestions;
  }
}

export default AIService.getInstance(); 