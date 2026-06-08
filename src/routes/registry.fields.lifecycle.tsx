import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";
import { appendAudit } from "@/lib/audit";
import { assertFieldTransition, canTransition, invalidatePermissionCache } from "@/lib/field-registry";
import { FIELD_STATUSES, type FieldStatus } from "@/db/schema/registry/fields";

export const Route = createFileRoute("/registry/fields/lifecycle")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Mező életciklus" }] }),
  component: LifecyclePage,
});

function LifecyclePage() {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const m: Record<FieldStatus, number> = { active: 0, hidden: 0, disabled: 0, deprecated: 0, archived: 0 };
    for (const f of store.fieldDefinitions) m[f.status]++;
    return m;
  }, []);

  function transition(fieldId: string, to: FieldStatus) {
    const f = store.fieldDefinitions.find((x) => x.id === fieldId);
    if (!f) return;
    if (!canTransition(f.status, to)) return;
    const reason = window.prompt(t("registry.fields.reasonPrompt") ?? "Change reason?");
    try {
      const trimmed = assertFieldTransition(f.status, to, reason);
      const from = f.status;
      f.status = to;
      f.updatedAt = new Date().toISOString();
      if (to === "archived") f.archivedAt = f.updatedAt;
      invalidatePermissionCache(fieldId);
      appendAudit(store.audit, {
        actorId: null, tenantKey: "builder",
        action: "field.status.changed", targetType: "field_definition", targetId: fieldId,
        payload: { from, to, reason: trimmed },
      });
    } catch (err) {
      window.alert((err as Error).message);
    }
  }

  return (
    <BuilderShell title={t("registry.fields.lifecycle")} subtitle={t("registry.fields.lifecycleSubtitle")}>
      <PageHeader title={t("registry.fields.lifecycle")} subtitle={t("registry.fields.lifecycleSubtitle")} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {FIELD_STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="py-4">
              <div className="text-xs uppercase text-muted-foreground">{s}</div>
              <div className="text-2xl font-semibold">{counts[s]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("registry.fields.cols.key")}</TableHead>
            <TableHead>{t("registry.fields.cols.status")}</TableHead>
            <TableHead>{t("registry.fields.transitions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {store.fieldDefinitions.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs">
                  <Link to="/registry/fields/$fieldId" params={{ fieldId: f.id }} className="hover:underline">{f.namespace}.{f.key}</Link>
                </TableCell>
                <TableCell><Badge variant={f.status === "active" ? "default" : "outline"}>{f.status}</Badge></TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {FIELD_STATUSES.filter((s) => canTransition(f.status, s)).map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => transition(f.id, s)}>→ {s}</Button>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
