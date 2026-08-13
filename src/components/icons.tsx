import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg(props: P) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} />
  );
}

export const IconPlus = (p: P) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconBoards = (p: P) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16" /></Svg>
);
export const IconSkills = (p: P) => (
  <Svg {...p}><path d="M5 5h14v14H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></Svg>
);
export const IconSprite = (p: P) => (
  <Svg {...p} data-testid="sprite-placeholder-icon"><circle cx="12" cy="12" r="7" /><path d="M12 9v6" /></Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.5-3.5" /></Svg>
);
export const IconCube = (p: P) => (
  <Svg {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></Svg>
);
export const IconMic = (p: P) => (
  <Svg {...p}><rect x="9" y="4" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0012 0M12 17v3" /></Svg>
);
export const IconSend = (p: P) => (
  <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
);
export const IconGlobe = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M3 12h18M12 4a14 14 0 010 16M12 4a14 14 0 000 16" /></Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}><path d="M5 13l4 4L19 7" /></Svg>
);
export const IconFiles = (p: P) => (
  <Svg {...p}><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 9h8M8 13h8" /></Svg>
);
export const IconFolder = (p: P) => (
  <Svg {...p}><path d="M3 8h6l2 2h10v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></Svg>
);
export const IconShare = (p: P) => (
  <Svg {...p}><path d="M12 5v10M8 9l4-4 4 4" /><path d="M5 15v3h14v-3" /></Svg>
);
export const IconCopy = (p: P) => (
  <Svg {...p}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 16V5h11" /></Svg>
);
export const IconRocket = (p: P) => (
  <Svg {...p}><path d="M12 19c-3 0-5-2-5-5 4-1 7-4 8-8 4 1 6 4 5 8-4 1-7 4-8 5z" /><circle cx="14" cy="10" r="1" /></Svg>
);
export const IconPaperclip = (p: P) => (
  <Svg {...p}><path d="M8 12l7-7a3 3 0 114 4l-9 9a4 4 0 11-6-6l8-8" /></Svg>
);
export const IconNodes = (p: P) => (
  <Svg {...p}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="10" cy="18" r="2" /><path d="M8 7l8 1M7 8l2 8M16 10l-5 7" /></Svg>
);
export const IconPen = (p: P) => (
  <Svg {...p}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" /></Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M4 16l5-4 4 3 7-6" /></Svg>
);
export const IconSlides = (p: P) => (
  <Svg {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 20h8" /></Svg>
);
export const IconVideo = (p: P) => (
  <Svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></Svg>
);
export const IconWeb = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></Svg>
);
export const IconResearch = (p: P) => (
  <Svg {...p}><circle cx="10" cy="10" r="5" /><path d="M14 14l7 7" /></Svg>
);
export const IconChat = (p: P) => (
  <Svg {...p}><path d="M5 6h14v10H8l-3 3V6z" /></Svg>
);
export const IconRobot = (p: P) => (
  <Svg {...p}><rect x="6" y="8" width="12" height="10" rx="2" /><path d="M12 4v4M9 12h.01M15 12h.01" /></Svg>
);
export const IconSave = (p: P) => (
  <Svg {...p}><path d="M5 5h11l3 3v11H5V5z" /><path d="M8 5v5h8" /></Svg>
);
export const IconRetry = (p: P) => (
  <Svg {...p}><path d="M20 12a8 8 0 10-2.3 5.5M20 12V6m0 6h-6" /></Svg>
);
export const IconUp = (p: P) => (
  <Svg {...p}><path d="M12 18V6M7 11l5-5 5 5" /></Svg>
);
export const IconTranslate = (p: P) => (
  <Svg {...p}><path d="M5 8h8M9 8c0 6-4 8-4 8M13 8c0 6 4 8 4 8M4 18h8M14 14l6 6M20 14l-6 6" /></Svg>
);
export const IconSpark = (p: P) => (
  <Svg {...p}><path d="M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3z" /></Svg>
);
export const IconAa = (p: P) => (
  <Svg {...p}><path d="M5 17L10 5h2l5 12M7 13h8" /></Svg>
);
export const IconCover = (p: P) => (
  <Svg {...p}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M8 14h8" /></Svg>
);
export const IconThumb = (p: P) => (
  <Svg {...p}><path d="M8 10v10H5V10h3zm3 10h7l2-8h-6V7a2 2 0 00-2-2h-1v5" /></Svg>
);
export const IconThumbDown = (p: P) => (
  <Svg {...p}><path d="M16 14V4h3v10h-3zm-3-10H6L4 12h6v5a2 2 0 002 2h1V14" /></Svg>
);
export const IconWand = (p: P) => (
  <Svg {...p}><path d="M5 19l9-9M14 6l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></Svg>
);
export const IconHouse = (p: P) => (
  <Svg {...p}><path d="M4 11l8-7 8 7v9H4v-9z" /></Svg>
);
export const IconBolt = (p: P) => (
  <Svg {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" /></Svg>
);
