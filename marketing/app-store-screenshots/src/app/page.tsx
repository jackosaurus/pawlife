"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toPng } from "html-to-image";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Design canvas (6.9" iPhone — Apple's largest required size)
const W = 1320;
const H = 2868;

// iPhone mockup dimensions (mockup.png ships at exactly these px)
const MK_W = 1022;
const MK_H = 2082;

// Pre-measured screen window inside the mockup PNG
const SC_L = 5.09;   // left %
const SC_T = 2.21;   // top %
const SC_W = 89.82;  // width %
const SC_H = 95.58;  // height %
const SC_RX = 13.73; // border-radius x %
const SC_RY = 6.33;  // border-radius y %

// Brand tokens
const CREAM = "#FFF8E7";
const PLUM = "#4A2157";
const GRAY = "#7A756E";

// Export sizes (Apple required, portrait, in design-px order)
const IPHONE_SIZES = [
  { label: "6.9\"", w: 1320, h: 2868 },
  { label: "6.5\"", w: 1284, h: 2778 },
  { label: "6.3\"", w: 1206, h: 2622 },
  { label: "6.1\"", w: 1125, h: 2436 },
] as const;

// Image preload list — every asset referenced by the slides
const IMAGE_PATHS = [
  "/mockup.png",
  "/app-icon.png",
  "/welcome-hero.png",
  "/screenshots/en/02-meet.png",
  "/screenshots/en/03-dashboard.png",
  "/screenshots/en/04-pet-detail.png",
  "/screenshots/en/05-medications.png",
];

const imageCache: Record<string, string> = {};

async function preloadAllImages() {
  await Promise.all(
    IMAGE_PATHS.map(async (path) => {
      try {
        const resp = await fetch(path);
        if (!resp.ok) {
          // Missing screenshot is expected before captures land — skip silently.
          return;
        }
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imageCache[path] = dataUrl;
      } catch {
        // Network/missing — leave the cache entry empty; helpers handle absence.
      }
    }),
  );
}

function img(path: string): string {
  return imageCache[path] || path;
}

function hasImage(path: string): boolean {
  return Boolean(imageCache[path]);
}

// ---------------------------------------------------------------------------
// Frame copy (locked)
// ---------------------------------------------------------------------------

type FrameCopy = {
  id: string;
  headline: string;
  subhead: string;
  capturePath?: string;
  captureFilename?: string;
};

const FRAMES: FrameCopy[] = [
  {
    id: "hero",
    headline: "For your pet family.",
    subhead: "Track health, food, and the small moments — together.",
  },
  {
    id: "meet",
    headline: "Hi, I'm Jack.",
    subhead: "Built on nights and weekends, for pets like yours.",
    capturePath: "/screenshots/en/02-meet.png",
    captureFilename: "02-meet.png",
  },
  {
    id: "dashboard",
    headline: "One quiet home screen.",
    subhead: "Everyone's care, gently kept.",
    capturePath: "/screenshots/en/03-dashboard.png",
    captureFilename: "03-dashboard.png",
  },
  {
    id: "pet-detail",
    headline: "Care, gently kept.",
    subhead:
      "Vaccinations, meds, weight, food — for each pet, in one place.",
    capturePath: "/screenshots/en/04-pet-detail.png",
    captureFilename: "04-pet-detail.png",
  },
  {
    id: "medications",
    headline: "Knows what's due.",
    subhead: "A gentle nudge when it matters.",
    capturePath: "/screenshots/en/05-medications.png",
    captureFilename: "05-medications.png",
  },
  {
    id: "quietly-yours",
    headline: "Quietly yours.",
    subhead: "No ads. No tracking. No upsells. Ever.",
  },
];

// ---------------------------------------------------------------------------
// Phone frame (iPhone bezel + clipped screen content)
// ---------------------------------------------------------------------------

type PhoneProps = {
  children: ReactNode;
  style?: CSSProperties;
};

