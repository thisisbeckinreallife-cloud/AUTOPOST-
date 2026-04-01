"use client";

import { useParams } from "next/navigation";
import { SmartUploadWizard } from "@/components/upload/smart-upload-wizard";

export default function UploadPage() {
  const { slug } = useParams() as { slug: string };

  return <SmartUploadWizard businessSlug={slug} />;
}
