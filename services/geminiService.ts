
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Priority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Tool Definitions ---

const createProjectPlanDeclaration: FunctionDeclaration = {
  name: 'createProjectPlan',
  description: 'Creates a new main task/project with a list of subtasks in the application.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The main title of the project or task.',
      },
      description: {
        type: Type.STRING,
        description: 'A brief description or strategic note about the project.',
      },
      priority: {
        type: Type.STRING,
        enum: ['High', 'Medium', 'Low', 'None'],
        description: 'The priority level of the task.',
      },
      subtasks: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of actionable subtask titles (3-5 steps).',
      },
      motivation: {
        type: Type.STRING,
        description: 'A short, punchy motivational message for the user.',
      },
    },
    required: ['title', 'priority', 'subtasks', 'motivation'],
  },
};

const updateTaskDeclaration: FunctionDeclaration = {
  name: 'updateTask',
  description: 'Updates an existing task with new details. Use this when the user wants to improve, restructure, or change the priority of the task they are discussing.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskId: {
        type: Type.STRING,
        description: 'The ID of the task to update.',
      },
      title: {
        type: Type.STRING,
        description: 'A refined or clearer title for the task.',
      },
      description: {
        type: Type.STRING,
        description: 'A new or improved description/strategy.',
      },
      priority: {
        type: Type.STRING,
        enum: ['High', 'Medium', 'Low', 'None'],
        description: 'The new priority level.',
      },
      subtasks: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'New subtasks to add to the existing list.',
      },
      motivation: {
        type: Type.STRING,
        description: 'A new motivational message.',
      },
    },
    required: ['taskId'],
  },
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        You are a ZenTask Productivity Expert. Your goal is to help users turn vague ideas into structured project plans.
        
        PROTOCOL:
        1. If the user discusses a NEW goal, ask clarifying questions, then use 'createProjectPlan'.
        2. If the user is discussing an EXISTING task (context provided), and suggests changes (e.g., "break this down", "make it high priority", "rewrite the description"), use 'updateTask' to apply those changes directly.
        3. Always be concise and encouraging.
      `,
      tools: [{ functionDeclarations: [createProjectPlanDeclaration, updateTaskDeclaration] }],
    }
  });
};

export const breakdownTaskWithAI = async (taskTitle: string): Promise<{ subtasks: string[] }> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Break down the following task into 3-5 actionable, concise subtasks. Return only the subtask titles. Task: "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "List of actionable subtask titles"
            }
          },
          required: ["subtasks"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanText);
      return data;
    }
    
    return { subtasks: [] };
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return { subtasks: [] };
  }
};

interface AiAnalysisResult {
  refinedTitle: string;
  description: string;
  priority: Priority;
  subtasks: string[];
  motivation: string;
}

export const analyzeTaskWithAI = async (input: string): Promise<AiAnalysisResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Act as a world-class productivity coach.
      Analyze the user's raw task input: "${input}".
      
      1. Refine the title to be action-oriented and clear.
      2. Write a brief (1-2 sentence) description or strategy note.
      3. Determine the priority (High, Medium, Low, or None).
      4. Break it down into 3-5 actionable subtasks to structure the project.
      5. Write a short, punchy, specific motivational message to get the user excited to start.

      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low", "None"] },
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivation: { type: Type.STRING, description: "A short, encouraging message specific to the task." }
          },
          required: ["refinedTitle", "description", "priority", "subtasks", "motivation"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanText);
      return {
        ...data,
        priority: data.priority as Priority
      };
    }
    return null;
  } catch (error) {
    console.error("Error analyzing task:", error);
    return null;
  }
};
