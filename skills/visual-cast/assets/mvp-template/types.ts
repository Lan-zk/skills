export type OutputMode = "single_cards" | "merged_long_image";

export type ThemeStyle = "glassmorphism" | "linear_vercel" | "bento_ui";

export interface VisualCastInput {
  content: string;
  outputMode?: OutputMode;
  themeStyle?: ThemeStyle;
  typeHint?: string;
  maxItems?: number;
  width?: number;
  outputEncoding?: "buffer" | "base64" | "file";
  fontFamilySans?: string;
  fontFamilyMono?: string;
}

export interface VisualCastItem {
  type: string;
  title: string;
  summary: string;
  tags: string[];
  metrics: string;
  meta: Record<string, unknown>;
}

export interface RenderItem extends VisualCastItem {
  titleDisplay: string;
  summaryDisplay: string;
  metricsDisplay: string;
  paletteKey: string;
}

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  title: string;
  body: string;
  muted: string;
  accent: string;
  tagBackground: string;
  tagText: string;
  radius: number;
  shadow: string;
}

export interface SingleCardImage {
  index: number;
  type: string;
  title: string;
  mimeType: "image/png";
  encoding: "buffer" | "base64" | "file";
  data: string | Buffer;
}

export interface VisualCastSuccess {
  success: true;
  outputMode: OutputMode;
  themeStyle: ThemeStyle;
  normalizedItems: number;
  images?: SingleCardImage[];
  image?: {
    mimeType: "image/png";
    encoding: "buffer" | "base64" | "file";
    data: string | Buffer;
  };
}

export interface VisualCastFailure {
  success: false;
  errorCode: "NORMALIZATION_FAILED" | "RENDER_FAILED";
  message: string;
  fallbackRendered: boolean;
}

export type VisualCastResult = VisualCastSuccess | VisualCastFailure;
