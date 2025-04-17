<template>
  <div class="container">
    <h1>云服务导航</h1>
    
    <div class="grid">
      <ServiceCard 
        v-for="service in services" 
        :key="service.url"
        :title="service.title"
        :url="service.url"
        :description="service.description"
      />
    </div>
  </div>
</template>

<script setup>
import ServiceCard from '@/components/ServiceCard.vue'

const services = [
  {
    title: '服务器探针',
    url: 'https://vps.111600.xyz/',
    description: '实时监控服务器状态与性能指标'
  },
  // 其他服务卡片数据...
]
</script>
