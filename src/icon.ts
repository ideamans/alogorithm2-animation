import { createMarkSvgImage } from './mark.js'
import { DependencyInterface, SvgImage } from './types.js'

export interface IconSvgImageInput {
  seed: string
  width: number
  height: number
}

export async function createIconSvgImage(
  input: IconSvgImageInput,
  dep: Pick<DependencyInterface, 'logger' | 'markDefaults'>,
): Promise<SvgImage> {
  const mark = await createMarkSvgImage({ seed: input.seed, width: input.width, height: input.height }, dep)
  return {
    ...mark,
    width: Math.ceil(input.width),
    height: Math.ceil(input.height),
  }
}
