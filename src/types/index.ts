
export interface PartOrService {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  aiHint: string; // For data-ai-hint
  type: 'part' | 'service';
}

export interface Mechanic {
  id: string;
  name: string;
  photoUrl: string;
  aiHint: string; // For data-ai-hint for avatar
}

export interface SelectedItem {
  item: PartOrService;
  quantity: number;
}

export type SubmissionType = 'quote' | 'finished';

export interface Submission {
  id: string;
  mechanicId: string;
  type: SubmissionType;
  items: SelectedItem[];
  timestamp: Date;
  totalPrice?: number;
  status: 'pending' | 'viewed'; // For desktop notifications
  customerName?: string;
  vehicleInfo?: string;
  notes?: string;
}

// Schema for adding/editing PartOrService (used with react-hook-form and Zod)
import { z } from 'zod';

export const partOrServiceSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(100, { message: "O nome deve ter no máximo 100 caracteres." }),
  price: z.coerce.number().min(0.01, { message: "O preço deve ser maior que zero." }),
  type: z.enum(['part', 'service'], { required_error: "O tipo é obrigatório." }),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  aiHint: z.string().max(50, { message: "A dica de IA deve ter no máximo 50 caracteres." }).optional().or(z.literal('')),
});

export type PartOrServiceFormData = z.infer<typeof partOrServiceSchema>;
