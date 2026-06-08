import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { store, currentUser } from "@/lib/mock-store";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — BBS AI Builder` }] }),
  loader: ({ params }) => {
    const user = store.users.find((u) => u.username === params.username);
    if (!user) throw notFound();
    return { username: params.username };
  },
  component: PublicProfilePage,
  notFoundComponent: NotFound,
});

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{t("publicProfile.notFound")}</h1>
        <Link to="/" className="text-sm underline mt-3 inline-block">{t("common.back")}</Link>
      </div>
    </div>
  );
}

function PublicProfilePage() {
  const { t } = useTranslation();
  const { username } = Route.useParams();
  const viewer = currentUser();
  const user = store.users.find((u) => u.username === username);

  if (!user) {
    return <NotFound />;
  }

  // SuperAdmin invisibility — block public surface unless viewer is superadmin.
  if (user.isInvisible && !viewer?.isGlobalSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{t("publicProfile.hidden")}</h1>
          <Link to="/" className="text-sm underline mt-3 inline-block">{t("common.back")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-start justify-center">
      <Card className="w-full max-w-xl">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{user.displayName}</h1>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
            <Badge>{t(`profile.types.${user.profileType}`)}</Badge>
          </div>
          {user.bio && <p className="text-sm">{user.bio}</p>}
          <Link to="/" className="text-xs underline">{t("common.back")}</Link>
        </CardContent>
      </Card>
    </div>
  );
}
