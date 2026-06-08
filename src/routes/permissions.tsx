import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/permissions")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Permissions" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("permissions.title")} subtitle={t("permissions.subtitle")}>
      <PageHeader title={t("permissions.title")} subtitle={t("permissions.subtitle")} />
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("permissions.columns.key")}</TableHead>
              <TableHead>{t("permissions.columns.module")}</TableHead>
              <TableHead>{t("permissions.columns.function")}</TableHead>
              <TableHead>{t("permissions.columns.action")}</TableHead>
              <TableHead>{t("permissions.columns.description")}</TableHead>
              <TableHead className="text-right">{t("roles.title")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.permissions.map((p) => {
              const roles = store.rolePermissions.filter((rp) => rp.permissionKey === p.key);
              return (
                <TableRow key={p.key}>
                  <TableCell className="font-mono text-xs">{p.key}</TableCell>
                  <TableCell><Badge variant="outline">{p.module}</Badge></TableCell>
                  <TableCell>{p.function}</TableCell>
                  <TableCell>{p.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1 flex-wrap justify-end">
                      {roles.map((r) => (
                        <Badge key={r.roleKey} variant={r.effect === "deny" ? "destructive" : "secondary"}>
                          {r.roleKey}
                        </Badge>
                      ))}
                    </div>
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
