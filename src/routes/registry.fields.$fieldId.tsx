import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";
import { fieldLabel, resolveFieldPermissions } from "@/lib/field-registry";
import { findOwner, namespaceMatches } from "@/lib/namespace-ownership";

export const Route = createFileRoute("/registry/fields/$fieldId")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Mező részletek" }] }),
  notFoundComponent: () => {
    const { t } = useTranslation();
    return <BuilderShell title="404"><div className="text-sm">{t("errors.fieldNotFound")}</div></BuilderShell>;
  },
  errorComponent: ({ error }) => <RouteErrorFallback error={error} />,
  loader: ({ params }) => {
    const f = store.fieldDefinitions.find((x) => x.id === params.fieldId);
    if (!f) throw notFound();
    return { fieldId: f.id };
  },
  component: FieldDetailPage,
});

function FieldDetailPage() {
  const { t, i18n } = useTranslation();
  const { fieldId } = Route.useParams();
  const [tab, setTab] = useState("overview");

  const field = store.fieldDefinitions.find((x) => x.id === fieldId)!;
  const versions = useMemo(() => store.fieldVersions.filter((v) => v.fieldId === fieldId).sort((a, b) => b.versionNo - a.versionNo), [fieldId]);
  const translations = useMemo(() => store.fieldTranslations.filter((tr) => versions.some((v) => v.id === tr.fieldVersionId)), [versions]);
  const permissions = useMemo(() => store.fieldPermissions.filter((p) => p.fieldId === fieldId), [fieldId]);
  const taxBindings = useMemo(() => store.fieldTaxonomyBindings.filter((b) => b.fieldId === fieldId), [fieldId]);
  const entityBindings = useMemo(() => store.fieldEntityBindings.filter((b) => b.fieldId === fieldId), [fieldId]);
  const auditRows = useMemo(() => store.audit.filter((e) => e.targetType === "field_definition" && e.targetId === fieldId), [fieldId]);

  const label = fieldLabel(store.fieldTranslations, field.currentVersionId ?? "", i18n.language, `${field.namespace}.${field.key}`);

  return (
    <BuilderShell title={label} subtitle={`${field.namespace}.${field.key}`}>
      <PageHeader title={label} subtitle={`${field.namespace}.${field.key}`} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant={field.status === "active" ? "default" : "outline"}>{field.status}</Badge>
        <Badge variant="secondary">{field.dataType}{field.isMultivalue ? "[]" : ""}</Badge>
        <Badge variant="outline">{field.ownerModule}</Badge>
        <Badge variant="outline">tenant: {field.tenantKey}</Badge>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/registry/fields/$fieldId/values" params={{ fieldId }}>{t("registry.fields.tabs.values")}</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/registry/fields">{t("common.back")}</Link></Button>
        </div>
      </div>

      {(() => {
        const owner = findOwner(store.moduleNamespaceBindings, field.tenantKey, field.namespace);
        const consumers = store.moduleNamespaceBindings.filter(
          (b) => b.bindingKind !== "owner" && b.bindingKind !== "reserved" && namespaceMatches(b.namespace, field.namespace),
        );
        return (
          <div className="mb-4 rounded-md border p-3 text-xs">
            <div className="font-semibold mb-1">{t("registry.fields.namespaceUsage.title")}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{t("registry.fields.namespaceUsage.owner")}:</span>
              {owner ? (
                <Link to="/modules/$moduleKey" params={{ moduleKey: owner.moduleKey }}>
                  <Badge variant="default" className="hover:bg-primary/80">{owner.moduleKey}</Badge>
                </Link>
              ) : <Badge variant="destructive">no_owner</Badge>}
              <span className="ml-3 text-muted-foreground">{t("registry.fields.namespaceUsage.usedBy")}:</span>
              {consumers.length === 0 ? <span className="text-muted-foreground">—</span> :
                consumers.map((c) => (
                  <Link key={c.id} to="/modules/$moduleKey" params={{ moduleKey: c.moduleKey }}>
                    <Badge variant="outline" className="hover:bg-accent" title={c.grantReason}>
                      {c.moduleKey} <span className="ml-1 text-[9px] uppercase">{c.bindingKind}</span>
                    </Badge>
                  </Link>
                ))
              }
            </div>
          </div>
        );
      })()}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("registry.fields.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="versions">{t("registry.fields.tabs.versions")}</TabsTrigger>
          <TabsTrigger value="translations">{t("registry.fields.tabs.translations")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("registry.fields.tabs.permissions")}</TabsTrigger>
          <TabsTrigger value="taxonomy">{t("registry.fields.tabs.taxonomy")}</TabsTrigger>
          <TabsTrigger value="entities">{t("registry.fields.tabs.entities")}</TabsTrigger>
          <TabsTrigger value="audit">{t("registry.fields.tabs.audit")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-md border p-4 text-sm space-y-1 font-mono">
            <div><b>key:</b> {field.namespace}.{field.key}</div>
            <div><b>dataType:</b> {field.dataType}{field.isMultivalue ? " (multivalue)" : ""}</div>
            <div><b>required:</b> {field.isRequiredDefault ? "yes" : "no"}</div>
            <div><b>status:</b> {field.status}</div>
            <div><b>currentVersion:</b> v{versions.find((v) => v.isCurrent)?.versionNo ?? "—"}</div>
            <div><b>createdAt:</b> {field.createdAt}</div>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>v#</TableHead><TableHead>current</TableHead><TableHead>change_reason</TableHead><TableHead>created</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">v{v.versionNo}</TableCell>
                    <TableCell>{v.isCurrent ? <Badge>current</Badge> : null}</TableCell>
                    <TableCell className="text-xs">{v.changeReason ?? "—"}</TableCell>
                    <TableCell className="text-xs">{v.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Link to="/registry/fields/$fieldId/versions/$versionNo" params={{ fieldId, versionNo: String(v.versionNo) }} className="text-xs underline">diff</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="translations" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>v#</TableHead><TableHead>locale</TableHead><TableHead>label</TableHead><TableHead>help</TableHead></TableRow></TableHeader>
              <TableBody>
                {translations.map((tr) => {
                  const v = versions.find((vv) => vv.id === tr.fieldVersionId);
                  return (
                    <TableRow key={tr.id}>
                      <TableCell className="font-mono">v{v?.versionNo}</TableCell>
                      <TableCell className="font-mono text-xs">{tr.locale}</TableCell>
                      <TableCell>{tr.label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tr.help ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>subject_kind</TableHead><TableHead>subject_id</TableHead><TableHead>permission</TableHead><TableHead>effect</TableHead></TableRow></TableHeader>
              <TableBody>
                {permissions.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">{t("common.empty")}</TableCell></TableRow>
                  : permissions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Badge variant="outline">{p.subjectKind}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{p.subjectId}</TableCell>
                      <TableCell><Badge variant="secondary">{p.permission}</Badge></TableCell>
                      <TableCell><Badge variant={p.effect === "deny" ? "destructive" : "default"}>{p.effect}</Badge></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {t("registry.fields.cacheNote")}: <span className="font-mono">builder_admin → {resolveFieldPermissions(permissions, fieldId, "role", "builder_admin").join(", ") || "—"}</span>
          </div>
        </TabsContent>

        <TabsContent value="taxonomy" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>node</TableHead><TableHead>binding</TableHead></TableRow></TableHeader>
              <TableBody>
                {taxBindings.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-4">{t("common.empty")}</TableCell></TableRow>
                  : taxBindings.map((b) => {
                    const node = store.taxonomies.find((tx) => tx.id === b.taxonomyNodeId);
                    return <TableRow key={b.id}><TableCell className="font-mono text-xs">{node ? `${node.scope}:${node.key}` : b.taxonomyNodeId}</TableCell><TableCell><Badge variant="outline">{b.bindingKind}</Badge></TableCell></TableRow>;
                  })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>entity_type</TableHead><TableHead>group</TableHead><TableHead>order</TableHead><TableHead>required</TableHead></TableRow></TableHeader>
              <TableBody>
                {entityBindings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.entityType}</TableCell>
                    <TableCell className="text-xs">{b.groupKey ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{b.displayOrder}</TableCell>
                    <TableCell>{b.isRequired ? "yes" : "no"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>ts</TableHead><TableHead>action</TableHead><TableHead>payload</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditRows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.seq}</TableCell>
                    <TableCell className="text-xs">{new Date(e.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{e.action}</TableCell>
                    <TableCell className="font-mono text-[10px]">{JSON.stringify(e.payload)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </BuilderShell>
  );
}
