import Svgson from 'svgson'
import { scaledTextSvg, textToSvg } from './text.js'
import { DependencyInterface, SvgImage } from './types.js'
import { createMarkSvgImage } from './mark.js'

export interface RectSvgImageInput {
  seed: string
  width: number
  height: number
}

export async function createRectSvgImage(
  input: RectSvgImageInput,
  dep: Pick<DependencyInterface, 'logger' | 'markDefaults' | 'logoTextDefaults'>,
): Promise<SvgImage> {
  // Text
  const textSvg = await textToSvg({
    ...dep.logoTextDefaults,
    fontSize: 20, // Text will be scaled later so any value is fine
  })

  // Scale text
  const aspectRatio = textSvg.width / textSvg.height
  const scaledText = await scaledTextSvg(textSvg, input.width, input.width / aspectRatio)

  // Mark
  const markHeight = input.height - scaledText.height
  const mark = await createMarkSvgImage({ seed: input.seed, width: input.width, height: markHeight }, dep)

  // Build SVG
  const intWidth = Math.ceil(input.width)
  const intHeight = Math.ceil(input.height)
  const svg: Svgson.INode = {
    name: 'svg',
    type: 'element',
    value: '',
    attributes: {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      width: `${intWidth}`,
      height: `${intHeight}`,
      viewBox: `0 0 ${intWidth} ${intHeight}`,
    },
    children: [
      ...mark.svgNode.children,
      {
        name: 'g',
        type: 'element',
        value: '',
        attributes: {
          transform: `translate(0, ${input.height - scaledText.height})`,
        },
        children: scaledText.svgNode.children,
      },
    ],
  }

  return { svgNode: svg, width: intWidth, height: intHeight }
}
