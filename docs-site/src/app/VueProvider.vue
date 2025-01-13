<template>
  <div class="vue-provider">
    <p>Count: {{ count }}</p>
    <p>Double Count: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}
</script>

<style scoped>
.vue-provider {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
