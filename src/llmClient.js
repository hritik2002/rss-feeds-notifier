import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generatePostSummary({ post, interests }) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that returns whether the post is relevant to the interests provided or not, if it's relevant, return 'yes' along with the summary of the post under 300 characters, if it's not relevant, return 'no'.
        
        Always return the summary in the following JSON format:a
        as shown below:
        {
          "summary": "The summary of the post",
          "isRelevant": "yes" or "no"
        }
        `,
      },
      {
        role: "user",
        content: `Summarize the following blog post: ${post}. 
      The interests are: ${interests.join(", ")}.`,
      },
    ],
  });
  const content = response.choices[0].message.content;
  if (!content) return { summary: null, isRelevant: "no" };
  try {
    const result = JSON.parse(content);
    return { summary: result.summary, isRelevant: result.isRelevant };
  } catch (error) {
    console.error("Error parsing JSON from LLM response", error);
    return { summary: null, isRelevant: "no" };
  }
}
