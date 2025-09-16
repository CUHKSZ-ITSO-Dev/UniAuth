export interface ModelConfig {
  approach_name: string;
  pricing: string; // JSONB
  discount: number;
  client_type: string;
  client_args: string; // JSONB
  request_args: string; // JSONB
  servicewares: string[]; // VARCHAR(255)[]
  updated_at: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}