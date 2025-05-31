
import type { PartOrService, Mechanic, Submission, SubmissionType, SelectedItem, PartOrServiceFormData } from '@/types';

// Adicionando um mecânico/usuário para o escritório
export const mechanics: Mechanic[] = [
  { id: 'mech1', name: 'Carlos Silva', photoUrl: 'https://placehold.co/40x40.png?text=CS', aiHint: 'man portrait' },
  { id: 'mech2', name: 'João Ferreira', photoUrl: 'https://placehold.co/40x40.png?text=JF', aiHint: 'person face' },
  { id: 'office_user', name: 'Escritório AutoService', photoUrl: 'https://placehold.co/40x40.png?text=AS', aiHint: 'office building' },
];

export let partsAndServices: PartOrService[] = [
  { id: 'ps1', name: 'Fita Isolante Rolo 5m', price: 5.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'insulating tape', type: 'part' },
  { id: 'ps2', name: 'Lâmpada H4 55/60W (Farol)', price: 25.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'car light', type: 'part' },
  { id: 'ps3', name: 'Óleo Motor Semissintético 10W40 API SN 1L', price: 45.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'oil bottle', type: 'part' },
  { id: 'ps4', name: 'Filtro de Óleo Motor (compatível Gol/Palio)', price: 30.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'oil filter', type: 'part' },
  { id: 'ps5', name: 'Pastilha de Freio Dianteira (par)', price: 120.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'brake pad', type: 'part' },
  { id: 'ps6', name: 'Serviço: Troca de Lâmpada (unidade)', price: 20.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'mechanic service', type: 'service' },
  { id: 'ps7', name: 'Serviço: Troca de Óleo e Filtro de Óleo', price: 80.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'oil change', type: 'service' },
  { id: 'ps8', name: 'Serviço: Alinhamento de Direção e Balanceamento de Rodas (4 rodas)', price: 150.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'tire wheel', type: 'service' },
  { id: 'ps9', name: 'Serviço: Diagnóstico Eletrônico com Scanner', price: 100.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'car diagnostic', type: 'service' },
  { id: 'ps10', name: 'Vela de Ignição (unidade)', price: 15.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'spark plug', type: 'part' },
  { id: 'ps11', name: 'Bateria Automotiva 60Ah (selada)', price: 350.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'car battery', type: 'part' },
  { id: 'ps12', name: 'Serviço: Limpeza de Bicos Injetores (por bico)', price: 45.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'engine cleaning', type: 'service' },
  { id: 'ps13', name: 'Fluido de Freio DOT 4 500ml', price: 35.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'brake fluid', type: 'part' },
  { id: 'ps14', name: 'Serviço: Sangria e Troca de Fluido de Freio', price: 90.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'brake service', type: 'service' },
  { id: 'ps15', name: 'Amortecedor Dianteiro (unidade)', price: 280.00, imageUrl: 'https://placehold.co/150x150.png', aiHint: 'shock absorber', type: 'part' },
];

// In-memory store for submissions
let _submissions: Submission[] = [
  {
    id: 'sub1_demo',
    mechanicId: 'mech1',
    type: 'quote',
    items: [
      { item: partsAndServices.find(p=>p.id==='ps2')!, quantity: 2 },
      { item: partsAndServices.find(p=>p.id==='ps6')!, quantity: 1 },
    ],
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    status: 'viewed',
    totalPrice: (25*2) + 20,
    customerName: 'Maria Oliveira',
    vehicleInfo: 'Fiat Palio 2010 Placa XYZ-7890',
    notes: 'Verificar barulho na suspensão dianteira também. Cliente relatou estalos ao virar o volante para a direita em baixa velocidade.'
  },
  {
    id: 'sub2_demo',
    mechanicId: 'mech2',
    type: 'finished',
    items: [
      { item: partsAndServices.find(p=>p.id==='ps3')!, quantity: 4 },
      { item: partsAndServices.find(p=>p.id==='ps4')!, quantity: 1 },
      { item: partsAndServices.find(p=>p.id==='ps7')!, quantity: 1 },
    ],
    timestamp: new Date(Date.now() - 3600000 * 1), // 1 hour ago
    status: 'pending',
    totalPrice: (45*4) + 30 + 80,
    customerName: 'José Pereira',
    vehicleInfo: 'Ford Ka 2018 Placa JKL-4567',
    notes: 'Cliente solicitou urgência. Veículo será retirado no final da tarde.'
  },
   {
    id: 'sub3_demo_office',
    mechanicId: 'office_user',
    type: 'quote',
    items: [
      { item: partsAndServices.find(p=>p.id==='ps5')!, quantity: 2 }, // Pastilha de Freio (par) x2 = 4 pastilhas
      { item: partsAndServices.find(p=>p.id==='ps13')!, quantity: 1 }, // Fluido de Freio
      { item: partsAndServices.find(p=>p.id==='ps14')!, quantity: 1 }, // Serviço: Troca de Fluido
    ],
    timestamp: new Date(Date.now() - 3600000 * 5), // 5 hours ago
    status: 'viewed',
    totalPrice: (120*2) + 35 + 90,
    customerName: 'Ana Costa',
    vehicleInfo: 'Honda Civic 2020 Placa QWE-1234',
    notes: 'Orçamento criado pelo escritório a pedido do cliente por telefone. Cliente agendou para próxima semana.'
  }
];


export function getPartsAndServices(): PartOrService[] {
  return [...partsAndServices].sort((a, b) => a.name.localeCompare(b.name));
}

export function getPartOrServiceById(id: string): PartOrService | undefined {
  return partsAndServices.find(item => item.id === id);
}

export function addPartOrService(data: PartOrServiceFormData): PartOrService {
  const newId = `ps${partsAndServices.length + 1}_${Date.now()}`;
  const newItem: PartOrService = {
    id: newId,
    name: data.name,
    price: data.price,
    type: data.type,
    imageUrl: data.imageUrl || `https://placehold.co/150x150.png?text=${data.name.substring(0,3)}`,
    aiHint: data.aiHint || data.name.toLowerCase().split(' ').slice(0,2).join(' '),
  };
  partsAndServices.push(newItem);
  return newItem;
}

// TODO: Implement updatePartOrService
// TODO: Implement deletePartOrService


export function getMechanics(): Mechanic[] {
  return mechanics;
}

export function getMechanicById(id: string): Mechanic | undefined {
  return mechanics.find(m => m.id === id);
}

export function getSubmissions(): Submission[] {
  // Sort by newest first
  return [..._submissions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getSubmissionById(id: string): Submission | undefined {
  return _submissions.find(s => s.id === id);
}

export function addSubmission(
  mechanicId: string, 
  type: SubmissionType, 
  items: SelectedItem[],
  customerName?: string,
  vehicleInfo?: string,
  notes?: string
): Submission {
  const newId = `sub${_submissions.length + 1}_${Date.now()}`; 
  const totalPrice = items.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const newSubmission: Submission = {
    id: newId,
    mechanicId,
    type,
    items,
    timestamp: new Date(),
    status: 'pending', // New submissions are always pending
    totalPrice,
    customerName,
    vehicleInfo,
    notes,
  };
  _submissions.unshift(newSubmission); 
  return newSubmission;
}

export function markSubmissionAsViewed(id: string): void {
  const submissionIndex = _submissions.findIndex(s => s.id === id);
  if (submissionIndex > -1) {
    // Create a new object for the updated submission to help with React's change detection
    _submissions[submissionIndex] = { ..._submissions[submissionIndex], status: 'viewed' };
  }
}
