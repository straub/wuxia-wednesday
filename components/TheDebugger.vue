<template>
  <OSidebar
    :open="isOpen"
    fullheight
    :fullwidth="false"
    :overlay="false"
    right
    :can-cancel="false"
    scroll="keep"
    class="the-debugger"
  >
    <div v-if="isOpen">
      <slot />
    </div>
  </OSidebar>
</template>

<script setup lang="ts">
import { OSidebar } from '@oruga-ui/oruga-next';

const isOpen = ref(false);

const { default: Stats } = await import('stats.js');

const stats = new Stats();

function loop () {
  stats.update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const keyComboHandler = ({ ctrlKey, altKey, key }: KeyboardEvent) => {
  if (ctrlKey && altKey && key === 'd') {
    isOpen.value = !isOpen.value;

    if (isOpen.value) {
      document.body.appendChild(stats.dom);
    } else {
      stats.dom.remove();
    }
  }
};

onMounted(() => window.addEventListener('keydown', keyComboHandler));
onUnmounted(() => window.removeEventListener('keydown', keyComboHandler));
onUnmounted(() => stats.dom.remove());
</script>

<style>
.the-debugger .o-side__content {
  width: 300px;
  padding: 20px;
}
</style>
