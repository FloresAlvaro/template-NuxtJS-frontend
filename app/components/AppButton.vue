<script setup lang="ts">
defineOptions({ inheritAttrs: false })

type ButtonPreset = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonColor = 'primary' | 'secondary' | 'neutral' | 'error' | 'success' | 'info' | 'warning'
type ButtonVariant = 'link' | 'ghost' | 'solid' | 'soft' | 'outline' | 'subtle'

const props = withDefaults(
  defineProps<{
    icon?: string
    trailingIcon?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    preset?: ButtonPreset
    color?: ButtonColor
    variant?: ButtonVariant
  }>(),
  {
    size: 'md',
    preset: 'primary'
  }
)

const attrs = useAttrs()

const presetMap = {
  primary: {
    color: 'primary',
    variant: 'solid'
  },
  secondary: {
    color: 'neutral',
    variant: 'soft'
  },
  danger: {
    color: 'error',
    variant: 'solid'
  },
  ghost: {
    color: 'neutral',
    variant: 'ghost'
  }
} as const

const resolvedButton = computed<{ color: ButtonColor; variant: ButtonVariant }>(() => {
  const preset = presetMap[props.preset ?? 'primary']

  return {
    color: props.color ?? preset.color,
    variant: props.variant ?? preset.variant
  }
})
</script>

<template>
  <UButton
    v-bind="attrs"
    :icon="props.icon"
    :trailing-icon="props.trailingIcon"
    :size="props.size"
    :color="resolvedButton.color"
    :variant="resolvedButton.variant"
  >
    <slot />
  </UButton>
</template>