function Phone({ children, style }: PhoneProps) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: `${MK_W}/${MK_H}`,
        ...style,
      }}
    >
      <img
        src={img("/mockup.png")}
        alt=""
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
          pointerEvents: "none",
        }}
        draggable={false}
      />
      {/* Screen content sits on top of the bezel, clipped to the screen window */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          overflow: "hidden",
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
          background: CREAM,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status bar + home indicator (white blanks inside the screen)
// ---------------------------------------------------------------------------
//
// Apple's status bar is 59pt tall; home indicator area is 34pt tall.
// On a 2796pt-tall device screen, that's 2.11% top + 1.22% bottom.

const STATUS_BAR_PCT = (59 / 2796) * 100; // ≈ 2.11
const HOME_IND_PCT = (34 / 2796) * 100;   // ≈ 1.22

function ScreenBlanks() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${STATUS_BAR_PCT}%`,
          background: "#FFFFFF",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${HOME_IND_PCT}%`,
          background: "#FFFFFF",
          zIndex: 3,
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// In-device composites for frames 1 + 6
// ---------------------------------------------------------------------------
//
// Sizes are expressed as a fraction of the **device screen width** so the
// composite scales correctly inside whichever bezel size is rendered.
// Screen width inside the bezel ≈ 0.8982 * mockup width ≈ 918px when the
// mockup itself is 1022px. So the device screen ≈ 1185px wide on a 1030px
// bezel inside the 1320px canvas.

function HeroComposite() {
  // Pixel-style sizing is set in `em`-equivalents driven by the screen height.
  // Use absolute % values so the composite scales with the device.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: CREAM,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top 50% — illustration */}
      <div
        style={{
          flex: "0 0 50%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4% 6% 0 6%",
          boxSizing: "border-box",
        }}
      >
        <img
          src={img("/welcome-hero.png")}
          alt="Beau and Remy illustration"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>
      {/* Wordmark + tagline, centered just below the illustration */}
      <div
        style={{
          flex: "0 0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "6%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontWeight: 700,
            color: PLUM,
            // ~88pt at the device's 1290pt screen width.
            fontSize: "7.3cqw",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          Bemy
        </div>
        <div
          style={{
            marginTop: "3%",
            color: GRAY,
            fontSize: "2.3cqw",
            lineHeight: 1.3,
            textAlign: "center",
            padding: "0 8%",
          }}
        >
          A digital home for your pet family.
        </div>
      </div>
      {/* Remaining cream */}
      <div style={{ flex: 1 }} />
    </div>
  );
}

function QuietlyYoursComposite() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: CREAM,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-fraunces), serif",
          fontWeight: 700,
          color: PLUM,
          fontSize: "5cqw",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        <div>No ads.</div>
        <div>No tracking.</div>
        <div>Just your dogs.</div>
      </div>
      <div
        style={{
          marginTop: "8%",
          color: GRAY,
          fontSize: "1.85cqw",
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        Made with care in Australia.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capture composite (frames 2-5)
// ---------------------------------------------------------------------------

type CaptureCompositeProps = {
  capturePath: string;
  captureFilename: string;
};

function CaptureComposite({ capturePath, captureFilename }: CaptureCompositeProps) {
  const present = hasImage(capturePath);
  if (!present) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <ScreenBlanks />
        <div
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontWeight: 700,
            color: PLUM,
            fontSize: "4.5cqw",
            lineHeight: 1.2,
            padding: "0 8%",
          }}
        >
          Drop:
          <br />
          {captureFilename}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: CREAM }}>
      <img
        src={img(capturePath)}
        alt={captureFilename}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
        }}
        draggable={false}
      />
      <ScreenBlanks />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide (one full canvas — composition shell)
// ---------------------------------------------------------------------------

type SlideProps = {
  frame: FrameCopy;
  cW: number;
  cH: number;
};

