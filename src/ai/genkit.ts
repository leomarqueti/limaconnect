
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // The model should be specified in generate calls or as a default in the plugin config
  // model: 'googleai/gemini-2.0-flash', // Removed this line
});
