
"use server";

import { revalidatePath } from "next/cache";
import {
  addSubmission as addSubmissionDb,
  getPartsAndServices as getPartsAndServicesDb,
  markSubmissionAsViewed as markSubmissionViewedDb,
  addPartOrService as addPartOrServiceDb,
  updatePartOrService as updatePartOrServiceDb,
  deletePartOrService as deletePartOrServiceDb,
  getPartOrServiceById as getPartOrServiceByIdDb,
  archiveSubmissionInFirestore // Import the new function
} from "@/lib/data";
import type { PartOrService, SelectedItem, SubmissionType, PartOrServiceFormData, CheckinFormData, ChecklistItemValue, Submission } from "@/types";
import { suggestRelatedParts as genAiSuggestRelatedParts } from "@/ai/flows/suggest-related-parts";
import type { SuggestRelatedPartsInput, SuggestRelatedPartsOutput } from "@/ai/flows/suggest-related-parts";

export interface SubmitJobArgs {
  mechanicId: string;
  submissionType: Extract<SubmissionType, 'quote' | 'finished'>;
  selectedItemsData: { itemId: string; quantity: number }[];
  customerName?: string;
  vehicleInfo?: string;
  notes?: string;
}

export interface SubmitActionResult {
  success: boolean;
  message?: string;
  submissionId?: string;
}

export async function submitJobAction(args: SubmitJobArgs): Promise<SubmitActionResult> {
  const allPartsAndServices = await getPartsAndServicesDb();
  const selectedItems: SelectedItem[] = (
    await Promise.all(
      args.selectedItemsData.map(async (data) => {
        const itemDetails = allPartsAndServices.find(ps => ps.id === data.itemId);
        if (!itemDetails) return null;
        return { item: itemDetails, quantity: data.quantity };
      })
    )
  ).filter(item => item !== null) as SelectedItem[];


  if (selectedItems.length === 0 && args.submissionType === 'finished') {
    return { success: false, message: "Serviços finalizados devem conter ao menos um item." };
  }
   if (selectedItems.length === 0 && args.submissionType === 'quote' && !args.notes && !args.customerName && !args.vehicleInfo) {
    return { success: false, message: "Orçamentos vazios devem conter ao menos uma observação, cliente ou veículo." };
  }

  try {
    const submissionBaseData: Omit<Submission, 'id' | 'timestamp' | 'status' | 'isArchived'> & { items: SelectedItem[] } = {
      mechanicId: args.mechanicId,
      type: args.submissionType,
      items: selectedItems,
      customerName: args.customerName,
      vehicleInfo: args.vehicleInfo,
      notes: args.notes,
    };

    const newSubmission = await addSubmissionDb(submissionBaseData as Omit<Submission, 'id' | 'timestamp' | 'status' | 'isArchived'>);

    revalidatePath("/desktop", "layout");
    revalidatePath("/mobile", "layout");

    return { success: true, submissionId: newSubmission.id, message: "Registro enviado com sucesso!" };

  } catch (error) {
    console.error("Failed to submit job:", error);
    return { success: false, message: "Falha ao enviar o registro. Tente novamente." };
  }
}


export interface SubmitCheckinArgs extends CheckinFormData {
  checklistItems: ChecklistItemValue[];
  photoDataUris: string[];
}

export async function submitCheckinAction(args: SubmitCheckinArgs): Promise<SubmitActionResult> {
  try {
    const submissionData: Omit<Submission, 'id' | 'timestamp' | 'status' | 'isArchived'> = {
        mechanicId: 'tablet_user', // This could be dynamic if tablets are assigned to users
        type: 'checkin',
        customerName: args.customerName,
        customerContact: args.customerContact,
        vehicleMake: args.vehicleMake,
        vehicleModel: args.vehicleModel,
        vehicleYear: args.vehicleYear,
        vehicleLicensePlate: args.vehicleLicensePlate,
        vehicleVIN: args.vehicleVIN,
        serviceRequestDetails: args.serviceRequestDetails,
        checklistItems: args.checklistItems,
        photoDataUris: args.photoDataUris,
    };

    const newSubmission = await addSubmissionDb(submissionData);

    revalidatePath("/desktop", "layout");
    revalidatePath("/tablet", "layout");

    return { success: true, submissionId: newSubmission.id, message: "Check-in do veículo enviado com sucesso!" };

  } catch (error) {
    console.error("Failed to submit vehicle check-in:", error);
    return { success: false, message: "Falha ao enviar o check-in. Tente novamente." };
  }
}


