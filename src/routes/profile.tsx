import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@/lib/mock-store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Profile" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const user = currentUser();

  if (!user) {
    return (
      <BuilderShell title={t("profile.title")}>
        <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
        <p className="text-sm text-muted-foreground">
          {t("login.title")} — <Link to="/login" className="underline">{t("nav.login")}</Link>
        </p>
      </BuilderShell>
    );
  }

  return (
    <BuilderShell title={t("profile.title")} subtitle={t("profile.subtitle")}>
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">{user.displayName}</div>
              <div className="text-sm text-muted-foreground">@{user.username} · {user.email}</div>
            </div>
            <Badge>{t(`profile.types.${user.profileType}`)}</Badge>
          </div>
          {user.bio && <p className="text-sm">{user.bio}</p>}
          <div className="flex gap-2 flex-wrap pt-2">
            {user.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
          </div>
          <div className="text-xs text-muted-foreground pt-2">
            Public URL: <Link to="/u/$username" params={{ username: user.username }} className="underline">/u/{user.username}</Link>
          </div>
        </CardContent>
      </Card>
    </BuilderShell>
  );
}
