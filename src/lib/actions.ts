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

  if (selectedItems.length === 0) {
    return { success: false, message: "Nenhum item selecionado." };
  }

  try {
    addSubmission(args.mechanicId, args.submissionType, selectedItems);
    revalidatePath("/desktop"); // Revalidate desktop page to show new submission
    revalidatePath("/mobile/new-submission"); // Revalidate to clear form or show success
  } catch (error) {
    console.error("Failed to submit job:", error);
    return { success: false, message: "Falha ao enviar o registro. Tente novamente." };
  }
  
  // Redirect to mobile home after submission
  redirect("/mobile");
  // return { success: true, message: "Registro enviado com sucesso!" };
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
    
    // Filter out already selected items and map names to PartOrService objects
    const suggestions = output.suggestedPartsAndServices
      .filter(name => !currentSelectionNames.includes(name))
      .map(name => allPartsAndServices.find(ps => ps.name === name))
      .filter(item => item !== undefined) as PartOrService[];
      
    return suggestions.slice(0, 5); // Limit suggestions
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
    // Handle error appropriately, maybe return an error object
  }
}