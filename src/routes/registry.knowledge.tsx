import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/knowledge")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Knowledge map" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("registry.knowledge.title")} subtitle={t("registry.knowledge.subtitle")}>
      <PageHeader title={t("registry.knowledge.title")} subtitle={t("registry.knowledge.subtitle")} />
      <Badge variant="outline" className="mb-3">{t("common.comingInB2")}</Badge>
      <div className="grid md:grid-cols-3 gap-3">
        {store.knowledgeNodes.map((n) => (
          <Card key={n.id}>
            <CardHeader><CardTitle className="text-sm">{n.title}</CardTitle></CardHeader>
            <CardContent><Badge variant="outline">{n.kind}</Badge></CardContent>
          </Card>
        ))}
      </div>
    </BuilderShell>
  );
}
