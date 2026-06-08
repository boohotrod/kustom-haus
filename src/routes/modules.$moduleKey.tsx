import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store, currentUser } from "@/lib/mock-store";
import { appendAudit } from "@/lib/audit";
import {
  NAMESPACE_BINDING_KINDS, type NamespaceBindingKind,
} from "@/db/schema/registry/moduleNamespaces";
import {
  ChangeReasonRequiredError, requireReason, transitiveDeps,
} from "@/lib/namespace-ownership";

export const Route = createFileRoute("/modules/$moduleKey")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Modul részletek" }] }),
  notFoundComponent: () => {
    const { t } = useTranslation();
    return <BuilderShell title="404"><div className="text-sm">{t("errors.moduleNotFound")}</div></BuilderShell>;
  },
  errorComponent: ({ error }) => <RouteErrorFallback error={error} />,
  loader: ({ params }) => {
    const m = store.modules.find((x) => x.key === params.moduleKey);
    if (!m) throw notFound();
    return { moduleKey: m.key };
  },
  component: ModuleDetailPage,
});

function ModuleDetailPage() {
  const { t } = useTranslation();
  const { moduleKey } = Route.useParams();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const m = store.modules.find((x) => x.key === moduleKey)!;
  const user = currentUser();
  const isAdmin = !!user && (user.isGlobalSuperadmin || user.roles.includes("builder_admin") || user.roles.includes("superadmin"));

  const bindings = useMemo(
    () => store.moduleNamespaceBindings.filter((b) => b.moduleKey === moduleKey),
    [moduleKey],
  );
  const deps = useMemo(() => transitiveDeps(moduleKey, store.modules), [moduleKey]);

  // Reserved is admin-only (B-2.4 decision #2).
  const visibleBindings = bindings.filter((b) => b.bindingKind !== "reserved" || isAdmin);

  const bindingsByKind: Record<NamespaceBindingKind, typeof bindings> = {
    owner: [], allowed: [], required: [], reserved: [],
  };
  for (const b of visibleBindings) bindingsByKind[b.bindingKind].push(b);

  function addBinding() {
    const ns = window.prompt(t("modules.namespaces.namespacePrompt") ?? "namespace?");
    if (!ns?.trim()) return;
    const kind = window.prompt(
      `${t("modules.namespaces.kindPrompt")} (${NAMESPACE_BINDING_KINDS.join(" / ")})`,
    ) as NamespaceBindingKind | null;
    if (!kind || !NAMESPACE_BINDING_KINDS.includes(kind)) return;
    let reason: string;
    try { reason = requireReason("namespace.binding.granted", window.prompt(t("modules.namespaces.reasonPrompt") ?? "")); }
    catch (e) { window.alert((e as Error).message); return; }
    // Enforce single-owner invariant.
    if (kind === "owner") {
      const existingOwner = store.moduleNamespaceBindings.find(
        (b) => b.tenantKey === "builder" && b.bindingKind === "owner" && b.namespace === ns.trim(),
      );
      if (existingOwner) {
        window.alert(`Namespace "${ns.trim()}" already owned by "${existingOwner.moduleKey}".`);
        return;
      }
    }
    const now = new Date().toISOString();
    store.moduleNamespaceBindings.push({
      id: crypto.randomUUID(), tenantKey: "builder",
      moduleKey, namespace: ns.trim(), bindingKind: kind, autoGrantToDependents: false,
      grantedBy: user?.id ?? null, grantReason: reason, createdAt: now, updatedAt: now,
    });
    appendAudit(store.audit, {
      actorId: user?.id ?? null, tenantKey: "builder",
      action: "namespace.binding.granted", targetType: "module", targetId: moduleKey,
      payload: { namespace: ns.trim(), kind, reason },
    });
    rerender();
  }

  function revoke(id: string) {
    const b = store.moduleNamespaceBindings.find((x) => x.id === id);
    if (!b) return;
    let reason: string;
    try { reason = requireReason("namespace.binding.revoked", window.prompt(t("modules.namespaces.reasonPrompt") ?? "")); }
    catch (e) {
      if (e instanceof ChangeReasonRequiredError) window.alert(e.message);
      return;
    }
    store.moduleNamespaceBindings = store.moduleNamespaceBindings.filter((x) => x.id !== id);
    appendAudit(store.audit, {
      actorId: user?.id ?? null, tenantKey: "builder",
      action: "namespace.binding.revoked", targetType: "module", targetId: moduleKey,
      payload: { namespace: b.namespace, kind: b.bindingKind, reason },
    });
    rerender();
  }

  const name = (() => {
    const tk = `modules.catalog.${m.key}.name`;
    const v = t(tk);
    return v === tk ? m.name : v;
  })();
  const desc = t(`modules.catalog.${m.key}.description`, { defaultValue: "" });

  return (
    <BuilderShell title={name} subtitle={m.key}>
      <PageHeader title={name} subtitle={desc} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="secondary">{t(`modules.categories.${m.category}`)}</Badge>
        <Badge variant="outline">{m.roadmapPhase}</Badge>
        <Badge variant={m.state === "in_dev" ? "default" : "outline"}>{t(`modules.states.${m.state}`)}</Badge>
        <Badge variant="outline">{t(`modules.visibility.${m.visibility}`)}</Badge>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/modules/$moduleKey/fields" params={{ moduleKey }}>{t("modules.detail.viewFields")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm"><Link to="/modules">{t("common.back")}</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("modules.detail.dependencies")}</CardTitle></CardHeader>
          <CardContent>
            {m.dependsOn.length === 0 ? <div className="text-sm text-muted-foreground">—</div> : (
              <div className="flex flex-wrap gap-1">
                {m.dependsOn.map((d) => (
                  <Link key={d} to="/modules/$moduleKey" params={{ moduleKey: d }}>
                    <Badge variant="outline" className="font-mono text-[10px] hover:bg-accent">{d}</Badge>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground">
              {t("modules.detail.transitiveDeps")}: <span className="font-mono">{deps.join(", ") || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("modules.namespaces.title")}</CardTitle>
            <Button size="sm" variant="outline" onClick={addBinding}>{t("modules.namespaces.addBinding")}</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["owner", "required", "allowed", "reserved"] as NamespaceBindingKind[]).map((kind) => {
              if (kind === "reserved" && !isAdmin) return null;
              const list = bindingsByKind[kind];
              return (
                <div key={kind}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      {t(`modules.namespaces.${kind}`)} ({list.length})
                    </div>
                  </div>
                  {list.length === 0 ? (
                    <div className="text-xs text-muted-foreground">—</div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {list.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs">
                          <span className="font-mono" title={b.grantReason}>{b.namespace}</span>
                          {b.autoGrantToDependents && (
                            <Badge variant="secondary" className="h-4 text-[9px]">auto→deps</Badge>
                          )}
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => revoke(b.id)}
                            aria-label="revoke"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">{t("modules.detail.bindingDetails")}</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("modules.namespaces.kindLabel")}</TableHead>
                  <TableHead>{t("registry.fields.cols.namespace") || "Namespace"}</TableHead>
                  <TableHead>auto→deps</TableHead>
                  <TableHead>{t("modules.namespaces.grantReason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBindings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell><Badge variant="outline">{b.bindingKind}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{b.namespace}</TableCell>
                    <TableCell className="text-xs">{b.autoGrantToDependents ? "yes" : "no"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.grantReason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </BuilderShell>
  );
}
