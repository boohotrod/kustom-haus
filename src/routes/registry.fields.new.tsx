import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { store, currentUser } from "@/lib/mock-store";
import { appendAudit } from "@/lib/audit";
import { FIELD_DATA_TYPES, FIELD_ENTITY_TYPES, type FieldDataType, type FieldEntityType } from "@/db/schema/registry/fields";

export const Route = createFileRoute("/registry/fields/new")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Új mező" }] }),
  component: NewFieldPage,
});

function NewFieldPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [namespace, setNamespace] = useState("profile");
  const [key, setKey] = useState("");
  const [ownerModule, setOwnerModule] = useState("identity");
  const [dataType, setDataType] = useState<FieldDataType>("string");
  const [isMultivalue, setIsMultivalue] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [labelEn, setLabelEn] = useState("");
  const [labelHu, setLabelHu] = useState("");
  const [entities, setEntities] = useState<Record<FieldEntityType, boolean>>({} as Record<FieldEntityType, boolean>);
  const [referenceTarget, setReferenceTarget] = useState<FieldEntityType>("profile.workshop");

  function submit() {
    if (!key.trim()) return;
    const me = currentUser();
    const fieldId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const now = new Date().toISOString();
    store.fieldDefinitions.push({
      id: fieldId, tenantKey: "builder", namespace, key, ownerModule,
      dataType, isMultivalue, isRequiredDefault: isRequired,
      status: "active", currentVersionId: versionId,
      createdAt: now, updatedAt: now, archivedAt: null,
    });
    store.fieldVersions.push({
      id: versionId, fieldId, versionNo: 1,
      schema: dataType === "reference" ? { reference: { entityType: referenceTarget } } : {},
      defaultValue: null, changeReason: "wizard.create",
      createdBy: me?.id ?? null, createdAt: now, isCurrent: true,
    });
    if (labelEn) store.fieldTranslations.push({ id: crypto.randomUUID(), fieldVersionId: versionId, locale: "en", label: labelEn });
    if (labelHu) store.fieldTranslations.push({ id: crypto.randomUUID(), fieldVersionId: versionId, locale: "hu", label: labelHu });
    for (const e of FIELD_ENTITY_TYPES) {
      if (entities[e]) {
        store.fieldEntityBindings.push({
          id: crypto.randomUUID(), fieldId, entityType: e,
          isRequired: false, displayOrder: 0, groupKey: null,
        });
      }
    }
    appendAudit(store.audit, {
      actorId: me?.id ?? null, tenantKey: "builder",
      action: "field.definition.created", targetType: "field_definition", targetId: fieldId,
      payload: { namespace, key, dataType },
    });
    void navigate({ to: "/registry/fields/$fieldId", params: { fieldId } });
  }

  return (
    <BuilderShell title={t("registry.fields.new")} subtitle={t("registry.fields.newSubtitle")}>
      <PageHeader title={t("registry.fields.new")} subtitle={t("registry.fields.newSubtitle")} />
      <div className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("registry.fields.cols.namespace")}</Label><Input value={namespace} onChange={(e) => setNamespace(e.target.value)} /></div>
          <div><Label>{t("registry.fields.cols.key")}</Label><Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="engine.displacement_cc" /></div>
          <div><Label>{t("registry.fields.ownerModule")}</Label><Input value={ownerModule} onChange={(e) => setOwnerModule(e.target.value)} /></div>
          <div>
            <Label>{t("registry.fields.cols.dataType")}</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as FieldDataType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_DATA_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {dataType === "reference" && (
          <div>
            <Label>{t("registry.fields.referenceTarget")}</Label>
            <Select value={referenceTarget} onValueChange={(v) => setReferenceTarget(v as FieldEntityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_ENTITY_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t("registry.fields.referenceHint")}</p>
          </div>
        )}

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={isMultivalue} onCheckedChange={(v) => setIsMultivalue(!!v)} /> {t("registry.fields.multivalue")}</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={isRequired} onCheckedChange={(v) => setIsRequired(!!v)} /> {t("registry.fields.required")}</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("registry.fields.labelEn")}</Label><Input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} /></div>
          <div><Label>{t("registry.fields.labelHu")}</Label><Input value={labelHu} onChange={(e) => setLabelHu(e.target.value)} /></div>
        </div>

        <div>
          <Label>{t("registry.fields.entityBindings")}</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {FIELD_ENTITY_TYPES.map((e) => (
              <label key={e} className="flex items-center gap-2 text-xs">
                <Checkbox checked={!!entities[e]} onCheckedChange={(v) => setEntities((s) => ({ ...s, [e]: !!v }))} />
                <span className="font-mono">{e}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={!key.trim()}>{t("common.create")}</Button>
          <Button asChild variant="outline"><Link to="/registry/fields">{t("common.cancel")}</Link></Button>
        </div>
      </div>
    </BuilderShell>
  );
}
