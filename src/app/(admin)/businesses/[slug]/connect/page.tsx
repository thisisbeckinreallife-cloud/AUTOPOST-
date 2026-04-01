"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { useParams } from "next/navigation";

export default function ConnectPage() {
  const { slug } = useParams() as { slug: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/businesses/${slug}/connect`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to get OAuth URL");
        setLoading(false);
        return;
      }

      // Redirect to Meta OAuth
      window.location.href = data.data.oauthUrl;
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Connect Instagram</h1>
        <p className="text-slate-500 mt-1">
          Connect this business&apos;s professional Instagram account
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-blue-500" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Instagram <strong>Professional</strong> account (Business or Creator)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Connected to a <strong>Facebook Page</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Facebook account must be an admin of that Page
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Meta App Review required</strong> for production use.
              The <code>instagram_content_publish</code> permission requires
              Meta App Review approval before publishing to non-test accounts.
              See the README for setup instructions.
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Button onClick={handleConnect} loading={loading} className="w-full">
        <Instagram className="h-4 w-4 mr-2" />
        Connect via Meta OAuth
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
