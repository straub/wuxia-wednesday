<template>
  <OSlider
    ref="slider"
    v-model="rangeSliderModel"
    :min="min"
    :max="max"
    :step="step"
    variant="info"
    size="small"
    :custom-formatter="customFormatter"
  />
</template>

<script setup lang="ts">
import { OSlider } from '@oruga-ui/oruga-next';

const props = defineProps<{
  min?: number,
  max?: number,
  step?: number,
  modelValue?: [number, number],
  customFormatter?: Function,
}>();

const emit = defineEmits(['update:modelValue']);

const slider = ref();

const rangeSliderModel = computed({
  get () {
    const { min, max } = props;
    if (Array.isArray(props.modelValue)) {
      return props.modelValue;
    }
    return [min, max];
  },
  set (value) {
    if (Array.isArray(value)) {
      emit('update:modelValue', value);
      return;
    }
    console.warn('ignoring non-array range slider value', value);
  },
});

// If the range slider is set to min, we want to keep it there when min changes.
watch(() => props.min, (newMin, oldMin) => {
  const [valueLow] = rangeSliderModel.value;
  if (oldMin === valueLow) {
    rangeSliderModel.value[0] = newMin;
  }
});

// And the same for max
watch(() => props.max, (newMax, oldMax) => {
  const [, valueHigh] = rangeSliderModel.value;
  if (oldMax === valueHigh) {
    rangeSliderModel.value[1] = newMax;
  }
});

// Work around an OSlider bug
// https://github.com/oruga-ui/oruga/blob/develop/packages/oruga-next/src/components/slider/Slider.vue#L289
watchEffect(() => {
  if (slider.value) {
    slider.value.value = rangeSliderModel.value;
    slider.value.setValues(rangeSliderModel.value);
  }
});
</script>
