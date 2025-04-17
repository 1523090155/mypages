<template>
  <div class="card">
    <a :href="url" target="_blank">
      <div class="card-content">
        <div class="card-title">{{ title }}</div>
        <div class="card-desc">{{ description }}</div>
      </div>
    </a>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  url: String,
  description: String
})
</script>
