import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "generated");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("خطأ: أضف OPENAI_API_KEY في متغيرات بيئة الخادم.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://studio.penguinmod.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin (for example health checks) are allowed.
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("هذا الموقع غير مسموح له بالاتصال بخادم Nova AI."));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use("/generated", express.static(imagesDir, {
  maxAge: "7d",
  setHeaders(res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "طلبات كثيرة جداً. انتظر دقيقة ثم حاول مجدداً." }
}));

function getPrompt(body) {
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    const error = new Error("اكتب وصفاً أو سؤالاً أولاً.");
    error.status = 400;
    throw error;
  }
  if (prompt.length > 4000) {
    const error = new Error("النص طويل جداً. الحد الأقصى 4000 حرف.");
    error.status = 400;
    throw error;
  }
  return prompt;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Nova AI", status: "ready" });
});

app.post("/chat", async (req, res, next) => {
  try {
    const prompt = getPrompt(req.body);
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-5.5";

    const response = await openai.responses.create({
      model,
      instructions:
        "أنت Nova AI، مساعد ودود داخل PenguinMod. أجب باللغة العربية الواضحة افتراضياً، واشرح البرمجة خطوة بخطوة عندما يُطلب منك ذلك. لا تدّعِ أنك نفذت إجراءً داخل المحرر.",
      input: prompt
    });

    res.json({ text: response.output_text || "لم تصل إجابة نصية من النموذج." });
  } catch (error) {
    next(error);
  }
});

app.post("/images", async (req, res, next) => {
  try {
    const prompt = getPrompt(req.body);
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";

    const result = await openai.images.generate({
      model,
      prompt,
      size: "1024x1024"
    });

    const base64 = result.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error("لم تُرجع خدمة الصور ملف صورة.");
    }

    await mkdir(imagesDir, { recursive: true });
    const filename = randomUUID() + ".png";
    await writeFile(path.join(imagesDir, filename), Buffer.from(base64, "base64"));

    const baseURL = (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, "");
    res.json({ url: `${baseURL}/generated/${filename}` });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error("Nova AI error:", error?.message || error);
  const status = Number(error?.status) || 500;
  const safeMessage = status < 500
    ? error.message
    : "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. تحقق من إعدادات الخادم ومفتاح API.";
  res.status(status).json({ error: safeMessage });
});

app.listen(port, () => {
  console.log(`Nova AI server is running on port ${port}`);
});
