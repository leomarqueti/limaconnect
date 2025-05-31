
export interface PartOrService {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  aiHint: string; // For data-ai-hint
  type: 'part' | 'service';
}

export interface Mechanic { // This might represent pre-defined system users or roles later
  id: string; // Could be a Firebase UID for some specific system users
  name: string;
  photoUrl: string;
  aiHint: string; // For data-ai-hint for avatar
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string; // Optional, could be from Firebase Auth or custom
  // role?: 'mechanic' | 'office' | 'admin'; // For future role-based access
  createdAt: Date; // Will store as Firestore Timestamp, convert to Date on read
}

export interface SelectedItem {
  item: PartOrService;
  quantity: number;
}

export type SubmissionType = 'quote' | 'finished' | 'checkin';

export interface ChecklistItemValue {
  id: string; // e.g., 'mileage', 'fuel_level', 'exterior_damage'
  label: string; // e.g., "Quilometragem", "Nível de Combustível"
  value: string | boolean; // e.g., "12345 km", "1/2 tanque", true (for a checkbox)
  notes?: string; // Optional notes for specific checklist items like damages
  type: 'text' | 'textarea' | 'boolean'; // To help render the input
}

export interface Submission {
  id: string;
  mechanicId: string; // Firebase UID of the user who created the submission
  type: SubmissionType;
  timestamp: Date;
  status: 'pending' | 'viewed'; // For desktop notifications

  // Fields for 'quote' and 'finished' types
  items?: SelectedItem[];
  totalPrice?: number;

  // Fields for all types (customer info often collected at check-in)
  customerName?: string;
  vehicleInfo?: string; // General vehicle info, might be less structured for quotes/finished
  notes?: string; // General notes for the submission

  // Fields specific to 'checkin' type
  customerContact?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleVIN?: string;
  vehicleLicensePlate?: string;
  serviceRequestDetails?: string; // Customer's description of the issue or service needed
  checklistItems?: ChecklistItemValue[];
  photoDataUris?: string[]; // Array of base64 data URIs for photos
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

// Schema for Tablet Check-in Form
export const checkinFormSchema = z.object({
  customerName: z.string().min(3, "Nome do cliente é obrigatório."),
  customerContact: z.string().min(8, "Contato do cliente é obrigatório (telefone/email)."),
  vehicleMake: z.string().min(2, "Marca do veículo é obrigatória."),
  vehicleModel: z.string().min(1, "Modelo do veículo é obrigatório."),
  vehicleYear: z.string().regex(/^\d{4}$/, "Ano inválido.").optional().or(z.literal('')),
  vehicleLicensePlate: z.string().min(7, "Placa do veículo é obrigatória.").max(8, "Placa inválida."),
  vehicleVIN: z.string().length(17, "Chassi (VIN) deve ter 17 caracteres.").optional().or(z.literal('')),
  serviceRequestDetails: z.string().min(5, "Descreva o serviço solicitado ou problema.").max(500),
  // Checklist items will be handled separately in the form state, not directly in Zod schema for simplicity now
  // photoDataUris will also be handled in form state
});

export type CheckinFormData = z.infer<typeof checkinFormSchema>;
