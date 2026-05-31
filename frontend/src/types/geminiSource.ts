export type GeminiSourceType = "exercises_file" | "course_file";

export interface GeminiSource {
  id: number;
  exam_id: number;
  source_type: GeminiSourceType;
  original_filename: string;
  char_count: number;
  use_as_style: boolean;
  use_as_content: boolean;
  created_at: string;
}
