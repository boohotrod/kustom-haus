import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { store, currentUser } from "@/lib/mock-store";
import { filterInvisible } from "@/lib/rbac";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Felhasználók" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const viewer = currentUser();
  const rows = filterInvisible(store.users, viewer);

  return (
    <BuilderShell title={t("users.title")} subtitle={t("users.subtitle")}>
      <PageHeader title={t("users.title")} subtitle={t("users.subtitle")} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.columns.username")}</TableHead>
              <TableHead>{t("users.columns.email")}</TableHead>
              <TableHead>{t("users.columns.type")}</TableHead>
              <TableHead>{t("users.columns.roles")}</TableHead>
              <TableHead>{t("users.columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono">{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{t(`profile.types.${u.profileType}`)}</TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {u.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                </TableCell>
                <TableCell>
                  {u.isInvisible
                    ? <Badge variant="destructive">{t("users.invisible")}</Badge>
                    : <Badge variant="outline">{u.status}</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
