import { redirect } from "next/navigation";
import { DEFAULT_YEAR } from "@/lib/awards-data";

export default function AwardsRedirect() {
  redirect(`/awards/${DEFAULT_YEAR}`);
}
