
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
