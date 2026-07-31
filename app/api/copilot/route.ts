import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { geminiToolDeclarations, toolExecutors } from '@/lib/copilot/tools';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
// gemini-2.0-flash: 1,500 req/day free tier (vs gemini-3.6-flash's 20/day)
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

const SYSTEM_PROMPT = `You are OpenRoll Payroll Copilot — an intelligent AI assistant for the OpenRoll Payroll Management System.

## Tool Decision Rules (follow strictly):
- User says "show/list/view employees in [unit]" or "active employees in [unit]" → call listEmployeesByUnit(unitName="[unit]")
- User says "list/show units" or "what units exist" → call listUnits()
- User says "find [name]" or "search [name or ID]" or gives a specific employee name/ID → call searchEmployee(query="[name or ID]")
- User asks about salary for a specific employee → call getSalaryBreakdown(employeeId="[id]")
- User asks about attendance for a specific employee → call getAttendanceData(employeeId="[id]")
- User asks to compare months → call compareMonthlyPayroll(employeeId="[id]")

## Output Rules:
1. Call EXACTLY ONE tool, then immediately respond with formatted text.
2. NEVER call a second tool after receiving results — respond with text right away.
3. Format currency as ₹15,000 (Indian Rupees with commas).
4. Use markdown tables for lists. Use bullet points for individual employee details.
5. If data is not found, explain what was searched.

## CRITICAL: After ANY tool result, RESPOND WITH TEXT IMMEDIATELY. No chaining tools.`;


function convertToGeminiHistory(messages: any[]): Content[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || m.content || '' }] as Part[],
    }));
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Build conversation history (all but the last message)
    let contents: Content[] = convertToGeminiHistory(messages.slice(0, -1));

    // The last user message kicks off the loop
    const lastMsg = messages[messages.length - 1];
    contents.push({
      role: 'user',
      parts: [{ text: lastMsg.text || lastMsg.content || '' }],
    });

    const tools = [{ functionDeclarations: geminiToolDeclarations }];
    const generationConfig = { temperature: 0.2 };

    // ── Agentic loop ──────────────────────────────────────────────────────────
    // Gemini calls a tool → we execute it → pass result back → repeat
    // until Gemini produces a text response (no more tool calls)
    const MAX_STEPS = 4;
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await model.generateContent({
        contents,
        tools,
        generationConfig,
        systemInstruction: SYSTEM_PROMPT,
      });

      const candidate = response.response.candidates?.[0];
      if (!candidate) break;

      const parts = candidate.content.parts;
      const functionCallParts = parts.filter(p => p.functionCall);

      if (functionCallParts.length > 0) {
        // Add model's tool-call turn to history
        contents.push({ role: 'model', parts });

        // Execute every function call and collect results
        const resultParts: Part[] = await Promise.all(
          functionCallParts.map(async p => {
            const { name, args } = p.functionCall!;
            const executor = toolExecutors[name];
            let output: any;
            if (executor) {
              output = await executor(args as any);
            } else {
              output = { error: `Unknown tool: ${name}` };
            }
            console.log(`[copilot] step ${step + 1}: called ${name}, keys:`, Object.keys(output || {}));
            return {
              functionResponse: {
                name,
                response: { output },
              },
            } as Part;
          })
        );

        // Add function results as a user turn (Gemini protocol)
        contents.push({ role: 'user', parts: resultParts });
      } else {
        // Model produced final text — return it
        const text = response.response.text();
        console.log('[copilot] done in', step + 1, 'step(s), text length:', text.length);
        return new Response(text, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }

    // ── Fallback: force a plain-text summary from what was gathered ───────────
    // Ask the model to summarize WITHOUT tools so it can't chain more calls
    console.log('[copilot] max steps reached — forcing text-only summary');
    const fallback = await model.generateContent({
      contents,
      generationConfig: { temperature: 0.2 },
      systemInstruction: `${SYSTEM_PROMPT}\n\nIMPORTANT: You have already retrieved all the data you need. Now you MUST write a clear, well-formatted text summary of the information gathered. Do NOT call any more tools.`,
    });
    const fallbackText = fallback.response.text();
    return new Response(
      fallbackText || 'I was unable to process this request. Please try a more specific query (e.g. search for a specific employee name).',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  } catch (error: any) {
    console.error('[copilot] Error:', error);

    // Handle quota / rate-limit errors gracefully
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      const retryMatch = error?.message?.match(/(\d+(?:\.\d+)?)s/);
      const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;
      return new Response(
        `⏳ The AI service is temporarily rate-limited. Please wait **${waitSecs} seconds** and try again.\n\n_This happens because the free tier allows a limited number of requests per day. Your request will work after the cooldown._`,
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
