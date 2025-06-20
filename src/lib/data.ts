
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc, Timestamp, setDoc, where } from 'firebase/firestore'; // Added where
import type { PartOrService, Mechanic, Submission, PartOrServiceFormData, SelectedItem, UserProfile, ChecklistItemValue } from '@/types';

// Adicionando um mecânico/usuário para o escritório e para o tablet
export const mechanics: Mechanic[] = [
  { id: 'mech1', name: 'Carlos Silva', photoUrl: 'https://placehold.co/40x40.png?text=CS', aiHint: 'man portrait' },
  { id: 'mech2', name: 'João Ferreira', photoUrl: 'https://placehold.co/40x40.png?text=JF', aiHint: 'person face' },
  { id: 'office_user', name: 'Escritório Lima Connect', photoUrl: 'https://placehold.co/40x40.png?text=LC', aiHint: 'office building' },
  { id: 'tablet_user', name: 'Recepção/Check-in', photoUrl: 'https://placehold.co/40x40.png?text=TB', aiHint: 'tablet device' },
];

const partsAndServicesCollection = collection(db, 'partsAndServices');
const submissionsCollection = collection(db, 'submissions');
const usersCollection = collection(db, 'users'); // Firestore collection for users

// Helper para conversão segura de timestamp
export function safeTimestampToDate(firestoreTimestamp: any): Date {
  if (firestoreTimestamp instanceof Timestamp) {
    return firestoreTimestamp.toDate();
  }
  // Firestore SDK for web sometimes returns an object with toDate but not an instance of Timestamp
  if (firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function') {
    return firestoreTimestamp.toDate();
  }
  if (firestoreTimestamp instanceof Date) {
    return firestoreTimestamp;
  }
  if (typeof firestoreTimestamp === 'string' || typeof firestoreTimestamp === 'number') {
    try {
      const d = new Date(firestoreTimestamp);
      if (!isNaN(d.getTime())) return d;
    } catch (e) { /* ignore parsing errors */ }
  }
  // Fallback if conversion fails or input is unexpected
  // console.warn("safeTimestampToDate: Could not parse timestamp, returning current date as fallback.", firestoreTimestamp);
  return new Date(); // Consider if a different fallback is more appropriate, e.g., epoch or throw error
}


export async function getPartsAndServices(): Promise<PartOrService[]> {
  const q = query(partsAndServicesCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartOrService));
}

export async function getPartOrServiceById(id: string): Promise<PartOrService | undefined> {
  if (!id) return undefined;
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
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(partsAndServicesCollection, newItemData);
  return {
    id: docRef.id,
    ...data,
    imageUrl: newItemData.imageUrl,
    aiHint: newItemData.aiHint
  } as PartOrService;
}

export async function updatePartOrService(id: string, data: PartOrServiceFormData): Promise<PartOrService | undefined> {
  if (!id) return undefined;
  const docRef = doc(db, 'partsAndServices', id);
  const updatedData = {
    name: data.name,
    price: data.price,
    type: data.type,
    imageUrl: data.imageUrl || `https://placehold.co/150x150.png?text=${data.name.substring(0,3)}`,
    aiHint: data.aiHint || data.name.toLowerCase().split(' ').slice(0,2).join(' '),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, updatedData);
  const updatedSnap = await getDoc(docRef);
   if (updatedSnap.exists()) {
    return { id: updatedSnap.id, ...updatedSnap.data() } as PartOrService;
  }
  return undefined;
}

export async function deletePartOrService(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    const docRef = doc(db, 'partsAndServices', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting part or service from Firestore: ", error);
    return false;
  }
}

// User related functions
export async function addUserToFirestore(uid: string, email: string, displayName: string): Promise<void> {
  const userRef = doc(usersCollection, uid);
  const userData: Omit<UserProfile, 'uid' | 'createdAt'> & { createdAt: any } = {
    email: email,
    displayName: displayName,
    // photoURL will be added/updated via profile edit
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, userData);
}

export async function getUserFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const userRef = doc(usersCollection, uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: safeTimestampToDate(data.createdAt as Timestamp | Date | string),
    } as UserProfile;
  }
  return null;
}

export async function updateUserProfileInFirestore(uid: string, data: { displayName?: string; photoURL?: string }): Promise<void> {
  if (!uid) throw new Error("UID do usuário é obrigatório para atualizar o perfil.");
  const userRef = doc(usersCollection, uid);

  const updateData: any = {};
  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }
  if (data.photoURL !== undefined) { // Allow setting photoURL to empty string to remove it
    updateData.photoURL = data.photoURL;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  updateData.updatedAt = serverTimestamp();
  await updateDoc(userRef, updateData);
}


