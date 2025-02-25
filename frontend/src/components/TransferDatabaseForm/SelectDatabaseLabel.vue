<template>
  <div
    v-if="targetProject.tenantMode === 'TENANT'"
    class="space-y-4 flex flex-col justify-center items-center"
    v-bind="$attrs"
  >
    <div v-for="label in PRESET_LABEL_KEYS" :key="label" class="w-64">
      <label class="textlabel capitalize">
        {{ hidePrefix(label) }}
        <span v-if="isRequiredLabel(label)" style="color: red">*</span>
      </label>

      <div class="flex flex-col space-y-1 w-64 mt-1">
        <BBTextField
          :value="getLabelValue(label)"
          :placeholder="getLabelPlaceholder(label)"
          class="textfield"
          @input="
            setLabelValue(label, ($event.target as HTMLInputElement).value)
          "
        />
      </div>

      <div v-if="isParsedLabel(label)" class="mt-2 textinfolabel">
        <i18n-t keypath="label.parsed-from-template">
          <template #name>{{ database.name }}</template>
          <template #template>
            <code class="text-xs font-mono bg-control-bg">
              {{ targetProject.dbNameTemplate }}
            </code>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>

  <slot name="buttons" :next="next"></slot>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import { computed, reactive, watchEffect, watch } from "vue";
import { capitalize, cloneDeep } from "lodash-es";
import { useI18n } from "vue-i18n";
import type {
  Database,
  DatabaseLabel,
  LabelKeyType,
  LabelValueType,
  Project,
  ProjectId,
} from "@/types";
import {
  buildDatabaseNameRegExpByTemplate,
  hidePrefix,
  parseLabelListInTemplate,
  PRESET_LABEL_KEYS,
  PRESET_LABEL_KEY_PLACEHOLDERS,
} from "@/utils";
import { useProjectStore } from "@/store";

const props = defineProps<{
  database: Database;
  targetProjectId: ProjectId;
}>();

const emit = defineEmits<{
  (event: "next", labelList: DatabaseLabel[]): void;
}>();

const state = reactive({
  databaseLabelList: cloneDeep(props.database.labels),
});

const projectStore = useProjectStore();

const { t } = useI18n();

const targetProject = computed(() => {
  return projectStore.getProjectById(props.targetProjectId) as Project;
});

const prepare = () => {
  projectStore.fetchProjectById(props.targetProjectId);
};

watchEffect(prepare);

const requiredLabelList = computed((): string[] => {
  const project = targetProject.value;
  if (!project.dbNameTemplate) return [];

  // for databases with dbNameTemplate, we need to parse required labels from its template
  return parseLabelListInTemplate(project.dbNameTemplate);
});

const dbNameMatchesTemplate = computed((): boolean => {
  const project = targetProject.value;
  if (!project.dbNameTemplate) {
    // no restrictions, because no template
    return true;
  }
  const regex = buildDatabaseNameRegExpByTemplate(project.dbNameTemplate);
  return regex.test(props.database.name);
});

const isRequiredLabel = (key: LabelKeyType): boolean => {
  return requiredLabelList.value.includes(key);
};

const isParsedLabel = (key: LabelKeyType): boolean => {
  return labelListParsedFromTemplate.value.some((label) => label.key === key);
};

const labelListParsedFromTemplate = computed((): DatabaseLabel[] => {
  if (!dbNameMatchesTemplate.value) return [];

  const regex = buildDatabaseNameRegExpByTemplate(
    targetProject.value.dbNameTemplate
  );
  const match = props.database.name.match(regex);
  if (!match) return [];

  const parsedLabelList: DatabaseLabel[] = [];
  PRESET_LABEL_KEY_PLACEHOLDERS.forEach(([placeholder, key]) => {
    const value = match.groups?.[placeholder];
    if (value) {
      parsedLabelList.push({ key, value });
    }
  });

  return parsedLabelList;
});

watch(labelListParsedFromTemplate, (list) => {
  list.forEach((label) => {
    setLabelValue(label.key, label.value);
  });
});

const getLabelPlaceholder = (key: LabelKeyType): string => {
  // provide "Input Tenant" if Tenant is optional
  // provide "Input {{TENANT}}" if Tenant is required in the template
  key = isRequiredLabel(key)
    ? `{{${hidePrefix(key).toUpperCase()}}}`
    : capitalize(hidePrefix(key));
  return t("create-db.input-label-value", { key });
};

const getLabelValue = (key: LabelKeyType): LabelValueType | undefined => {
  return (
    state.databaseLabelList.find((label) => label.key === key)?.value || ""
  );
};

const setLabelValue = (key: LabelKeyType, value: LabelValueType) => {
  const label = state.databaseLabelList.find((label) => label.key === key);
  if (label) {
    label.value = value;
  } else {
    state.databaseLabelList.push({ key, value });
  }
  state.databaseLabelList = state.databaseLabelList.filter(
    (label) => !!label.value
  );
};

watch(
  () => props.database,
  (db) => {
    state.databaseLabelList = cloneDeep(db.labels);
  }
);

const next = () => {
  emit("next", cloneDeep(state.databaseLabelList));
};
</script>
