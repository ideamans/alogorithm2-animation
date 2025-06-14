# 最終的な提供形態

- Reactコンポーネント
- Vueコンポーネント
- Astroコンポーネント

# 利用イメージ

以下のようにフレームワークごとにコンポーネントを提供したい。

各フレームワークにおいて簡単なテストは行う。SVGが作成され、要素を持つことくらいでよい。

## Reactの場合

```jsx
import { Alogorithm2Animation } from 'alogorithm2-animation/react'

function App() {
  return (
    <div>
      <Alogorithm2Animation width={800} height={600} seed="the-seed" mode="morph" />
    </div>
  )
}
```

## Vueの場合

```vue
<template>
  <div>
    <Alogorithm2Animation width="800" height="600" seed="the-seed" mode="morph" />
  </div>
</template>

<script>
import { Alogorithm2Animation } from 'alogorithm2-animation/vue'
export default {
  components: {
    Alogorithm2Animation,
  },
}
</script>
```

# オプション

- width
- height
- seed - 初期シード デフォルトランダム
- mode - 'morph' または 'fly' デフォルト 'morph'
- duration - アニメーションの持続時間(ms) デフォルト 1000
- interval - アニメーションの間の静止時間(ms) デフォルト 4000

# デバッグ

yarn dev

で現在のデバッグ機能を使うが、devDependenciesでreact、vueを読んでおき、

yarn dev:react
yarn dev:vue

でそれぞれのプラットフォームでの動作を確認できるようにする。

なお、astroの動作確認にも対応し、

yarn dev:astro

でAstroによる動作確認を行えるが、Astroについては内部的にReactコンポーネントを呼び出す。

# コアロジック

- アニメーションのロジックは `src/animation.ts` に実装する。
- そのアニメーションロジックを各コンポーネントにバインディングして外部に提供する。

# 注意点

- Node.js向けのモジュールから派生したが、そのコードの維持にはこだわらなくてよい。

## ビルドサイズ

- 各フレームワークを利用するが、最終的なビルドサイズは最小限にとどめる。
- もともとNode.jsから派生したが、これはあくまでブラウザ向けのモジュールなので、ブラウザに特化して依存パッケージも見直す。

## ライセンス

GPL v3

## CI/CD

各フレームワークごとのテスト。
現在のNode.jsやDockerを意識したCIは削除してしまってよい。

# README

- README.md 英語
- README.ja.md 日本語

相互リンクを設ける。

# Astro環境でのReactコンポーネント動作確認

Astro環境でReactコンポーネントを使用して動作確認を行うためのセットアップ：

## 1. Astro設定でReactを有効化

`dev/astro/astro.config.mjs` に以下を追加：

```javascript
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { resolve } from 'path'

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': resolve('./../../src'),
      }
    }
  }
})
```

## 2. ReactコンポーネントをAstroページで使用

`dev/astro/src/pages/react-test.astro` を作成：

```astro
---
import Alogorithm2Animation from '../../../../src/react/index.tsx'
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>React Component in Astro</title>
  </head>
  <body>
    <h1>React Component Test in Astro</h1>
    <Alogorithm2Animation client:load width={300} height={300} mode="morph" />
  </body>
</html>
```

## 3. 必要な依存関係

```bash
yarn add -D @astrojs/react
```

## 4. 動作確認

```bash
yarn dev:astro
```

ブラウザで `http://localhost:4321/react-test` にアクセスしてReactコンポーネントの動作を確認。

## 注意点

- `client:load` ディレクティブを使用してクライアントサイドでのハイドレーションを有効化
- Astro環境では、ReactコンポーネントはデフォルトでSSRされ、クライアントサイドのインタラクティビティが必要な場合は明示的に指定が必要