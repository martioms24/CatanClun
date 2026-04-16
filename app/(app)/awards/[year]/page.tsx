import { notFound } from "next/navigation";
import { getAwardsForYear, AVAILABLE_YEARS } from "@/lib/awards-data";
import { AwardsView } from "@/components/awards/AwardsView";
import { Award } from "lucide-react";

export default async function AwardsYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (!AVAILABLE_YEARS.includes(year as (typeof AVAILABLE_YEARS)[number])) {
    notFound();
  }

  const data = getAwardsForYear(year);
  if (!data) notFound();

  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Award size={28} />
        Premis {year}
      </h1>
      <p className="page-subtitle">
        Votacions anuals del Catan Clun — resultats oficials.
      </p>
      <AwardsView data={data} />
    </div>
  );
}
