import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/taxonomy")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Taxonomy" }] }),
  component: TaxonomyPage,
});

function TaxonomyPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("registry.taxonomy.title")} subtitle={t("registry.taxonomy.subtitle")}>
      <PageHeader title={t("registry.taxonomy.title")} subtitle={t("registry.taxonomy.subtitle")} />
      <Badge variant="outline" className="mb-3">{t("common.comingInB2")}</Badge>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Scope</TableHead><TableHead>Key</TableHead><TableHead>Label</TableHead></TableRow></TableHeader>
          <TableBody>
            {store.taxonomies.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell><Badge variant="secondary">{tx.scope}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{tx.key}</TableCell>
                <TableCell>{tx.label}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
