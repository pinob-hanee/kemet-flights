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
