import React, { useEffect, useState } from 'react'
import { createMarkSvgImage } from '../../src/mark'
import { getDependency } from '../dependency'
import { stringify as svgsonStringify } from 'svgson'

interface StaticRectProps {
  seed: string
  size?: number
  text?: string
  colorTheme?: 'light' | 'dark'
}

export const StaticRect: React.FC<StaticRectProps> = ({ 
  seed, 
  size = 1200,
  text = "ideaman's Inc.",
  colorTheme = 'light'
}) => {
  const [svgString, setSvgString] = useState<string>('')
  
  useEffect(() => {
    const generateSvg = async () => {
      const dep = getDependency()
      
      // Generate mark
      const markSize = size * 0.4
      const markSvg = await createMarkSvgImage(
        { seed, width: markSize, height: markSize },
        dep
      )
      
      // Create rect SVG with mark positioned inside
      const rectSvg = {
        name: 'svg',
        type: 'element',
        attributes: {
          xmlns: 'http://www.w3.org/2000/svg',
          width: `${size}`,
          height: `${size}`,
          viewBox: `0 0 ${size} ${size}`,
        },
        value: '',
        children: [
          {
            name: 'rect',
            type: 'element',
            attributes: {
              width: `${size}`,
              height: `${size}`,
              fill: colorTheme === 'dark' ? '#000' : '#fff',
            },
            value: '',
            children: [],
          },
          {
            name: 'g',
            type: 'element',
            attributes: {
              transform: `translate(${size * 0.05}, ${size * 0.15})`,
            },
            value: '',
            children: markSvg.svgNode.children || [],
          },
          {
            name: 'text',
            type: 'element',
            attributes: {
              x: `${size / 2}`,
              y: `${size * 0.75}`,
              'text-anchor': 'middle',
              'font-size': `${size * 0.08}`,
              'font-family': 'Arial, sans-serif',
              'font-weight': '600',
              fill: colorTheme === 'dark' ? '#fff' : '#000',
            },
            value: '',
            children: [{
              name: '',
              type: 'text',
              value: text,
              attributes: {},
              children: []
            }],
          },
        ],
      }
      
      const svg = svgsonStringify(rectSvg)
      setSvgString(svg)
    }
    
    generateSvg()
  }, [seed, size, text, colorTheme])
  
  if (!svgString) return null
  
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />
}