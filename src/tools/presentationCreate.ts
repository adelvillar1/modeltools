/**
 * Presentation creation tool - generates HTML-based presentations
 */

export interface PresentationCreateInput {
  title: string;
  slides: Array<{
    type: "title" | "content" | "section" | "image";
    title?: string;
    content?: string[];
    imageUrl?: string;
    layout?: "default" | "two-column" | "full-image";
  }>;
  theme?: "default" | "dark" | "minimal" | "corporate";
  options?: {
    includeProgressBar?: boolean;
    includeSlideNumbers?: boolean;
    aspectRatio?: "16:9" | "4:3";
  };
}

export interface PresentationCreateOutput {
  data: string; // base64 encoded HTML
  filename: string;
  slideCount: number;
}

export const presentationCreateSchema = {
  name: "presentation/create",
  description:
    "Create an HTML presentation (slides) from structured content. Generates a standalone HTML file " +
    "with embedded CSS/JS that can be viewed in any browser. Supports keyboard navigation (arrow keys, space). " +
    "Returns base64-encoded HTML.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Presentation title",
      },
      slides: {
        type: "array",
        description: "Array of slides",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["title", "content", "section", "image"],
            },
            title: { type: "string" },
            content: {
              type: "array",
              items: { type: "string" },
            },
            imageUrl: { type: "string" },
            layout: {
              type: "string",
              enum: ["default", "two-column", "full-image"],
            },
          },
          required: ["type"],
        },
      },
      theme: {
        type: "string",
        enum: ["default", "dark", "minimal", "corporate"],
        description: "Visual theme",
      },
      options: {
        type: "object",
        properties: {
          includeProgressBar: { type: "boolean" },
          includeSlideNumbers: { type: "boolean" },
          aspectRatio: { type: "string", enum: ["16:9", "4:3"] },
        },
      },
    },
    required: ["title", "slides"],
  },
};

const themes: Record<string, { bg: string; text: string; accent: string; font: string }> = {
  default: { bg: "#ffffff", text: "#333333", accent: "#2563eb", font: "system-ui, -apple-system, sans-serif" },
  dark: { bg: "#1a1a2e", text: "#eee", accent: "#4cc9f0", font: "system-ui, -apple-system, sans-serif" },
  minimal: { bg: "#fafafa", text: "#222", accent: "#000", font: "Georgia, serif" },
  corporate: { bg: "#f8f9fa", text: "#212529", accent: "#0066cc", font: "'Segoe UI', Roboto, sans-serif" },
};

export async function presentationCreate(
  input: PresentationCreateInput
): Promise<PresentationCreateOutput> {
  const theme = themes[input.theme || "default"];
  const aspectRatio = input.options?.aspectRatio === "4:3" ? "4/3" : "16/9";

  const slidesHtml = input.slides
    .map((slide, index) => {
      const slideNumber = input.options?.includeSlideNumbers ? index + 1 : null;

      switch (slide.type) {
        case "title":
          return `
            <div class="slide title-slide" data-slide="${index}">
              <h1>${escapeHtml(slide.title || input.title)}</h1>
              ${slideNumber ? `<div class="slide-number">${slideNumber}</div>` : ""}
            </div>`;

        case "section":
          return `
            <div class="slide section-slide" data-slide="${index}">
              <h2>${escapeHtml(slide.title || "")}</h2>
              ${slideNumber ? `<div class="slide-number">${slideNumber}</div>` : ""}
            </div>`;

        case "content": {
          const contentItems = (slide.content || [])
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("\n");
          return `
            <div class="slide content-slide" data-slide="${index}">
              ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ""}
              <ul>${contentItems}</ul>
              ${slideNumber ? `<div class="slide-number">${slideNumber}</div>` : ""}
            </div>`;
        }

        case "image":
          return `
            <div class="slide image-slide" data-slide="${index}">
              ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ""}
              ${slide.imageUrl ? `<img src="${escapeHtml(slide.imageUrl)}" alt="Slide image" />` : ""}
              ${slideNumber ? `<div class="slide-number">${slideNumber}</div>` : ""}
            </div>`;

        default:
          return `<div class="slide" data-slide="${index}">
            <p>Unknown slide type</p>
          </div>`;
      }
    })
    .join("\n");

  const progressBar = input.options?.includeProgressBar
    ? `<div class="progress-bar">
        <div class="progress-fill" id="progress"></div>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(input.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${theme.font};
      background: ${theme.bg};
      color: ${theme.text};
      overflow: hidden;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .presentation {
      width: min(100vw, calc(100vh * ${aspectRatio}));
      height: calc(min(100vw, calc(100vh * ${aspectRatio})) / ${aspectRatio});
      max-width: 1200px;
      position: relative;
      overflow: hidden;
    }
    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.4s ease;
    }
    .slide.active {
      opacity: 1;
      transform: translateX(0);
    }
    .slide.prev {
      transform: translateX(-100%);
    }
    .title-slide {
      text-align: center;
    }
    .title-slide h1 {
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 700;
      color: ${theme.accent};
    }
    .section-slide {
      text-align: center;
      background: ${theme.accent};
      color: ${theme.bg};
    }
    .section-slide h2 {
      font-size: clamp(1.5rem, 4vw, 3rem);
      font-weight: 600;
    }
    .content-slide h2 {
      font-size: clamp(1.2rem, 3vw, 2rem);
      margin-bottom: 30px;
      color: ${theme.accent};
      border-bottom: 3px solid ${theme.accent};
      padding-bottom: 15px;
    }
    .content-slide ul {
      list-style: none;
      font-size: clamp(1rem, 2vw, 1.3rem);
      line-height: 1.8;
    }
    .content-slide li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .content-slide li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: ${theme.accent};
      font-weight: bold;
    }
    .image-slide img {
      max-width: 100%;
      max-height: 70%;
      object-fit: contain;
      margin-top: 20px;
    }
    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 30px;
      font-size: 14px;
      opacity: 0.5;
    }
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(0,0,0,0.1);
    }
    .progress-fill {
      height: 100%;
      background: ${theme.accent};
      width: 0%;
      transition: width 0.3s ease;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    .control-btn {
      padding: 10px 20px;
      background: ${theme.accent};
      color: ${theme.bg};
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .control-btn:hover {
      opacity: 1;
    }
    @media print {
      .slide {
        position: relative;
        opacity: 1;
        transform: none;
        page-break-after: always;
      }
      .controls, .progress-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="presentation">
    ${slidesHtml}
    ${progressBar}
  </div>
  <div class="controls">
    <button class="control-btn" onclick="prevSlide()">◀ Previous</button>
    <button class="control-btn" onclick="nextSlide()">Next ▶</button>
    <button class="control-btn" onclick="window.print()">Print</button>
  </div>
  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === currentSlide) slide.classList.add('active');
        else if (i < currentSlide) slide.classList.add('prev');
      });
      const progress = ((currentSlide + 1) / totalSlides) * 100;
      const progressBar = document.getElementById('progress');
      if (progressBar) progressBar.style.width = progress + '%';
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlides();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlides();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    });

    // Initialize
    updateSlides();
  </script>
</body>
</html>`;

  return {
    data: Buffer.from(html, "utf-8").toString("base64"),
    filename: `${input.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_presentation.html`,
    slideCount: input.slides.length,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
