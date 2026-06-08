import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";
import { fieldLabel } from "@/lib/field-registry";
import { findOwner } from "@/lib/namespace-ownership";
import { FIELD_STATUSES } from "@/db/schema/registry/fields";

export const Route = createFileRoute("/registry/fields/")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Dynamic Field Registry" }] }),
  component: FieldsListPage,
});

const ALL = "__all__";

function FieldsListPage() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [namespace, setNamespace] = useState<string>(ALL);

  const namespaces = useMemo(
    () => Array.from(new Set(store.fieldDefinitions.map((f) => f.namespace))).sort(),
    [],
  );

  const valueCountByField = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of store.fieldValues) m.set(v.fieldId, (m.get(v.fieldId) ?? 0) + 1);
    return m;
  }, []);

  const rows = useMemo(() => {
    return store.fieldDefinitions.filter((f) => {
      if (status !== ALL && f.status !== status) return false;
      if (namespace !== ALL && f.namespace !== namespace) return false;
      if (q && !`${f.namespace}.${f.key}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, status, namespace]);

  return (
    <BuilderShell title={t("registry.fields.title")} subtitle={t("registry.fields.subtitle")}>
      <PageHeader title={t("registry.fields.title")} subtitle={t("registry.fields.subtitle")} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="w-64 h-9" />
        <Select value={namespace} onValueChange={setNamespace}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder={t("registry.fields.cols.namespace")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("registry.fields.allNamespaces")}</SelectItem>
            {namespaces.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder={t("registry.fields.cols.status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("registry.fields.allStatuses")}</SelectItem>
            {FIELD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/registry/fields/lifecycle">{t("registry.fields.lifecycle")}</Link></Button>
          <Button asChild size="sm"><Link to="/registry/fields/new">{t("registry.fields.new")}</Link></Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("registry.fields.cols.key")}</TableHead>
              <TableHead>{t("registry.fields.cols.label")}</TableHead>
              <TableHead>{t("registry.fields.cols.ownerModule")}</TableHead>
              <TableHead>{t("registry.fields.cols.dataType")}</TableHead>
              <TableHead>{t("registry.fields.cols.status")}</TableHead>
              <TableHead>{t("registry.fields.cols.version")}</TableHead>
              <TableHead>{t("registry.fields.cols.usage")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : rows.map((f) => {
              const version = store.fieldVersions.find((v) => v.id === f.currentVersionId);
              const label = fieldLabel(store.fieldTranslations, f.currentVersionId ?? "", i18n.language, `${f.namespace}.${f.key}`);
              const owner = findOwner(store.moduleNamespaceBindings, f.tenantKey, f.namespace);
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">
                    <Link to="/registry/fields/$fieldId" params={{ fieldId: f.id }} className="hover:underline">
                      {f.namespace}.{f.key}
                    </Link>
                  </TableCell>
                  <TableCell>{label}</TableCell>
                  <TableCell className="text-xs">
                    {owner ? (
                      <Link to="/modules/$moduleKey" params={{ moduleKey: owner.moduleKey }}>
                        <Badge variant="outline" className="hover:bg-accent">{owner.moduleKey}</Badge>
                      </Link>
                    ) : <Badge variant="destructive">no_owner</Badge>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{f.dataType}{f.isMultivalue ? "[]" : ""}</Badge></TableCell>
                  <TableCell><Badge variant={f.status === "active" ? "default" : "outline"}>{f.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">v{version?.versionNo ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{valueCountByField.get(f.id) ?? 0}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
