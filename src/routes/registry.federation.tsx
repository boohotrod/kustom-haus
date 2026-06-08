import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/federation")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Federation" }] }),
  component: FederationPage,
});

function FederationPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("registry.federation.title")} subtitle={t("registry.federation.subtitle")}>
      <PageHeader title={t("registry.federation.title")} subtitle={t("registry.federation.subtitle")} />
      <Badge variant="outline" className="mb-3">{t("common.comingInB2")}</Badge>
      {store.peers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{t("common.empty")}</CardContent></Card>
      ) : (
        <ul className="space-y-2">
          {store.peers.map((p) => (
            <li key={p.id} className="border rounded-md p-3 flex items-center justify-between">
              <span className="font-mono text-sm">{p.peerKey} → {p.baseUrl}</span>
              <Badge>{p.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </BuilderShell>
  );
}
