
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import type { PartOrService, Mechanic, Submission, PartOrServiceFormData } from '@/types';

// Adicionando um mecânico/usuário para o escritório e para o tablet
export const mechanics: Mechanic[] = [
  { id: 'mech1', name: 'Carlos Silva', photoUrl: 'https://placehold.co/40x40.png?text=CS', aiHint: 'man portrait' },
  { id: 'mech2', name: 'João Ferreira', photoUrl: 'https://placehold.co/40x40.png?text=JF', aiHint: 'person face' },
  { id: 'office_user', name: 'Escritório Lima Connect', photoUrl: 'https://placehold.co/40x40.png?text=LC', aiHint: 'office building' },
  { id: 'tablet_user', name: 'Recepção/Check-in', photoUrl: 'https://placehold.co/40x40.png?text=TB', aiHint: 'tablet device' },
];

// In-memory store for submissions - AINDA EM MEMÓRIA POR ENQUANTO
let _submissions: Submission[] = [
  // ... (dados de exemplo, serão migrados para Firestore depois)
];


// Firestore collection reference for parts and services
const partsAndServicesCollection = collection(db, 'partsAndServices');

export async function getPartsAndServices(): Promise<PartOrService[]> {
  const q = query(partsAndServicesCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartOrService));
}

export async function getPartOrServiceById(id: string): Promise<PartOrService | undefined> {
  const docRef = doc(db, 'partsAndServices', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PartOrService;
  }
  return undefined;
}

export async function addPartOrService(data: PartOrServiceFormData): Promise<PartOrService> {
  const newItemData = {
    name: data.name,
    price: data.price,
    type: data.type,
    imageUrl: data.imageUrl || `https://placehold.co/150x150.png?text=${data.name.substring(0,3)}`,
    aiHint: data.aiHint || data.name.toLowerCase().split(' ').slice(0,2).join(' '),
    createdAt: serverTimestamp(), // Opcional: para rastrear quando foi criado
  };
  const docRef = await addDoc(partsAndServicesCollection, newItemData);
  return { id: docRef.id, ...data } as PartOrService; // Retorna com o ID gerado
}

export async function updatePartOrService(id: string, data: PartOrServiceFormData): Promise<PartOrService | undefined> {
  const docRef = doc(db, 'partsAndServices', id);
  const updatedData = {
    name: data.name,
    price: data.price,
    type: data.type,
    imageUrl: data.imageUrl || `https://placehold.co/150x150.png?text=${data.name.substring(0,3)}`,
    aiHint: data.aiHint || data.name.toLowerCase().split(' ').slice(0,2).join(' '),
    updatedAt: serverTimestamp(), // Opcional: para rastrear quando foi atualizado
  };
  await updateDoc(docRef, updatedData);
  // Para retornar o item atualizado, você pode fazer um getDoc novamente ou construir o objeto
  const updatedSnap = await getDoc(docRef);
   if (updatedSnap.exists()) {
    return { id: updatedSnap.id, ...updatedSnap.data() } as PartOrService;
  }
  return undefined; // ou lançar um erro se o item não for encontrado após a atualização
}

export async function deletePartOrService(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'partsAndServices', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting part or service from Firestore: ", error);
    return false;
  }
}


// Funções para mecânicos e submissões (Ainda em memória, serão migradas depois)
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

export function addSubmission(submissionData: Omit<Submission, 'id' | 'timestamp' | 'status'>): Submission {
  const newId = `sub${_submissions.length + 1}_${Date.now()}`; 
  
  let totalPrice = 0;
  if (submissionData.type === 'quote' || submissionData.type === 'finished') {
    totalPrice = (submissionData.items || []).reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  }

  const newSubmission: Submission = {
    ...submissionData,
    id: newId,
    timestamp: new Date(),
    status: 'pending', 
    totalPrice: submissionData.type !== 'checkin' ? totalPrice : undefined,
    items: submissionData.type !== 'checkin' ? submissionData.items : undefined,
  };
  _submissions.unshift(newSubmission); 
  return newSubmission;
}

export function markSubmissionAsViewed(id: string): void {
  const submissionIndex = _submissions.findIndex(s => s.id === id);
  if (submissionIndex > -1) {
    _submissions[submissionIndex] = { ..._submissions[submissionIndex], status: 'viewed' };
  }
}
