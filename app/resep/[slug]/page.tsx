import { Suspense } from "react";
import DetailResepClient from "./DetailResepClient";

export default function DetailResepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xs font-bold text-gray-400">Memuat resep...</p>
        </div>
      }
    >
      <DetailResepWrapper params={params} />
    </Suspense>
  );
}

async function DetailResepWrapper({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <DetailResepClient slug={resolvedParams.slug} />;
}
