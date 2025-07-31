import { use } from "react";
import UserSettingsFormAdmin from "@/modules/dashboard/settings/ui/components/forms/userSettingsFormAdmin";

export default function Page({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = use(params);
  return <UserSettingsFormAdmin coachId={coachId} />;
}
