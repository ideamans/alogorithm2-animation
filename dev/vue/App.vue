<template>
  <div class="app">
    <h1>Alogorithm2 Animation - Vue</h1>
    
    <div class="demos">
      <div class="demo-item">
        <h3>Morph Mode (Default)</h3>
        <Alogorithm2Animation :width="300" :height="300" mode="morph" />
      </div>
      
      <div class="demo-item">
        <h3>Fly Mode</h3>
        <Alogorithm2Animation :width="300" :height="300" mode="fly" />
      </div>
      
      <div class="demo-item">
        <h3>Custom Seed</h3>
        <Alogorithm2Animation :width="300" :height="300" seed="custom-seed" mode="morph" />
      </div>
      
      <div class="demo-item">
        <h3>Fast Animation</h3>
        <Alogorithm2Animation :width="300" :height="300" mode="morph" :duration="500" :interval="2000" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Alogorithm2Animation from '../../src/vue/index.vue'

export default defineComponent({
  name: 'App',
  components: {
    Alogorithm2Animation,
  },
})
</script>

<style>
.app {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demos {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.demo-item {
  text-align: center;
}

h1 {
  color: #333;
}

h3 {
  color: #666;
  margin-bottom: 10px;
}
</style>