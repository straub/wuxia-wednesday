<template>
  <h1
    :class="{ glitch: isGlitching }"
    data-text="Wuxia Wednesday"
  >
    Wuxia Wednesday
    <OIcon
      v-if="isLoading"
      icon="loading"
      spin
      size="medium"
    />
  </h1>
</template>

<script setup lang="ts">
import { OIcon } from '@oruga-ui/oruga-next';

const props = defineProps<{
  isGlitching: Boolean,
  isLoading: Boolean,
}>();
const emit = defineEmits(['update:isGlitching']);

watch(() => props.isGlitching, (newValue) => {
  if (newValue) {
    setTimeout(() => emit('update:isGlitching', false), 1000 + 2000 * Math.random());
  }
});
</script>

<style lang="scss">
h1 {
  position: fixed;
  left: 1rem;
  bottom: 1.5rem;
  margin: 0;
  width: 100%;
  pointer-events: none;
}

@media (max-width:480px)  {
  h1 {
    top: 1.5rem;
  }
}

/* Glitch Animation - https://codepen.io/lbebber/pen/nqwBKK */

.glitch{
  position: fixed;
}
@keyframes noise-anim{
  $steps:20;
  @for $i from 0 through $steps{
    #{percentage($i*calc(1/$steps))}{
      clip:rect(random(100)+px,9999px,random(100)+px,0);
    }
  }
}
.glitch:after{
  content:attr(data-text);
  position:absolute;
  left:2px;
  text-shadow:-1px 0 red;
  top:0;
  color:white;
  background:black;
  overflow:hidden;
  clip:rect(0,900px,0,0);
  animation:noise-anim 2s infinite linear alternate-reverse;
}

@keyframes noise-anim-2{
  $steps:20;
  @for $i from 0 through $steps{
    #{percentage($i*calc(1/$steps))}{
      clip:rect(random(100)+px,9999px,random(100)+px,0);
    }
  }
}
.glitch:before{
  content:attr(data-text);
  position:absolute;
  left:-2px;
  text-shadow:1px 0 blue;
  top:0;
  color:white;
  background:black;
  overflow:hidden;
  clip:rect(0,900px,0,0);
  animation:noise-anim-2 3s infinite linear alternate-reverse;
}
</style>
