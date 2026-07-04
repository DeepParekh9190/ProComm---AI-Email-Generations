CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage ai_models" ON ai_models;
CREATE POLICY "Admins can manage ai_models"
  ON ai_models FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "Service role full access ai_models" ON ai_models;
CREATE POLICY "Service role full access ai_models"
  ON ai_models
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO ai_models (name, model_id, is_active, is_default, sort_order)
SELECT * FROM (VALUES
  ('Auto-Select Free (Recommended)', 'openrouter/free', true, true, 1),
  ('Llama 3.3 70B (High Intelligence)', 'meta-llama/llama-3.3-70b-instruct:free', true, false, 2),
  ('Llama 3.2 3B (Fast & Lightweight)', 'meta-llama/llama-3.2-3b-instruct:free', true, false, 3),
  ('Gemma 4 31B (Creative & Professional)', 'google/gemma-4-31b-it:free', true, false, 4),
  ('Qwen 3 Coder (Highly Logical)', 'qwen/qwen3-coder:free', true, false, 5)
) AS v(name, model_id, is_active, is_default, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ai_models LIMIT 1);

CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models (is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_default ON ai_models (is_default);
