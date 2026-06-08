import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store, currentUser } from "@/lib/mock-store";
import { fieldLabel } from "@/lib/field-registry";
import {
  canModuleUseNamespace, findOwner, namespaceMatches, transitiveDeps,
} from "@/lib/namespace-ownership";

export const Route = createFileRoute("/modules/$moduleKey/fields")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Modul mezők" }] }),
  notFoundComponent: () => {
    const { t } = useTranslation();
    return <BuilderShell title="404"><div className="text-sm">{t("errors.moduleNotFound")}</div></BuilderShell>;
  },
  loader: ({ params }) => {
    const m = store.modules.find((x) => x.key === params.moduleKey);
    if (!m) throw notFound();
    return { moduleKey: m.key };
  },
  component: ModuleFieldsPage,
});

function ModuleFieldsPage() {
  const { t, i18n } = useTranslation();
  const { moduleKey } = Route.useParams();
  const user = currentUser();
  const isAdmin = !!user && (user.isGlobalSuperadmin || user.roles.includes("builder_admin") || user.roles.includes("superadmin"));

  const m = store.modules.find((x) => x.key === moduleKey)!;
  const bindings = store.moduleNamespaceBindings;
  const deps = useMemo(() => transitiveDeps(moduleKey, store.modules), [moduleKey]);

  // Namespaces this module owns / can use.
  const myNamespaces = useMemo(() => {
    const owned = bindings.filter((b) => b.moduleKey === moduleKey && b.bindingKind === "owner");
    const allowed = bindings.filter((b) => b.moduleKey === moduleKey && (b.bindingKind === "allowed" || b.bindingKind === "required"));
    return { owned, allowed };
  }, [moduleKey, bindings]);

  // Fields whose namespace falls under any of the module's namespaces (dot-prefix).
  const rows = useMemo(() => {
    return store.fieldDefinitions
      .filter((f) => {
        const all = [...myNamespaces.owned, ...myNamespaces.allowed];
        return all.some((b) => namespaceMatches(b.namespace, f.namespace));
      })
      .map((f) => {
        const owner = findOwner(bindings, f.tenantKey, f.namespace);
        const decision = canModuleUseNamespace({
          bindings, moduleKey, moduleDeps: deps, tenantKey: f.tenantKey,
          namespace: f.namespace, isSuperadmin: !!user?.isGlobalSuperadmin,
        });
        return { f, owner, decision };
      });
  }, [bindings, moduleKey, deps, myNamespaces, user]);

  return (
    <BuilderShell title={`${moduleKey} — fields`} subtitle={t("modules.detail.fieldsSubtitle")}>
      <PageHeader title={`${moduleKey} — fields`} subtitle={t("modules.detail.fieldsSubtitle")} />

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary">{t("modules.namespaces.owned")}: {myNamespaces.owned.length}</Badge>
        <Badge variant="outline">{t("modules.namespaces.allowed")}: {myNamespaces.allowed.length}</Badge>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/modules/$moduleKey" params={{ moduleKey }}>{t("common.back")}</Link></Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("registry.fields.cols.key")}</TableHead>
              <TableHead>{t("registry.fields.cols.label")}</TableHead>
              <TableHead>{t("registry.fields.cols.ownerModule")}</TableHead>
              <TableHead>{t("registry.fields.cols.status")}</TableHead>
              <TableHead>{t("modules.namespaces.access")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : rows.map(({ f, owner, decision }) => {
              const label = fieldLabel(store.fieldTranslations, f.currentVersionId ?? "", i18n.language, `${f.namespace}.${f.key}`);
              const isOwn = owner?.moduleKey === moduleKey;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">
                    <Link to="/registry/fields/$fieldId" params={{ fieldId: f.id }} className="hover:underline">
                      {f.namespace}.{f.key}
                    </Link>
                  </TableCell>
                  <TableCell>{label}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={isOwn ? "default" : "outline"}>{owner?.moduleKey ?? "—"}</Badge>
                    {isAdmin && owner && !isOwn && (
                      <span className="ml-1 text-[10px] text-muted-foreground">({owner.namespace})</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant={f.status === "active" ? "default" : "outline"}>{f.status}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={decision.allowed ? "secondary" : "destructive"}>
                      {decision.allowed ? decision.reason : `denied: ${decision.reason}`}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
