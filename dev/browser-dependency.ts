import {
  Defaults,
  DependencyInterface,
  IconDefaults,
  InlineDefaults,
  LogoTextDefaults,
  MarkDefaults,
  RectDefaults,
} from '../src/types'

export class BrowserDependency implements Pick<DependencyInterface, 'defaults' | 'logoTextDefaults' | 'markDefaults' | 'inlineDefaults' | 'iconDefaults' | 'rectDefaults'> {
  defaults: Defaults
  logoTextDefaults: LogoTextDefaults
  markDefaults: MarkDefaults
  inlineDefaults: InlineDefaults
  iconDefaults: IconDefaults
  rectDefaults: RectDefaults

  constructor() {
    this.defaults = {
      seed: 'alogorithm2',
    }

    this.logoTextDefaults = {
      text: "ideaman's Inc.",
      fill: '#555',
      stroke: '',
      font: 'IBMPlexSans-SemiBold.otf',
      darkFill: '#ddd',
      darkStroke: '',
      colorTheme: 'light',
    }

    this.markDefaults = {
      seedPrefix: "ideaman's ",
      variance: 1.5,
      cellSizeRatio: 0.2,
      extraPoints: 8,
      randomness: 4,
    }

    this.inlineDefaults = {
      paddingRatio: 0.2,
      width: 512,
    }

    this.iconDefaults = {
      size: 64,
    }

    this.rectDefaults = {
      size: 512,
    }
  }
}