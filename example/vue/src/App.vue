<template>
  <div class="app">
    <h1>Alogorithm2 Animation - Vue Example</h1>
    
    <div class="controls">
      <label>
        Mode:
        <select v-model="mode">
          <option value="morph">Morph</option>
          <option value="fly">Fly</option>
        </select>
      </label>
      
      <label>
        Seed:
        <input 
          type="text" 
          v-model="seed"
          placeholder="Leave empty for random"
        />
      </label>
    </div>

    <div class="animation-container">
      <Alogorithm2Animation 
        :width="400" 
        :height="400" 
        :mode="mode"
        :seed="seed || undefined"
        :duration="2000"
        :interval="4000"
      />
    </div>

    <div class="info">
      <p>Using Alogorithm2Animation from ../dist/vue</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Alogorithm2Animation from 'alogorithm2-animation/vue'

const mode = ref('morph')
const seed = ref('')
</script>