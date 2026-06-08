import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StubKey = "support" | "travel" | "media" | "garage";

function stubRoute(key: StubKey) {
  return createFileRoute(`/stubs/${key}` as `/stubs/${StubKey}`)({
    head: () => ({ meta: [{ title: `BBS AI Builder — ${key}` }] }),
    component: () => <StubPage moduleKey={key} />,
  });
}

export const supportRoute = stubRoute("support");
export const travelRoute = stubRoute("travel");
export const mediaRoute = stubRoute("media");
export const garageRoute = stubRoute("garage");

function StubPage({ moduleKey }: { moduleKey: StubKey }) {
  const { t } = useTranslation();
  const label = t(`nav.${moduleKey}`);
  return (
    <BuilderShell title={t("stubs.title", { module: label })}>
      <PageHeader title={t("stubs.title", { module: label })} />
      <Card><CardContent className="py-10 text-center space-y-3">
        <Badge variant="outline">{t("common.comingInB2")}</Badge>
        <p className="text-sm text-muted-foreground">{t("stubs.description")}</p>
      </CardContent></Card>
    </BuilderShell>
  );
}
