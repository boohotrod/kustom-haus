import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Roles" }] }),
  component: RolesPage,
});

function RolesPage() {
  const { t } = useTranslation();
  return (
    <BuilderShell title={t("roles.title")} subtitle={t("roles.subtitle")}>
      <PageHeader title={t("roles.title")} subtitle={t("roles.subtitle")} />
      <div className="grid md:grid-cols-2 gap-4">
        {store.roles.map((r) => {
          const grants = store.rolePermissions.filter((p) => p.roleKey === r.key);
          return (
            <Card key={r.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{r.label}</span>
                  <Badge variant="outline">{r.key}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
                <div className="flex flex-wrap gap-1">
                  {grants.length === 0 && <span className="text-xs text-muted-foreground">{t("common.empty")}</span>}
                  {grants.map((g) => (
                    <Badge key={g.permissionKey} variant={g.effect === "deny" ? "destructive" : "secondary"}>
                      {g.permissionKey}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </BuilderShell>
  );
}
