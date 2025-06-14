import React, { useEffect, useState } from 'react'
import { createMarkSvgImage } from '../../src/mark'
import { getDependency } from '../dependency'
import { stringify as svgsonStringify } from 'svgson'

interface StaticIconProps {
  seed: string
  size?: number
}

export const StaticIcon: React.FC<StaticIconProps> = ({ seed, size = 400 }) => {
  const [svgString, setSvgString] = useState<string>('')
  
  useEffect(() => {
    const generateSvg = async () => {
      const dep = getDependency()
      const svgImage = await createMarkSvgImage(
        { seed, width: size, height: size },
        dep
      )
      const svg = svgsonStringify(svgImage.svgNode)
      setSvgString(svg)
    }
    
    generateSvg()
  }, [seed, size])
  
  if (!svgString) return null
  
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />
}