export function getMechanics(): Mechanic[] {
  return mechanics;
}

export function getMechanicById(id: string): Mechanic | undefined {
  return mechanics.find(m => m.id === id);
}

// This function can still be used for non-realtime fetches if needed elsewhere,
// but DesktopDashboardPage will now use onSnapshot for its primary data.
export async function getSubmissions(): Promise<Submission[]> {
  const q = query(submissionsCollection, where("isArchived", "==", false), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      mechanicId: data.mechanicId || '',
      type: data.type || 'quote',
      timestamp: safeTimestampToDate(data.timestamp as Timestamp | Date | string),
      status: data.status || 'pending',
      isArchived: data.isArchived === true, // Garante que seja booleano, default false
      items: data.type !== 'checkin' ? (Array.isArray(data.items) ? data.items : []) : undefined,
      totalPrice: data.type !== 'checkin' ? (typeof data.totalPrice === 'number' ? data.totalPrice : 0) : undefined,
      customerName: data.customerName || undefined,
      vehicleInfo: data.vehicleInfo || undefined,
      notes: data.notes || undefined,
      customerContact: data.type === 'checkin' ? (data.customerContact || undefined) : undefined,
      vehicleMake: data.type === 'checkin' ? (data.vehicleMake || undefined) : undefined,
      vehicleModel: data.type === 'checkin' ? (data.vehicleModel || undefined) : undefined,
      vehicleYear: data.type === 'checkin' ? (data.vehicleYear || undefined) : undefined,
      vehicleVIN: data.type === 'checkin' ? (data.vehicleVIN || undefined) : undefined,
      vehicleLicensePlate: data.type === 'checkin' ? (data.vehicleLicensePlate || undefined) : undefined,
      serviceRequestDetails: data.type === 'checkin' ? (data.serviceRequestDetails || undefined) : undefined,
      checklistItems: data.type === 'checkin' ? (Array.isArray(data.checklistItems) ? data.checklistItems : []) : undefined as ChecklistItemValue[] | undefined,
      photoDataUris: data.type === 'checkin' ? (Array.isArray(data.photoDataUris) ? data.photoDataUris : []) : undefined as string[] | undefined,
    } as Submission;
  });
}

export async function getArchivedSubmissionsFromFirestore(): Promise<Submission[]> {
  const q = query(submissionsCollection, where("isArchived", "==", true), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      mechanicId: data.mechanicId || '',
      type: data.type || 'quote',
      timestamp: safeTimestampToDate(data.timestamp as Timestamp | Date | string),
      status: data.status || 'pending', // Status might be less relevant for archived items
      isArchived: true, // Explicitly true
      items: data.type !== 'checkin' ? (Array.isArray(data.items) ? data.items : []) : undefined,
      totalPrice: data.type !== 'checkin' ? (typeof data.totalPrice === 'number' ? data.totalPrice : 0) : undefined,
      customerName: data.customerName || undefined,
      vehicleInfo: data.vehicleInfo || undefined,
      notes: data.notes || undefined,
      customerContact: data.type === 'checkin' ? (data.customerContact || undefined) : undefined,
      vehicleMake: data.type === 'checkin' ? (data.vehicleMake || undefined) : undefined,
      vehicleModel: data.type === 'checkin' ? (data.vehicleModel || undefined) : undefined,
      vehicleYear: data.type === 'checkin' ? (data.vehicleYear || undefined) : undefined,
      vehicleVIN: data.type === 'checkin' ? (data.vehicleVIN || undefined) : undefined,
      vehicleLicensePlate: data.type === 'checkin' ? (data.vehicleLicensePlate || undefined) : undefined,
      serviceRequestDetails: data.type === 'checkin' ? (data.serviceRequestDetails || undefined) : undefined,
      checklistItems: data.type === 'checkin' ? (Array.isArray(data.checklistItems) ? data.checklistItems : []) : undefined as ChecklistItemValue[] | undefined,
      photoDataUris: data.type === 'checkin' ? (Array.isArray(data.photoDataUris) ? data.photoDataUris : []) : undefined as string[] | undefined,
    } as Submission;
  });
}

