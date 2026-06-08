import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { RouteErrorFallback } from "@/components/builder/RouteErrorFallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/fields/$fieldId/versions/$versionNo")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Mező verzió diff" }] }),
  notFoundComponent: () => {
    const { t } = useTranslation();
    return <BuilderShell title="404"><div className="text-sm">{t("errors.versionNotFound")}</div></BuilderShell>;
  },
  errorComponent: ({ error }) => <RouteErrorFallback error={error} />,
  loader: ({ params }) => {
    const f = store.fieldDefinitions.find((x) => x.id === params.fieldId);
    if (!f) throw notFound();
    const v = store.fieldVersions.find((vv) => vv.fieldId === f.id && vv.versionNo === Number(params.versionNo));
    if (!v) throw notFound();
    return { fieldId: f.id, versionId: v.id };
  },
  component: VersionDiffPage,
});

function VersionDiffPage() {
  const { t } = useTranslation();
  const { fieldId, versionNo } = Route.useParams();
  const field = store.fieldDefinitions.find((x) => x.id === fieldId)!;
  const versions = useMemo(() => store.fieldVersions.filter((v) => v.fieldId === fieldId).sort((a, b) => a.versionNo - b.versionNo), [fieldId]);
  const current = versions.find((v) => v.versionNo === Number(versionNo))!;
  const previous = versions.find((v) => v.versionNo === Number(versionNo) - 1) ?? null;

  const trCurrent = store.fieldTranslations.filter((tr) => tr.fieldVersionId === current.id);
  const trPrevious = previous ? store.fieldTranslations.filter((tr) => tr.fieldVersionId === previous.id) : [];

  return (
    <BuilderShell title={`${field.namespace}.${field.key} — v${current.versionNo}`} subtitle={t("registry.fields.versionDiff")}>
      <PageHeader title={`v${current.versionNo}`} subtitle={`${field.namespace}.${field.key}`} />
      <div className="mb-4 flex items-center gap-2">
        {current.isCurrent && <Badge>current</Badge>}
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link to="/registry/fields/$fieldId" params={{ fieldId }}>{t("common.back")}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase text-muted-foreground mb-2">{t("registry.fields.previousVersion")} {previous ? `(v${previous.versionNo})` : "—"}</h3>
          <pre className="rounded-md border bg-muted/30 p-3 text-xs overflow-auto">
{previous ? JSON.stringify({ schema: previous.schema, defaultValue: previous.defaultValue, translations: trPrevious.map((t) => ({ locale: t.locale, label: t.label })) }, null, 2) : "—"}
          </pre>
        </div>
        <div>
          <h3 className="text-xs uppercase text-muted-foreground mb-2">v{current.versionNo}</h3>
          <pre className="rounded-md border bg-muted/30 p-3 text-xs overflow-auto">
{JSON.stringify({ schema: current.schema, defaultValue: current.defaultValue, translations: trCurrent.map((t) => ({ locale: t.locale, label: t.label })) }, null, 2)}
          </pre>
        </div>
      </div>
    </BuilderShell>
  );
}
