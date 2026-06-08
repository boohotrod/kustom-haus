import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/ai")({
  head: () => ({ meta: [{ title: "BBS AI Builder — AI registry" }] }),
  component: AiRegistryPage,
});

function AiRegistryPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("registry.ai.title")} subtitle={t("registry.ai.subtitle")}>
      <PageHeader title={t("registry.ai.title")} subtitle={t("registry.ai.subtitle")} />
      <Badge variant="outline" className="mb-3">{t("common.comingInB2")}</Badge>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Kind</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {store.aiProviders.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.key}</TableCell>
                <TableCell>{p.kind}</TableCell>
                <TableCell><Badge variant={p.status === "dummy" ? "secondary" : "default"}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
