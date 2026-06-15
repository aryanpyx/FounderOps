"use client";

import { Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface ModelSettingsProps {
  currentModel: string;
}

// Model selection is environment-driven (cloud only). The provider is chosen by
// which API key is configured: OpenAI gpt-4o-mini > NVIDIA NIM > Groq.
export function ModelSettings({ currentModel: _currentModel }: ModelSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>
          Your assistant runs on a managed cloud LLM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Cloud className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Cloud · NVIDIA NIM (GPT-OSS 120B)</p>
            <p className="text-xs text-muted-foreground">
              128k context · free tier · no setup required
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
