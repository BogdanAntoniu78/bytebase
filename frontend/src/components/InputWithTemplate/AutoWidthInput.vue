<template>
  <div>
    <div ref="divRef" class="fixed invisible text-base leading-6">
      {{ state.data }}
    </div>
    <input
      ref="inputRef"
      v-model="state.data"
      :style="`width: ${state.width}px;`"
      class="px-0 m-0 py-1 cleared-input outline-none"
      type="text"
      @keyup="(e) => $emit('keyup', e)"
      @keydown="(e) => $emit('keydown', e)"
      @mouseup="(e) => $emit('mouseup', e)"
    />
  </div>
</template>

<script lang="ts" setup>
import { watch, reactive, ref, watchEffect, nextTick } from "vue";

const props = defineProps({
  value: {
    default: "",
    type: String,
  },
  maxWidth: {
    default: 0,
    type: Number,
  },
});

const minimumWidth = 1;

const emit = defineEmits<{
  (event: "change", data: string): void;
  (event: "keyup", e: KeyboardEvent): void;
  (event: "keydown", e: KeyboardEvent): void;
  (event: "mouseup", e: KeyboardEvent): void;
}>();

const state = reactive<{ data: string; width: number }>({
  data: props.value,
  width: 0,
});

const inputRef = ref<HTMLInputElement>();
const divRef = ref<HTMLDivElement>();

watch(
  () => state.data,
  (val) => {
    nextTick(updateWidth);
    emit("change", val);
  }
);

watch(
  () => props.value,
  (val) => {
    state.data = val;
    nextTick(updateWidth);
  }
);

const updateWidth = () => {
  const width = divRef.value?.offsetWidth ?? state.width;
  state.width = Math.min(props.maxWidth ?? width, width);
  state.width = Math.max(state.width, minimumWidth);
};

watchEffect(updateWidth);
</script>

<style scoped>
.cleared-input,
.cleared-input:focus {
  @apply shadow-none ring-0 border-0 border-none;
}
</style>