function Slide({ frame, cW, cH }: SlideProps) {
  // Numeric layout (1320×2868 reference, scaled proportionally to cW/cH)
  const headlineFont = cW * 0.073;
  const subheadFont = cW * 0.029;
  const headlineLineHeight = (100 / 2868) * cH;
  const subheadLineHeight = (46 / 2868) * cH;

  // Vertical regions (% of cH)
  const headlineTopPct = (200 / 2868) * 100;
  const subheadTopPct = (410 / 2868) * 100;
  const deviceTopPct = (640 / 2868) * 100;
  const deviceBottomPct = (88 / 2868) * 100; // bottom safe zone

  // Device width: 1030 / 1320 = 78.03%
  const deviceWidthPct = 78.03;

  let inside: ReactNode;
  if (frame.id === "hero") {
    inside = <HeroComposite />;
  } else if (frame.id === "quietly-yours") {
    inside = <QuietlyYoursComposite />;
  } else {
    inside = (
      <CaptureComposite
        capturePath={frame.capturePath!}
        captureFilename={frame.captureFilename!}
      />
    );
  }

  return (
    <div
      style={{
        width: cW,
        height: cH,
        background: CREAM,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: `${headlineTopPct}%`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-fraunces), serif",
          fontWeight: 700,
          fontSize: `${headlineFont}px`,
          lineHeight: `${headlineLineHeight}px`,
          letterSpacing: "-0.01em",
          color: PLUM,
          padding: "0 6%",
        }}
      >
        {frame.headline}
      </div>
      {/* Subhead */}
      <div
        style={{
          position: "absolute",
          top: `${subheadTopPct}%`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 400,
          fontSize: `${subheadFont}px`,
          lineHeight: `${subheadLineHeight}px`,
          color: GRAY,
          padding: "0 8%",
        }}
      >
        {frame.subhead}
      </div>
      {/* Device — anchored to bottom safe zone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${deviceTopPct}%`,
          bottom: `${deviceBottomPct}%`,
          width: `${deviceWidthPct}%`,
          transform: "translateX(-50%)",
        }}
      >
        <Phone
          style={{
            width: "100%",
            // Container query so cqw works inside Phone children
            containerType: "inline-size",
          }}
        >
          {inside}
        </Phone>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview (auto-scales to fit a card)
// ---------------------------------------------------------------------------

type PreviewProps = {
  frame: FrameCopy;
};

function ScreenshotPreview({ frame }: PreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.2);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerW = entry.contentRect.width;
        if (containerW > 0) {
          setScale(containerW / W);
        }
      }
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        aspectRatio: `${W}/${H}`,
        position: "relative",
        overflow: "hidden",
        background: CREAM,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Slide frame={frame} cW={W} cH={H} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScreenshotsPage() {
  const [ready, setReady] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    preloadAllImages().then(() => setReady(true));
  }, []);

  const size = IPHONE_SIZES[sizeIdx];

  async function captureSlide(
    el: HTMLElement,
    w: number,
    h: number,
  ): Promise<string> {
    el.style.left = "0px";
    el.style.opacity = "1";
    el.style.zIndex = "-1";
    const opts = { width: w, height: h, pixelRatio: 1, cacheBust: true };
    // Double-call: first warms fonts/images, second produces clean output.
    await toPng(el, opts);
    const dataUrl = await toPng(el, opts);
    el.style.left = "-9999px";
    el.style.opacity = "";
    el.style.zIndex = "";
    return dataUrl;
  }

  async function exportAll() {
    if (exporting) return;
    for (let i = 0; i < FRAMES.length; i++) {
      setExporting(`${i + 1}/${FRAMES.length}`);
      const el = exportRefs.current[i];
      if (!el) continue;
      const dataUrl = await captureSlide(el, size.w, size.h);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${String(i + 1).padStart(2, "0")}-${FRAMES[i].id}-en-${size.w}x${size.h}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 300));
    }
    setExporting(null);
  }

  if (!ready) {
    return (
      <div style={{ padding: 40, fontSize: 14, color: "#6b7280" }}>
        Loading images…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            overflowX: "auto",
            minWidth: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
            Bemy · App Store screenshots
          </span>
          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
            iPhone · English · 6 frames
          </span>
          <select
            value={sizeIdx}
            onChange={(e) => setSizeIdx(Number(e.target.value))}
            style={{
              fontSize: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "5px 10px",
            }}
          >
            {IPHONE_SIZES.map((s, i) => (
              <option key={i} value={i}>
                {s.label} — {s.w}×{s.h}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "10px 16px",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={exportAll}
            disabled={!!exporting}
            style={{
              padding: "7px 20px",
              background: exporting ? "#93c5fd" : "#4A2157",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: exporting ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {exporting ? `Exporting… ${exporting}` : "Export All"}
          </button>
        </div>
      </div>

      {/* Preview grid */}
      <div
        style={{
          padding: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
          maxWidth: 1600,
          margin: "0 auto",
        }}
      >
        {FRAMES.map((frame, i) => (
          <div
            key={frame.id}
            data-frame-id={frame.id}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <ScreenshotPreview frame={frame} />
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
              {String(i + 1).padStart(2, "0")} · {frame.id}
            </div>
          </div>
        ))}
      </div>

      {/* Offscreen export elements at true resolution */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
      >
        {FRAMES.map((frame, i) => (
          <div
            key={frame.id}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: size.w, height: size.h }}
          >
            <Slide frame={frame} cW={size.w} cH={size.h} />
          </div>
        ))}
      </div>
    </div>
  );
}
