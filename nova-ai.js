// Nova AI — إضافة مخصصة لمنصة PenguinMod
// لا تضع مفاتيح API السرية هنا؛ احتفظ بها في الخادم الخلفي.

(function (Scratch) {
  "use strict";

  if (!Scratch || !Scratch.extensions) {
    throw new Error("يجب تحميل Nova AI كإضافة مخصصة في PenguinMod.");
  }

  class NovaAI {
    constructor() {
      this.serverURL = "";
      this.lastResponse = "";
      this.lastImageURL = "";
      this.connectionStatus = "لم يتم اختبار الاتصال بعد";
    }

    getInfo() {
      return {
        id: "novaai",
        name: "Nova AI 🌀",
        color1: "#6C4CE3",
        color2: "#5638C4",
        color3: "#432AA5",
        blocks: [
          {
            opcode: "setServerURL",
            blockType: Scratch.BlockType.COMMAND,
            text: "اضبط عنوان خادم Nova AI على [URL]",
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: "https://your-server.example" }
            }
          },
          {
            opcode: "testConnection",
            blockType: Scratch.BlockType.COMMAND,
            text: "اختبر الاتصال بخادم Nova AI"
          },
          {
            opcode: "connectionStatus",
            blockType: Scratch.BlockType.REPORTER,
            text: "حالة الاتصال بخادم Nova AI"
          },
          {
            opcode: "askNova",
            blockType: Scratch.BlockType.COMMAND,
            text: "تواصل مع الذكاء الاصطناعي عبر API واسأله [PROMPT]",
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: "كيف أصنع لعبة؟" }
            }
          },
          {
            opcode: "lastResponse",
            blockType: Scratch.BlockType.REPORTER,
            text: "إجابة Nova AI"
          },
          {
            opcode: "generateImage",
            blockType: Scratch.BlockType.COMMAND,
            text: "أنشئ صورة بالوصف [PROMPT]",
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: "قطة كرتونية لطيفة" }
            }
          },
          {
            opcode: "lastImageURL",
            blockType: Scratch.BlockType.REPORTER,
            text: "رابط الصورة الناتجة"
          }
        ]
      };
    }

    setServerURL(args) {
      this.serverURL = String(args.URL || "").trim().replace(/\\/+$/, "");
    }

    async postJSON(path, body) {
      if (!this.serverURL) {
        throw new Error("اضبط عنوان خادم Nova AI أولاً.");
      }

      const response = await fetch(this.serverURL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error("خطأ من الخادم: HTTP " + response.status);
      }

      return response.json();
    }

    async testConnection() {
      try {
        const response = await fetch(this.serverURL + "/health");
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        this.connectionStatus = data.ok ? "متصل بخادم Nova AI" : "الخادم لا يؤكد جاهزيته";
      } catch (error) {
        this.connectionStatus = "فشل الاتصال: " + error.message;
      }
    }

    connectionStatus() {
      return this.connectionStatus;
    }

    async askNova(args) {
      try {
        const data = await this.postJSON("/chat", {
          prompt: String(args.PROMPT || "")
        });
        this.lastResponse = String(data.text || "");
      } catch (error) {
        this.lastResponse = "خطأ Nova AI: " + error.message;
      }
    }

    lastResponse() {
      return this.lastResponse;
    }

    async generateImage(args) {
      try {
        const data = await this.postJSON("/images", {
          prompt: String(args.PROMPT || "")
        });
        this.lastImageURL = String(data.url || "");
        if (!this.lastImageURL) {
          this.lastResponse = "خدمة الصور لم تُرجع رابطاً للصورة.";
        }
      } catch (error) {
        this.lastImageURL = "";
        this.lastResponse = "خطأ إنشاء الصورة: " + error.message;
      }
    }

    lastImageURL() {
      return this.lastImageURL;
    }
  }

  Scratch.extensions.register(new NovaAI());
})(Scratch);
