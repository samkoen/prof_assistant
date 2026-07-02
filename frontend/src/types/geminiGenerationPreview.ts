export interface GeminiSourcePreviewItem {
  id: number;
  original_filename: string;
  source_type: "exercises_file" | "course_file";
  use_as_style: boolean;
  use_as_content: boolean;
  text_preview: string;
}

export interface GeminiGenerationPreview {
  instructions: string[];
  total_questions: number;
  sources: GeminiSourcePreviewItem[];
  ai_summary: string;
}
