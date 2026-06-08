import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/registry/federation")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Federation" }] }),
  component: FederationPage,
});

function FederationPage() {
  const { t } = useTranslation();
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(store.peers[0]?.id ?? null);

  const linkedUsers = useMemo(
    () => store.federationUsers.filter((fu) => fu.peerId === selectedPeerId),
    [selectedPeerId],
  );
  const usersById = useMemo(() => new Map(store.users.map((u) => [u.id, u])), []);
  const peer = store.peers.find((p) => p.id === selectedPeerId);

  return (
    <BuilderShell title={t("registry.federation.title")} subtitle={t("registry.federation.subtitle")}>
      <PageHeader title={t("registry.federation.title")} subtitle={t("registry.federation.subtitle")} />

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t("registry.federation.peers")}</h2>
      {store.peers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{t("common.empty")}</CardContent></Card>
      ) : (
        <ul className="space-y-2 mb-6">
          {store.peers.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedPeerId(p.id)}
                className={`w-full text-left border rounded-md p-3 flex items-center justify-between transition ${
                  p.id === selectedPeerId ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <span className="font-mono text-sm">{p.peerKey} → {p.baseUrl}</span>
                <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {t("registry.federation.linkedUsers")}
        {peer ? <span className="ml-2 font-mono text-xs">{peer.peerKey}</span> : null}
      </h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("registry.federation.cols.user")}</TableHead>
              <TableHead>{t("registry.federation.cols.fedUid")}</TableHead>
              <TableHead>{t("registry.federation.cols.source")}</TableHead>
              <TableHead>{t("registry.federation.cols.origin")}</TableHead>
              <TableHead>{t("registry.federation.cols.sync")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  {t("common.empty")}
                </TableCell>
              </TableRow>
            ) : (
              linkedUsers.map((fu) => {
                const u = usersById.get(fu.userId);
                return (
                  <TableRow key={fu.id}>
                    <TableCell className="font-mono text-xs">{u?.username ?? fu.userId.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{fu.bbsFederationUserId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {fu.sourceSystemId}/{fu.sourceTenantId}#{fu.sourceRecordId}
                    </TableCell>
                    <TableCell><Badge variant="outline">{fu.dataOrigin}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={fu.syncStatus === "synced" ? "default" : "outline"}>{fu.syncStatus}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
