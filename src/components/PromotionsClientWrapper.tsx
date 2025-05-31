"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PromotionsClient from "@/components/PromotionClients";

// Define the type for company
interface Company {
  id: number;
  name: string;
  image: string;
  description?: string | null;
  rate?: string | null;
  contentLink: string;
  tutorialVideo: string;
  thumbnailUrl: string;
}

interface PromotionsClientWrapperProps {
  company: Company;
  companyId: number;
}

export default function PromotionsClientWrapper({ company, companyId }: PromotionsClientWrapperProps) {
  return (
    <ErrorBoundary fallback={<div className="text-red-500">Something went wrong with the 3D content.</div>}>
      <Suspense fallback={<div className="text-white text-center">Loading 3D content...</div>}>
        <PromotionsClient company={company} companyId={companyId} />
      </Suspense>
    </ErrorBoundary>
  );
}