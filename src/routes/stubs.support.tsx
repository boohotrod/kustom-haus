import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/stubs/support")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Support stub" }] }),
  component: StubPage,
});

function StubPage() {
  const { t } = useTranslation();
  const label = t("nav.support");
  return (
    <BuilderShell title={t("stubs.title", { module: label })}>
      <PageHeader title={t("stubs.title", { module: label })} />
      <Card><CardContent className="py-10 text-center space-y-3">
        <Badge variant="outline">{t("common.comingInB2")}</Badge>
        <p className="text-sm text-muted-foreground">{t("stubs.description")}</p>
      </CardContent></Card>
    </BuilderShell>
  );
}
