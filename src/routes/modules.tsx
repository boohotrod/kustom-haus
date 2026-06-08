import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { store, currentUser } from "@/lib/mock-store";
import { MODULE_STATES, type ModuleState } from "@/db/schema/project/modules";
import { appendAudit } from "@/lib/audit";

export const Route = createFileRoute("/modules")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Modules" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const { t } = useTranslation();
  const [, force] = useState(0);

  const change = (id: string, next: ModuleState) => {
    const m = store.modules.find((x) => x.id === id);
    if (!m) return;
    const prev = m.state;
    m.state = next;
    appendAudit(store.audit, {
      actorId: currentUser()?.id ?? null,
      action: "project.module.state_changed",
      targetType: "module", targetId: m.key,
      payload: { from: prev, to: next },
    });
    force((n) => n + 1);
  };

  return (
    <BuilderShell title={t("modules.title")} subtitle={t("modules.subtitle")}>
      <PageHeader title={t("modules.title")} subtitle={t("modules.subtitle")} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("modules.columns.key")}</TableHead>
              <TableHead>{t("modules.columns.name")}</TableHead>
              <TableHead>{t("modules.columns.state")}</TableHead>
              <TableHead>{t("modules.columns.visibility")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.modules.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.key}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>
                  <Select value={m.state} onValueChange={(v) => change(m.id, v as ModuleState)}>
                    <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODULE_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{t(`modules.states.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Badge variant="outline">{t(`modules.visibility.${m.visibility}`)}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