export async function getAiSuggestionsAction(
  currentSelectionNames: string[]
): Promise<PartOrService[]> {
  if (currentSelectionNames.length === 0) {
    return [];
  }

  const input: SuggestRelatedPartsInput = {
    selectedPartsAndServices: currentSelectionNames,
  };

  try {
    const output: SuggestRelatedPartsOutput = await genAiSuggestRelatedParts(input);
    const allPartsAndServicesData = await getPartsAndServicesDb();

    const suggestions = output.suggestedPartsAndServices
      .map(name => allPartsAndServicesData.find(ps => ps.name === name))
      .filter(item => item !== undefined && !currentSelectionNames.includes(item.name)) as PartOrService[];

    return suggestions.slice(0, 5);
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return [];
  }
}

export async function markSubmissionAsViewedAction(submissionId: string) {
  try {
    await markSubmissionViewedDb(submissionId);
    revalidatePath("/desktop");
    revalidatePath(`/desktop/job/${submissionId}`);
  } catch (error) {
    console.error("Failed to mark submission as viewed:", error);
  }
}


export async function createPartOrServiceAction(
  data: PartOrServiceFormData
): Promise<{ success: boolean; message?: string; item?: PartOrService }> {
  try {
    const newItem = await addPartOrServiceDb(data);
    revalidatePath("/desktop/inventory");
    revalidatePath("/mobile/new-submission");
    revalidatePath("/desktop/new-submission");
    return { success: true, message: "Item adicionado com sucesso!", item: newItem };
  } catch (error) {
    console.error("Failed to create part or service:", error);
    return { success: false, message: "Falha ao adicionar o item. Tente novamente." };
  }
}

export async function updatePartOrServiceAction(
  id: string,
  data: PartOrServiceFormData
): Promise<{ success: boolean; message?: string; item?: PartOrService }> {
  try {
    const updatedItem = await updatePartOrServiceDb(id, data);
    if (!updatedItem) {
      return { success: false, message: "Item não encontrado para atualização." };
    }
    revalidatePath("/desktop/inventory");
    revalidatePath("/mobile/new-submission");
    revalidatePath("/desktop/new-submission");
    return { success: true, message: "Item atualizado com sucesso!", item: updatedItem };
  } catch (error) {
    console.error("Failed to update part or service:", error);
    return { success: false, message: "Falha ao atualizar o item. Tente novamente." };
  }
}

export async function deletePartOrServiceAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const success = await deletePartOrServiceDb(id);
    if (!success) {
      return { success: false, message: "Item não encontrado para exclusão ou falha ao excluir." };
    }
    revalidatePath("/desktop/inventory");
    revalidatePath("/mobile/new-submission");
    revalidatePath("/desktop/new-submission");
    return { success: true, message: "Item excluído com sucesso!" };
  } catch (error) {
    console.error("Failed to delete part or service:", error);
    return { success: false, message: "Falha ao excluir o item. Tente novamente." };
  }
}

export async function archiveSubmissionAction(submissionId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const success = await archiveSubmissionInFirestore(submissionId);
    if (!success) {
      return { success: false, message: "Falha ao arquivar a submissão. Item não encontrado ou erro no servidor." };
    }
    revalidatePath("/desktop");
    revalidatePath(`/desktop/job/${submissionId}`);
    revalidatePath("/desktop/history", "layout"); // Revalidate history page layout
    return { success: true, message: "Submissão arquivada com sucesso!" };
  } catch (error) {
    console.error("Error in archiveSubmissionAction:", error);
    return { success: false, message: "Erro ao tentar arquivar a submissão." };
  }
}
