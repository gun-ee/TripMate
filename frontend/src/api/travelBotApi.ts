import axios from './axios';

export type BotAnswer = {
  answer?: string;
  items?: string[];
  suggestions?: string[];
  itinerary?: {
    days: Array<{ day: number, plan: Array<{ time: string, title: string }> }>;
  };
};

export const travelBotApi = {
  async ask(text: string): Promise<BotAnswer>{
    const { data } = await axios.post('/travelbot/ask', { text });
    return data;
  }
};
