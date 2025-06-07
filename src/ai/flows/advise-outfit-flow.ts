
'use server';
/**
 * @fileOverview A Genkit flow to provide outfit and activity advice based on weather conditions.
 *
 * - adviseOutfit - A function that returns an outfit suggestion.
 * - AdviseOutfitInput - The input type for the adviseOutfit function.
 * - AdviseOutfitOutput - The return type for the adviseOutfit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CurrentWeatherData } from '@/types/weather'; // Assuming this type is well-defined

const AdviseOutfitInputSchema = z.object({
  temp: z.number().describe('Current temperature in Celsius.'),
  description: z.string().describe('Textual description of the weather (e.g., "Clear Sky", "Light Rain").'),
  conditionCode: z.string().describe('Weather condition code (e.g., "01d", "10n").'),
  isDay: z.boolean().describe('Whether it is currently daytime.'),
  uvIndex: z.number().optional().describe('UV index, if available.'),
  windSpeed: z.number().optional().describe('Wind speed in km/h, if available.'),
});
export type AdviseOutfitInput = z.infer<typeof AdviseOutfitInputSchema>;

const AdviseOutfitOutputSchema = z.object({
  suggestion: z.string().describe('A concise suggestion for what to wear and a related activity tip.'),
  // We can extend this later with suggestedItems: z.array(z.string()) if needed
});
export type AdviseOutfitOutput = z.infer<typeof AdviseOutfitOutputSchema>;

export async function adviseOutfit(input: AdviseOutfitInput): Promise<AdviseOutfitOutput> {
  return adviseOutfitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adviseOutfitPrompt',
  input: {schema: AdviseOutfitInputSchema},
  output: {schema: AdviseOutfitOutputSchema},
  prompt: `You are a friendly and practical outfit and activity advisor.
Based on the following weather conditions, provide a concise suggestion (around 15-25 words) for what to wear and a brief related activity tip.
Focus on practical advice. If it's raining, mention an umbrella. If it's very sunny and hot, mention sunscreen or staying hydrated.
If it's very cold, suggest warm layers.

Weather Conditions:
- Temperature: {{{temp}}}°C
- Description: {{{description}}}
- Condition Code: {{{conditionCode}}}
- Daytime: {{{isDay}}}
{{#if uvIndex}}
- UV Index: {{{uvIndex}}}
{{/if}}
{{#if windSpeed}}
- Wind Speed: {{{windSpeed}}} km/h
{{/if}}

Example Output Format:
{
  "suggestion": "It's [weather summary, e.g., cold and snowy]! Wear [clothing items, e.g., a heavy jacket, gloves, and a hat]. Perfect for [activity tip, e.g., a cozy day indoors or a quick snowball fight if you're brave]."
}

Keep the suggestion natural and friendly.
`,
});

const adviseOutfitFlow = ai.defineFlow(
  {
    name: 'adviseOutfitFlow',
    inputSchema: AdviseOutfitInputSchema,
    outputSchema: AdviseOutfitOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
          // Fallback in case the AI somehow doesn't return valid JSON or an empty response
          console.warn("adviseOutfitFlow: AI returned no output, using fallback.");
          return { suggestion: "Check the weather and dress accordingly. Enjoy your day!" };
      }
      return output;
    } catch (error) {
      console.error("adviseOutfitFlow: Error calling AI prompt:", error);
      // Fallback in case of API errors (like 503 Service Unavailable)
      return { suggestion: "Couldn't get a suggestion due to a temporary issue. Please check the weather and dress accordingly. Enjoy your day!" };
    }
  }
);

