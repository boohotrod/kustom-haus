import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/fields/$fieldId/values")({
  head: () => ({ meta: [{ title: "BBS AI Builder — EAV inspector" }] }),
  notFoundComponent: () => <BuilderShell title="404"><div className="text-sm">Field not found.</div></BuilderShell>,
  errorComponent: ({ error }) => <BuilderShell title="Error"><div className="text-sm text-destructive">{String(error)}</div></BuilderShell>,
  loader: ({ params }) => {
    const f = store.fieldDefinitions.find((x) => x.id === params.fieldId);
    if (!f) throw notFound();
    return { fieldId: f.id };
  },
  component: FieldValuesPage,
});

function FieldValuesPage() {
  const { t } = useTranslation();
  const { fieldId } = Route.useParams();
  const field = store.fieldDefinitions.find((x) => x.id === fieldId)!;
  const values = useMemo(
    () => store.fieldValues.filter((v) => v.fieldId === fieldId).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [fieldId],
  );

  function render(v: (typeof values)[number]) {
    if (v.valueString !== null) return v.valueString;
    if (v.valueNumber !== null) return v.valueNumber;
    if (v.valueBool !== null) return String(v.valueBool);
    if (v.valueDatetime !== null) return v.valueDatetime;
    if (v.valueJson !== null) return JSON.stringify(v.valueJson);
    return "—";
  }

  return (
    <BuilderShell title={t("registry.fields.eavInspector")} subtitle={`${field.namespace}.${field.key}`}>
      <PageHeader title={t("registry.fields.eavInspector")} subtitle={`${field.namespace}.${field.key}`} />
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary">{field.dataType}{field.isMultivalue ? "[]" : ""}</Badge>
        <Badge variant="outline">{values.length} rows</Badge>
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link to="/registry/fields/$fieldId" params={{ fieldId }}>{t("common.back")}</Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>entity</TableHead>
            <TableHead>position</TableHead>
            <TableHead>value</TableHead>
            <TableHead>version</TableHead>
            <TableHead>updated</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {values.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : values.map((v) => {
              const ver = store.fieldVersions.find((vv) => vv.id === v.fieldVersionId);
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.entityType}:{v.entityId.slice(0, 8)}</TableCell>
                  <TableCell className="font-mono text-xs">{v.position ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{render(v)}</TableCell>
                  <TableCell className="font-mono text-xs">v{ver?.versionNo ?? "—"}</TableCell>
                  <TableCell className="text-xs">{v.updatedAt}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
