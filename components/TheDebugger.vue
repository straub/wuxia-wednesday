<template>
  <OSidebar
    :open="isOpen"
    :fullheight="false"
    :fullwidth="false"
    :overlay="false"
    :right="true"
    :can-cancel="false"
  >
    <div v-if="isOpen">
      <slot />
    </div>
  </OSidebar>
</template>

<script setup lang="ts">
import { OSidebar } from '@oruga-ui/oruga-next';

const isOpen = ref(false);

const keyComboHandler = ({ ctrlKey, altKey, shiftKey, key }: KeyboardEvent) => {
  if (ctrlKey && altKey && shiftKey && key === 'D') {
    isOpen.value = !isOpen.value;
  }
};

onMounted(() => window.addEventListener('keydown', keyComboHandler));
onUnmounted(() => window.removeEventListener('keydown', keyComboHandler));

if (process.env.NODE_ENV === 'development') {
  const { default: Stats } = await import('stats.js');

  const stats = new Stats();

  function loop () {
    stats.update();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  onMounted(() => document.body.appendChild(stats.dom));
  onUnmounted(() => stats.dom.remove());
}
</script>
