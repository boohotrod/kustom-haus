import { useTranslation } from "react-i18next";
import { BuilderShell } from "@/components/builder/BuilderShell";

export function RouteErrorFallback({ error }: { error: unknown }) {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("errors.title")}>
      <div className="text-sm text-destructive">{String(error)}</div>
    </BuilderShell>
  );
}
