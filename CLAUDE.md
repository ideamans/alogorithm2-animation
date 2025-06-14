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

## Astroの場合

```astro
---
import { Alogorithm2Animation } from 'alogorithm2-animation/astro'
const { width = 800, height = 600, seed = 'the-seed', mode = 'morph' } = Astro.props
---
<div>
  <Alogorithm2Animation width={width} height={height} seed={seed} mode={mode} />
</div>
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

で現在のデバッグ機能を使うが、devDependenciesでreact、vue、astroを読んでおき、

yarn dev:react
yarn dev:vue
yarn dev:astro

でそれぞれのプラットフォームでの動作を確認できるようにする。

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
