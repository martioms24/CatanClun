import { getPlans } from "@/app/actions/plan-actions";
import { PlansBoard } from "@/components/plans/PlansBoard";
import { Scroll } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlansLlistaPage() {
  const plans = await getPlans();

  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Scroll size={28} />
        Pergamí de Plans
      </h1>
      <p className="page-subtitle">
        Aventures a emprendre amb la colla — completeu-les o descarteu-les.
      </p>
      <PlansBoard initialPlans={plans} />
    </div>
  );
}
