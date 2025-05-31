
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addSubmission, getPartsAndServices, markSubmissionAsViewed as markSubmissionViewedDb } from "@/lib/data";
import type { PartOrService, SelectedItem, SubmissionType } from "@/types";
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

export async function submitJobAction(args: SubmitJobArgs) {
  const allPartsAndServices = getPartsAndServices();
  const selectedItems: SelectedItem[] = args.selectedItemsData
    .map(data => {
      const itemDetails = allPartsAndServices.find(ps => ps.id === data.itemId);
      if (!itemDetails) return null;
      return { item: itemDetails, quantity: data.quantity };
    })
    .filter(item => item !== null) as SelectedItem[];

  if (selectedItems.length === 0 && args.submissionType === 'finished') { // Allow quotes with no items for now, but finished services should have items.
    return { success: false, message: "Serviços finalizados devem conter ao menos um item." };
  }
   if (selectedItems.length === 0 && args.submissionType === 'quote' && !args.notes && !args.customerName && !args.vehicleInfo) {
    return { success: false, message: "Orçamentos vazios devem conter ao menos uma observação, cliente ou veículo." };
  }


  try {
    addSubmission(
      args.mechanicId, 
      args.submissionType, 
      selectedItems,
      args.customerName,
      args.vehicleInfo,
      args.notes
    );
    revalidatePath("/desktop"); 
    revalidatePath("/mobile/new-submission"); 
  } catch (error) {
    console.error("Failed to submit job:", error);
    return { success: false, message: "Falha ao enviar o registro. Tente novamente." };
  }
  
  redirect("/mobile");
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
    const allPartsAndServices = getPartsAndServices();
    
    const suggestions = output.suggestedPartsAndServices
      .filter(name => !currentSelectionNames.includes(name))
      .map(name => allPartsAndServices.find(ps => ps.name === name))
      .filter(item => item !== undefined) as PartOrService[];
      
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
