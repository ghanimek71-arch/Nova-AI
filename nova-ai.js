// Nova AI — custom PenguinMod extension
// Keep provider API keys on a backend server. Never put secret keys in this file.

(function (Scratch) {
  "use strict";

  if (!Scratch || !Scratch.extensions) {
    throw new Error("Nova AI must be loaded as a PenguinMod/Scratch custom extension.");
  }

  class NovaAI {
    constructor() {
      this.serverURL = "";
      this.lastResponse = "";
      this.lastImageURL = "";
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
            text: "set Nova AI server URL to [URL]",
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: "https://your-server.example" }
            }
          },
          {
            opcode: "askNova",
            blockType: Scratch.BlockType.COMMAND,
            text: "ask Nova AI [PROMPT]",
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: "How do I make a game?" }
            }
          },
          {
            opcode: "lastResponse",
            blockType: Scratch.BlockType.REPORTER,
            text: "Nova AI response"
          },
          {
            opcode: "generateImage",
            blockType: Scratch.BlockType.COMMAND,
            text: "generate image from [PROMPT]",
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: "a cute cartoon cat" }
            }
          },
          {
            opcode: "lastImageURL",
            blockType: Scratch.BlockType.REPORTER,
            text: "generated image URL"
          }
        ]
      };
    }

    setServerURL(args) {
      this.serverURL = String(args.URL || "").trim().replace(/\/+$/, "");
    }

    async postJSON(path, body) {
      if (!this.serverURL) {
        throw new Error("Set the Nova AI server URL first.");
      }

      const response = await fetch(this.serverURL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error("Nova AI server returned HTTP " + response.status);
      }

      return response.json();
    }

    async askNova(args) {
      try {
        const data = await this.postJSON("/chat", {
          prompt: String(args.PROMPT || "")
        });
        this.lastResponse = String(data.text || "");
      } catch (error) {
        this.lastResponse = "Nova AI error: " + error.message;
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
          this.lastResponse = "The image service did not return an image URL.";
        }
      } catch (error) {
        this.lastImageURL = "";
        this.lastResponse = "Nova AI image error: " + error.message;
      }
    }

    lastImageURL() {
      return this.lastImageURL;
    }
  }

  Scratch.extensions.register(new NovaAI());
})(Scratch);
