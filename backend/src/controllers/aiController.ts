import { Request, Response, NextFunction } from 'express';
import AIService from '../services/aiService';
import { AppError } from '../middlewares/errorHandler';

export class AIController {
  /**
   * Generates a fully detailed travel itinerary using Egyptology heuristics.
   */
  public static async generateItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { destination, durationDays, pace, interests } = req.body;

      if (!destination || !durationDays) {
        throw new AppError('Destination and durationDays are required parameters', 400);
      }

      const duration = parseInt(durationDays);
      if (isNaN(duration) || duration <= 0) {
        throw new AppError('durationDays must be a positive integer', 400);
      }

      const result = await AIService.generateItinerary(destination, duration, pace, interests || []);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * AI Travel chatbot conversational endpoint.
   */
  public static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        throw new AppError('A valid array of message histories is required', 400);
      }

      const answer = await AIService.chat(messages);

      res.status(200).json({
        success: true,
        data: {
          role: 'assistant',
          content: answer,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AIController;

// ─── Concierge VIP Service Endpoint ───────────────────────────────────────────

export const handleConciergeService = async (req: Request, res: Response) => {
  const { service } = req.body;

  const services: Record<string, { name: string; price: number; description: string }> = {
    helicopter: {
      name: 'Private Helicopter Charter',
      price: 450,
      description: 'A royal aerial convoy from Cairo to the sacred Giza plateau, soaring above the ancient sands as the Pharaohs once surveyed their dominions from the heavens.'
    },
    balloon: {
      name: 'Sunrise Hot Air Balloon over Valley of the Kings',
      price: 250,
      description: 'As Ra himself ascends from the eastern horizon, your gilded balloon rises above the Valley of the Kings. The tombs of the great pharaohs stretch below in golden splendor.'
    },
    butler: {
      name: 'VIP Airport Butler Fast-Track Escort',
      price: 150,
      description: 'A personal royal escort navigates you through all ceremonial gates with the authority of a high priest, ensuring your passage is swift and dignified.'
    },
    templeDining: {
      name: 'Private Candlelit Dining inside Philae Temple',
      price: 600,
      description: 'Dine as an ancient deity within the sacred halls of Philae Temple. Your personal chef presents a curated feast of rare Egyptian delicacies by candlelight as hieroglyphs watch in silent blessing.'
    }
  };

  const selected = services[service];
  if (!selected) {
    return res.status(400).json({ success: false, error: { message: 'Unknown royal service requested.' } });
  }

  // Simulated transaction ID
  const transactionId = `KMT-VIP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return res.json({
    success: true,
    data: {
      transactionId,
      service: selected.name,
      price: selected.price,
      description: selected.description,
      message: `By royal decree, your ${selected.name} has been arranged. May your journey through the kingdom of Kemet be blessed by the gods.`,
      confirmedAt: new Date().toISOString()
    }
  });
};
