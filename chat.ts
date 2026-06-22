import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import OpenAI from "openai";

const router = Router();

function getAIClient(): OpenAI | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  }
  return null;
}

function getModel(client: OpenAI): string {
  const isGroq = (client as any).baseURL?.includes("groq.com");
  return isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
}

router.post("/chat/vault-query", async (req, res) => {
  try {
    const { content } = SendMessageBody.parse(req.body);

    const openai = getAIClient();
    if (!openai) {
      res.setHeader("Content-Type", "application/json");
      return void res.status(200).json({ noApiKey: true });
    }

    const docs = await db
      .select({
        name: documentsTable.name,
        extractedText: documentsTable.extractedText,
      })
      .from(documentsTable);

    const docsWithText = docs.filter((d) => d.extractedText);
    if (docsWithText.length === 0) {
      res.setHeader("Content-Type", "application/json");
      return void res.status(200).json({ noDocuments: true });
    }

    const MAX_CONTEXT = 60000;
    let contextParts: string[] = [];
    let totalLen = 0;
    for (const doc of docsWithText) {
      const chunk = `\n\n--- Document: "${doc.name}" ---\n${doc.extractedText}`;
      if (totalLen + chunk.length > MAX_CONTEXT) break;
      contextParts.push(chunk);
      totalLen += chunk.length;
    }

    const systemPrompt = `You are an expert AI assistant for a decentralized knowledge vault powered by 0G Storage. The user has uploaded ${docsWithText.length} document(s). Here is the content of all documents:\n${contextParts.join("")}\n\nAnswer questions about any of these documents. Be thorough, precise, and cite which document(s) your answer comes from.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: getModel(openai),
      max_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Vault query failed" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
    }
  }
});

router.get("/chat/conversations", async (req, res) => {
  try {
    const convs = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.updatedAt));

    const result = await Promise.all(
      convs.map(async (conv) => {
        let documentName: string | null = null;
        if (conv.documentId) {
          const [doc] = await db
            .select({ name: documentsTable.name })
            .from(documentsTable)
            .where(eq(documentsTable.id, conv.documentId));
          documentName = doc?.name ?? null;
        }
        return { ...conv, documentName };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/chat/conversations", async (req, res) => {
  try {
    const body = CreateConversationBody.parse(req.body);
    const [conv] = await db
      .insert(conversationsTable)
      .values(body)
      .returning();

    let documentName: string | null = null;
    if (conv.documentId) {
      const [doc] = await db
        .select({ name: documentsTable.name })
        .from(documentsTable)
        .where(eq(documentsTable.id, conv.documentId));
      documentName = doc?.name ?? null;
    }

    res.status(201).json({ ...conv, documentName });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = GetConversationParams.parse(req.params);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conv) return void res.status(404).json({ error: "Conversation not found" });

    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    let documentName: string | null = null;
    if (conv.documentId) {
      const [doc] = await db
        .select({ name: documentsTable.name })
        .from(documentsTable)
        .where(eq(documentsTable.id, conv.documentId));
      documentName = doc?.name ?? null;
    }

    res.json({ ...conv, documentName, messages: msgs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.patch("/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = GetConversationParams.parse(req.params);
    const { documentId } = req.body as { documentId: number | null };

    const [updated] = await db
      .update(conversationsTable)
      .set({ documentId: documentId ?? null, updatedAt: new Date() })
      .where(eq(conversationsTable.id, id))
      .returning();

    if (!updated) return void res.status(404).json({ error: "Conversation not found" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

router.delete("/chat/conversations/:id", async (req, res) => {
  try {
    const { id } = DeleteConversationParams.parse(req.params);
    await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
    await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.post("/chat/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = SendMessageParams.parse(req.params);
    const { content } = SendMessageBody.parse(req.body);

    const openai = getAIClient();
    if (!openai) {
      res.setHeader("Content-Type", "application/json");
      return void res.status(200).json({ noApiKey: true });
    }

    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conv) return void res.status(404).json({ error: "Conversation not found" });

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content,
    });

    let systemPrompt =
      "You are a helpful AI assistant for a document vault. Help users understand and explore their documents.";
    if (conv.documentId) {
      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, conv.documentId));
      if (doc?.extractedText) {
        systemPrompt = `You are an AI assistant helping the user understand a document titled "${doc.name}". Here is the document content:\n\n${doc.extractedText.slice(0, 12000)}\n\nAnswer questions based on this document.`;
      }
    }

    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: getModel(openai),
      max_tokens: 8192,
      messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
    }
  }
});

export default router;
