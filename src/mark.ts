import Blobs2 from 'blobs/v2/index.js'
import Trianglify from 'trianglify'
import { parse as svgsonParse } from 'svgson'

import { DependencyInterface, SvgImage } from './types.js'
import { scaleSvgPath } from './svg.js'

export interface LogoSpec {
  seed: string
  width: number
  height: number
}

export async function createMarkSvgImage(
  spec: LogoSpec,
  dep: Pick<DependencyInterface, 'logger' | 'markDefaults'>,
): Promise<SvgImage> {
  const seed = dep.markDefaults.seedPrefix + spec.seed

  // Trianglify pattern
  const trianglify = Trianglify({
    width: spec.width,
    height: spec.height,
    variance: dep.markDefaults.variance,
    cellSize: spec.width * dep.markDefaults.cellSizeRatio,
    seed,
  })
  const trianglifySvgElement = trianglify.toSVG()
  const trianglifySvgString = new XMLSerializer().serializeToString(trianglifySvgElement)
  const trianglifySvg = await svgsonParse(trianglifySvgString)

  // Blob clipping path
  const blobPath = Blobs2.svgPath({
    seed,
    extraPoints: dep.markDefaults.extraPoints,
    randomness: dep.markDefaults.randomness,
    size: 256, // Path size doesn't matter as it will be scaled
  })
  const scaledBlobPath = scaleSvgPath(blobPath, spec.width, spec.height)

  const intWidth = Math.ceil(spec.width)
  const intHeight = Math.ceil(spec.height)
  const markSvg = {
    name: 'svg',
    type: 'element',
    attributes: {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      width: `${intWidth}`,
      height: `${intHeight}`,
      viewBox: `0 0 ${intWidth} ${intHeight}`,
    },
    value: '',
    children: [
      {
        name: 'defs',
        type: 'element',
        attributes: {},
        value: '',
        children: [
          {
            name: 'clipPath',
            type: 'element',
            attributes: {
              id: 'clip',
            },
            children: [
              {
                name: 'path',
                type: 'element',
                attributes: { d: scaledBlobPath },
                value: '',
                children: [],
              },
            ],
            value: '',
          },
        ],
      },
      {
        name: 'g',
        type: 'element',
        attributes: {
          'clip-path': 'url(#clip)',
        },
        value: '',
        children: trianglifySvg.children,
      },
    ],
  }

  return {
    svgNode: markSvg,
    width: intWidth,
    height: intHeight,
  }
}
