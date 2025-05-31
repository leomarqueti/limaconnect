
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting related parts or services based on the mechanic's current selections.
 *
 * - suggestRelatedParts - A function that suggests related parts or services.
 * - SuggestRelatedPartsInput - The input type for the suggestRelatedParts function.
 * - SuggestRelatedPartsOutput - The return type for the suggestRelatedParts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod'; // Changed from 'genkit'

const SuggestRelatedPartsInputSchema = z.object({
  selectedPartsAndServices: z
    .array(z.string())
    .describe('An array of currently selected parts and services.'),
});
export type SuggestRelatedPartsInput = z.infer<typeof SuggestRelatedPartsInputSchema>;

const SuggestRelatedPartsOutputSchema = z.object({
  suggestedPartsAndServices: z
    .array(z.string())
    .describe('An array of suggested parts and services related to the selected items.'),
});
export type SuggestRelatedPartsOutput = z.infer<typeof SuggestRelatedPartsOutputSchema>;

export async function suggestRelatedParts(input: SuggestRelatedPartsInput): Promise<SuggestRelatedPartsOutput> {
  return suggestRelatedPartsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedPartsPrompt',
  input: {schema: SuggestRelatedPartsInputSchema},
  output: {schema: SuggestRelatedPartsOutputSchema},
  prompt: `You are an expert mechanic assistant. Based on the currently selected parts and services, suggest other parts or services that are commonly used together with these items.

Selected Parts and Services: {{selectedPartsAndServices}}

Suggestions:`,
});

const suggestRelatedPartsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedPartsFlow',
    inputSchema: SuggestRelatedPartsInputSchema,
    outputSchema: SuggestRelatedPartsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