export async function getSubmissionById(id: string): Promise<Submission | undefined> {
  if (!id) {
    console.error("getSubmissionById called with invalid ID (empty or undefined).");
    return undefined;
  }
  const docRef = doc(db, 'submissions', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        mechanicId: data.mechanicId || '',
        type: data.type || 'quote',
        timestamp: safeTimestampToDate(data.timestamp as Timestamp | Date | string),
        status: data.status || 'pending',
        isArchived: data.isArchived === true,
        items: data.type !== 'checkin' ? (Array.isArray(data.items) ? data.items : []) : undefined,
        totalPrice: data.type !== 'checkin' ? (typeof data.totalPrice === 'number' ? data.totalPrice : 0) : undefined,
        customerName: data.customerName || undefined,
        vehicleInfo: data.vehicleInfo || undefined,
        notes: data.notes || undefined,
        customerContact: data.type === 'checkin' ? (data.customerContact || undefined) : undefined,
        vehicleMake: data.type === 'checkin' ? (data.vehicleMake || undefined) : undefined,
        vehicleModel: data.type === 'checkin' ? (data.vehicleModel || undefined) : undefined,
        vehicleYear: data.type === 'checkin' ? (data.vehicleYear || undefined) : undefined,
        vehicleVIN: data.type === 'checkin' ? (data.vehicleVIN || undefined) : undefined,
        vehicleLicensePlate: data.type === 'checkin' ? (data.vehicleLicensePlate || undefined) : undefined,
        serviceRequestDetails: data.type === 'checkin' ? (data.serviceRequestDetails || undefined) : undefined,
        checklistItems: data.type === 'checkin' ? (Array.isArray(data.checklistItems) ? data.checklistItems : []) : undefined as ChecklistItemValue[] | undefined,
        photoDataUris: data.type === 'checkin' ? (Array.isArray(data.photoDataUris) ? data.photoDataUris : []) : undefined as string[] | undefined,
      } as Submission;
    } else {
      console.warn(`No submission found in Firestore with ID: ${id}`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching submission with ID ${id} from Firestore:`, error);
    return undefined;
  }
}

export async function addSubmission(submissionData: Omit<Submission, 'id' | 'timestamp' | 'status' | 'isArchived'>): Promise<Submission> {
  let totalPrice = 0;
  if (submissionData.type === 'quote' || submissionData.type === 'finished') {
    totalPrice = (submissionData.items || []).reduce((acc, curr) => {
      const itemPrice = curr.item && typeof curr.item.price === 'number' ? curr.item.price : 0;
      const quantity = typeof curr.quantity === 'number' ? curr.quantity : 0;
      return acc + (itemPrice * quantity);
    }, 0);
  }

  const dataToSave: any = {
    mechanicId: submissionData.mechanicId,
    type: submissionData.type,
    timestamp: serverTimestamp(),
    status: 'pending',
    isArchived: false, // Default to false for new submissions
    customerName: submissionData.customerName || null,
    vehicleInfo: submissionData.vehicleInfo || null,
    notes: submissionData.notes || null,
  };

  if (submissionData.type === 'quote' || submissionData.type === 'finished') {
    dataToSave.items = submissionData.items || [];
    dataToSave.totalPrice = totalPrice;
  } else if (submissionData.type === 'checkin') {
    dataToSave.customerContact = submissionData.customerContact || null;
    dataToSave.vehicleMake = submissionData.vehicleMake || null;
    dataToSave.vehicleModel = submissionData.vehicleModel || null;
    dataToSave.vehicleYear = submissionData.vehicleYear || null;
    dataToSave.vehicleVIN = submissionData.vehicleVIN || null;
    dataToSave.vehicleLicensePlate = submissionData.vehicleLicensePlate || null;
    dataToSave.serviceRequestDetails = submissionData.serviceRequestDetails || null;
    dataToSave.checklistItems = submissionData.checklistItems || [];
    dataToSave.photoDataUris = submissionData.photoDataUris || [];
  }

  const docRef = await addDoc(submissionsCollection, dataToSave);

  return {
    id: docRef.id,
    ...submissionData,
    timestamp: new Date(),
    status: 'pending',
    isArchived: false,
    totalPrice: (submissionData.type === 'quote' || submissionData.type === 'finished') ? totalPrice : undefined,
  } as Submission;
}

export async function markSubmissionAsViewed(id: string): Promise<void> {
  if (!id) {
    console.error("markSubmissionAsViewed called with invalid ID.");
    return;
  }
  const submissionRef = doc(db, 'submissions', id);
  try {
    await updateDoc(submissionRef, {
      status: 'viewed'
    });
  } catch (error) {
    console.error(`Error marking submission ${id} as viewed in Firestore:`, error);
  }
}

export async function archiveSubmissionInFirestore(submissionId: string): Promise<boolean> {
  if (!submissionId) {
    console.error("archiveSubmissionInFirestore called with invalid ID.");
    return false;
  }
  const submissionRef = doc(db, 'submissions', submissionId);
  try {
    await updateDoc(submissionRef, {
      isArchived: true,
      updatedAt: serverTimestamp() // Opcional: para rastrear quando foi arquivado
    });
    return true;
  } catch (error) {
    console.error(`Error archiving submission ${submissionId} in Firestore:`, error);
    return false;
  }
}

    