
"use server";

import { revalidatePath } from "next/cache";
import { addSubmission, getPartsAndServices, markSubmissionAsViewed as markSubmissionViewedDb, addPartOrService as addPartOrServiceDb } from "@/lib/data";
import type { PartOrService, SelectedItem, SubmissionType, PartOrServiceFormData } from "@/types";
import { suggestRelatedParts as genAiSuggestRelatedParts } from "@/ai/flows/suggest-related-parts";
import type { SuggestRelatedPartsInput, SuggestRelatedPartsOutput } from "@/ai/flows/suggest-related-parts";

export interface SubmitJobArgs {
  mechanicId: string;
  submissionType: SubmissionType;
  selectedItemsData: { itemId: string; quantity: number }[];
  customerName?: string;
  vehicleInfo?: string;
  notes?: string;
}

export interface SubmitJobResult {
  success: boolean;
  message?: string;
  submissionId?: string;
}

export async function submitJobAction(args: SubmitJobArgs): Promise<SubmitJobResult> {
  const allPartsAndServices = getPartsAndServices(); // Fetch current list
  const selectedItems: SelectedItem[] = args.selectedItemsData
    .map(data => {
      const itemDetails = allPartsAndServices.find(ps => ps.id === data.itemId);
      if (!itemDetails) return null;
      return { item: itemDetails, quantity: data.quantity };
    })
    .filter(item => item !== null) as SelectedItem[];

  if (selectedItems.length === 0 && args.submissionType === 'finished') { 
    return { success: false, message: "Serviços finalizados devem conter ao menos um item." };
  }
   if (selectedItems.length === 0 && args.submissionType === 'quote' && !args.notes && !args.customerName && !args.vehicleInfo) {
    return { success: false, message: "Orçamentos vazios devem conter ao menos uma observação, cliente ou veículo." };
  }

  try {
    const newSubmission = addSubmission(
      args.mechanicId, 
      args.submissionType, 
      selectedItems,
      args.customerName,
      args.vehicleInfo,
      args.notes
    );
    
    revalidatePath("/desktop", "layout"); 
    revalidatePath("/mobile", "layout"); 
    
    return { success: true, submissionId: newSubmission.id, message: "Registro enviado com sucesso!" };

  } catch (error) {
    console.error("Failed to submit job:", error);
    return { success: false, message: "Falha ao enviar o registro. Tente novamente." };
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
    const allPartsAndServicesData = getPartsAndServices(); // Fetch current list
    
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
    markSubmissionViewedDb(submissionId);
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
    // Here you would typically validate the data further if needed, or Zod already handled it
    const newItem = addPartOrServiceDb(data);
    revalidatePath("/desktop/inventory");
    revalidatePath("/mobile/new-submission"); // Revalidate pages where parts list is used
    revalidatePath("/desktop/new-submission");
    return { success: true, message: "Item adicionado com sucesso!", item: newItem };
  } catch (error) {
    console.error("Failed to create part or service:", error);
    return { success: false, message: "Falha ao adicionar o item. Tente novamente." };
  }
}

// TODO: updatePartOrServiceAction
// TODO: deletePartOrServiceAction
