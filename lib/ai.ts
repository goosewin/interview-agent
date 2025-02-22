import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function generate(prompt: string) {
  const { text } = await generateText({
    model: openai("o3-mini"),
    prompt: prompt
  })

  return text
}
