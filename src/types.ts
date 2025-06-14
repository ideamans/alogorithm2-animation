import Svgson from 'svgson'

export interface Defaults {
  seed: string
}

export interface LogoTextDefaults {
  text: string
  fill: string
  stroke: string
  font: string
  darkFill: string
  darkStroke: string
  colorTheme: ColorTheme
}

export interface MarkDefaults {
  seedPrefix: string
  variance: number
  cellSizeRatio: number
  extraPoints: number
  randomness: number
}

export interface InlineDefaults {
  paddingRatio: number
  width: number
}

export interface IconDefaults {
  size: number
}

export interface RectDefaults {
  size: number
}

export interface DependencyInterface {
  defaults: Defaults
  logoTextDefaults: LogoTextDefaults
  markDefaults: MarkDefaults
  inlineDefaults: InlineDefaults
  iconDefaults: IconDefaults
  rectDefaults: RectDefaults
}

export interface SvgImage {
  svgNode: Svgson.INode
  width: number
  height: number
}

export type ColorTheme = 'light' | 'dark'
