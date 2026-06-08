import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store } from "@/lib/mock-store";
import { filterInvisible } from "@/lib/rbac";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BBS AI Builder — Dashboard" },
      { name: "description", content: "Constitutional builder platform for the BBS ecosystem." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const stats = [
    { key: "users", value: filterInvisible(store.users, null).length, to: "/users" },
    { key: "modules", value: store.modules.length, to: "/modules" },
    { key: "decisions", value: store.decisions.length, to: "/decisions" },
    { key: "memoryEntries", value: store.memory.length, to: "/memory" },
  ] as const;

  return (
    <BuilderShell title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.key} to={s.to}>
            <Card className="hover:bg-accent/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {t(`dashboard.stats.${s.key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </BuilderShell>
  );
}
