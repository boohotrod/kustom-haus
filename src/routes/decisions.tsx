import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Decisions" }] }),
  component: DecisionsPage,
});

function DecisionsPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("decisions.title")} subtitle={t("decisions.subtitle")}>
      <PageHeader title={t("decisions.title")} subtitle={t("decisions.subtitle")} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("decisions.columns.code")}</TableHead>
              <TableHead>{t("decisions.columns.title")}</TableHead>
              <TableHead>{t("decisions.columns.status")}</TableHead>
              <TableHead>{t("decisions.columns.modules")}</TableHead>
              <TableHead>{t("decisions.columns.date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.decisions.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono">{d.code}</TableCell>
                <TableCell>{d.title}</TableCell>
                <TableCell><Badge variant="secondary">{d.status}</Badge></TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {d.relatedModules.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
