
import type { PartOrService, Mechanic, Submission, SubmissionType, SelectedItem } from '@/types';

export const mechanics: Mechanic[] = [
  { id: 'mech1', name: 'Carlos Silva', photoUrl: 'https://placehold.co/40x40.png?text=CS', aiHint: 'man portrait' },
  { id: 'mech2', name: 'João Ferreira', photoUrl: 'https://placehold.co/40x40.png?text=JF', aiHint: 'person face' },
];

export const partsAndServices: PartOrService[] = [
  { id: 'ps1', name: 'Fita Isolante', price: 5.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'insulating tape', type: 'part' },
  { id: 'ps2', name: 'Lâmpada H4 (Farol)', price: 25.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'car light', type: 'part' },
  { id: 'ps3', name: 'Óleo Motor 10W40 1L', price: 45.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'oil bottle', type: 'part' },
  { id: 'ps4', name: 'Filtro de Óleo', price: 30.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'oil filter', type: 'part' },
  { id: 'ps5', name: 'Pastilha de Freio (par)', price: 120.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'brake pad', type: 'part' },
  { id: 'ps6', name: 'Troca de Lâmpada', price: 20.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'mechanic service', type: 'service' },
  { id: 'ps7', name: 'Troca de Óleo e Filtro', price: 80.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'oil change', type: 'service' },
  { id: 'ps8', name: 'Alinhamento e Balanceamento', price: 150.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'tire wheel', type: 'service' },
  { id: 'ps9', name: 'Diagnóstico Eletrônico', price: 100.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'car diagnostic', type: 'service' },
  { id: 'ps10', name: 'Vela de Ignição', price: 15.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'spark plug', type: 'part' },
  { id: 'ps11', name: 'Bateria 60Ah', price: 350.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'car battery', type: 'part' },
  { id: 'ps12', name: 'Limpeza de Bicos Injetores', price: 180.00, imageUrl: 'https://placehold.co/100x100.png', aiHint: 'engine cleaning', type: 'service' },
];

// In-memory store for submissions
let _submissions: Submission[] = [
  {
    id: 'sub1',
    mechanicId: 'mech1',
    type: 'quote',
    items: [
      { item: partsAndServices.find(p=>p.id==='ps2')!, quantity: 2 },
      { item: partsAndServices.find(p=>p.id==='ps6')!, quantity: 1 },
    ],
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    status: 'viewed',
    totalPrice: (25*2) + 20,
  },
  {
    id: 'sub2',
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
  }
];


export function getPartsAndServices(): PartOrService[] {
  return partsAndServices;
}

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

export function addSubmission(mechanicId: string, type: SubmissionType, items: SelectedItem[]): Submission {
  const newId = `sub${_submissions.length + 1 + Date.now()}`;
  const totalPrice = items.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const newSubmission: Submission = {
    id: newId,
    mechanicId,
    type,
    items,
    timestamp: new Date(),
    status: 'pending',
    totalPrice,
  };
  _submissions.push(newSubmission);
  return newSubmission;
}

export function markSubmissionAsViewed(id: string): void {
  const submission = _submissions.find(s => s.id === id);
  if (submission) {
    submission.status = 'viewed';
  