import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { db } from "@workspace/db";
import { documentsTable, conversationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  CreateDocumentBody,
  ListDocumentsQueryParams,
  GetDocumentParams,
  DeleteDocumentParams,
  ExtractDocumentTextParams,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage.js";
import { uploadToZeroG, isZeroGConfigured } from "../lib/zerogStorage.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

const router = Router();
const storage = new ObjectStorageService();

router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return void res.status(400).json({ error: "No file provided. Accepted types: PDF, DOCX, TXT, CSV." });

    const { originalname, mimetype, size, buffer } = req.file;

    let objectPath = "";
    let rootHash: string | null = null;
    let txHash: string | null = null;
    let storageProvider = "replit";

    if (isZeroGConfigured()) {
      try {
        req.log.info({ filename: originalname }, "Uploading to 0G Storage");
        const result = await uploadToZeroG(buffer, originalname);
        objectPath = result.objectPath;
        rootHash = result.rootHash;
        txHash = result.txHash || null;
        storageProvider = "zerog";
        req.log.info({ rootHash, txHash }, "0G Storage upload successful");
      } catch (zgErr) {
        req.log.error({ zgErr }, "0G Storage upload failed, falling back to Replit storage");
        objectPath = await storage.uploadObjectEntity(buffer, mimetype);
        storageProvider = "replit";
      }
    } else {
      objectPath = await storage.uploadObjectEntity(buffer, mimetype);
      storageProvider = "replit";
    }

    let extractedText = "";
    try {
      if (mimetype === "application/pdf") {
        const data = await pdfParse(buffer);
        extractedText = data.text.trim();
      } else {
        extractedText = buffer.toString("utf-8");
      }
    } catch (extractErr) {
      req.log.warn({ extractErr }, "Text extraction failed");
    }

    const [doc] = await db
      .insert(documentsTable)
      .values({
        name: originalname,
        objectPath,
        mimeType: mimetype,
        sizeBytes: size,
        extractedText: extractedText || null,
        rootHash,
        txHash,
        storageProvider,
      })
      .returning();

    res.status(201).json(doc);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const query = ListDocumentsQueryParams.parse(req.query);
    const results = await db
      .select()
      .from(documentsTable)
      .orderBy(desc(documentsTable.createdAt));

    let filtered = results;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = results.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          (d.extractedText ?? "").toLowerCase().includes(term)
      );
    }

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 100;
    res.json(filtered.slice(offset, offset + limit));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

router.post("/documents", async (req, res) => {
  try {
    const body = CreateDocumentBody.parse(req.body);
    const [doc] = await db
      .insert(documentsTable)
      .values(body)
      .returning();
    res.status(201).json(doc);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create document" });
  }
});

router.get("/documents/stats", async (req, res) => {
  try {
    const [row] = await db
      .select({
        totalDocuments: sql<number>`count(*)::int`,
        totalSizeBytes: sql<number>`coalesce(sum(${documentsTable.sizeBytes}), 0)::int`,
        documentsWithText: sql<number>`count(*) filter (where ${documentsTable.extractedText} is not null)::int`,
      })
      .from(documentsTable);

    const [convRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(conversationsTable);

    res.json({
      totalDocuments: row?.totalDocuments ?? 0,
      totalSizeBytes: row?.totalSizeBytes ?? 0,
      totalConversations: convRow?.total ?? 0,
      documentsWithText: row?.documentsWithText ?? 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/documents/:id", async (req, res) => {
  try {
    const { id } = GetDocumentParams.parse(req.params);
    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id));
    if (!doc) return void res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get document" });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = DeleteDocumentParams.parse(req.params);
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

router.post("/documents/:id/extract-text", async (req, res) => {
  try {
    const { id } = ExtractDocumentTextParams.parse(req.params);
    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id));
    if (!doc) return void res.status(404).json({ error: "Document not found" });

    let extractedText = "";
    try {
      if (doc.storageProvider === "zerog") {
        extractedText = doc.extractedText || "";
      } else {
        const file = await storage.getObjectEntityFile(doc.objectPath);
        const response = await storage.downloadObject(file);
        const buffer = Buffer.from(await response.arrayBuffer());

        if (doc.mimeType === "application/pdf") {
          const data = await pdfParse(buffer);
          extractedText = data.text.trim();
        } else {
          extractedText = buffer.toString("utf-8");
        }
      }
    } catch (extractErr) {
      req.log.warn({ extractErr }, "Text extraction failed, storing empty");
    }

    const [updated] = await db
      .update(documentsTable)
      .set({ extractedText, updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to extract text" });
  }
});

export default router;
