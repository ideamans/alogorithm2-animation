# Alogorithm2 Animation

三角形パターンのモーフィングアニメーションと有機的なブロブシェイプを提供するブラウザ向けアニメーションライブラリです。React、Vue、Astroアプリケーションで美しいアニメーションロゴマークを作成できます。

[English](./README.md)

## 特徴

- 🎨 **モーフィングアニメーション** - ランダムに生成された三角形パターン間のスムーズな遷移
- 🌊 **有機的なブロブシェイプ** - 時間とともに進化する自然な見た目のブロブマスク
- ⚡ **フレームワークサポート** - React、Vue、Astro用のネイティブコンポーネント
- 🎯 **2つのアニメーションモード** - "morph"（クロスフェード）または"fly"（移動）遷移を選択
- 🎛️ **完全にカスタマイズ可能** - サイズ、タイミング、色、アニメーション動作を制御
- 📦 **軽量** - 最小限の依存関係、ブラウザ向けに最適化

## インストール

```bash
npm install alogorithm2-animation
# または
yarn add alogorithm2-animation
```

## 使用方法

### React

```jsx
import { Alogorithm2Animation } from 'alogorithm2-animation/react'

function App() {
  return (
    <Alogorithm2Animation 
      width={400} 
      height={400} 
      mode="morph"
      seed="my-seed"
      duration={2000}
      interval={4000}
    />
  )
}
```

### Vue

```vue
<template>
  <Alogorithm2Animation 
    :width="400" 
    :height="400" 
    mode="morph"
    seed="my-seed"
    :duration="2000"
    :interval="4000"
  />
</template>

<script>
import Alogorithm2Animation from 'alogorithm2-animation/vue'

export default {
  components: {
    Alogorithm2Animation
  }
}
</script>
```

### Astro

```astro
---
import Alogorithm2Animation from 'alogorithm2-animation/astro'
---

<Alogorithm2Animation 
  client:load
  width={400} 
  height={400} 
  mode="morph"
  seed="my-seed"
  duration={2000}
  interval={4000}
/>
```

## プロパティ

| プロパティ | 型 | デフォルト | 説明 |
|------|------|---------|-------------|
| `width` | number | 400 | アニメーションキャンバスの幅 |
| `height` | number | 400 | アニメーションキャンバスの高さ |
| `seed` | string | ランダム | 初期パターン生成用のシード |
| `mode` | 'morph' \| 'fly' | 'morph' | アニメーション遷移スタイル |
| `duration` | number | 2000 | アニメーション時間（ミリ秒） |
| `interval` | number | 4000 | アニメーション間の一時停止時間（ミリ秒） |

### アニメーションモード

- **morph**: 三角形がスムーズな不透明度遷移でパターン間をクロスフェード
- **fly**: 三角形が物理ベースのアニメーションで位置から移動

## コアユーティリティ

コアアニメーションユーティリティを直接使用することもできます：

```javascript
import { 
  generateTriangles,
  generateBlobPath,
  easeInOutSine,
  interpolateColor
} from 'alogorithm2-animation'

// 三角形パターンを生成
const triangles = generateTriangles(seed, size, 'morph')

// ブロブパスを生成
const blobPath = generateBlobPath(seed, size)
```

## 開発

```bash
# 依存関係をインストール
yarn install

# React開発環境を実行
yarn dev:react

# Vue開発環境を実行
yarn dev:vue

# Astro開発環境を実行
yarn dev:astro

# テストを実行
yarn test:react
yarn test:vue

# プロダクション用にビルド
yarn build
```

## ブラウザサポート

このライブラリは以下をサポートする最新のブラウザが必要です：
- SVGアニメーション
- ES6+ JavaScript機能
- CSSカスタムプロパティ
- requestAnimationFrame API

## ライセンス

GPL-3.0 License

## クレジット

アイデアマンズ株式会社により作成。Alogorithm v2ビジュアルアイデンティティシステムに基づいています。