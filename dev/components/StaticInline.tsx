import React, { useEffect, useState } from 'react'
import { createMarkSvgImage } from '../../src/mark'
import { getDependency } from '../dependency'
import { stringify as svgsonStringify } from 'svgson'

interface StaticInlineProps {
  seed: string
  width?: number
  text?: string
  colorTheme?: 'light' | 'dark'
}

export const StaticInline: React.FC<StaticInlineProps> = ({ 
  seed, 
  width = 600,
  text = "ideaman's Inc.",
  colorTheme = 'light'
}) => {
  const [svgString, setSvgString] = useState<string>('')
  
  useEffect(() => {
    const generateSvg = async () => {
      const dep = getDependency()
      
      // Calculate dimensions
      const height = width * 0.25
      const markSize = height * 0.8
      const padding = height * 0.1
      
      // Generate mark
      const markSvg = await createMarkSvgImage(
        { seed, width: markSize, height: markSize },
        dep
      )
      
      // Create inline SVG with mark and text
      const inlineSvg = {
        name: 'svg',
        type: 'element',
        attributes: {
          xmlns: 'http://www.w3.org/2000/svg',
          width: `${width}`,
          height: `${height}`,
          viewBox: `0 0 ${width} ${height}`,
        },
        value: '',
        children: [
          {
            name: 'rect',
            type: 'element',
            attributes: {
              width: `${width}`,
              height: `${height}`,
              fill: colorTheme === 'dark' ? '#000' : '#fff',
            },
            value: '',
            children: [],
          },
          {
            name: 'g',
            type: 'element',
            attributes: {
              transform: `translate(${padding}, ${padding})`,
            },
            value: '',
            children: markSvg.svgNode.children || [],
          },
          {
            name: 'text',
            type: 'element',
            attributes: {
              x: `${markSize + padding * 3}`,
              y: `${height / 2}`,
              'dominant-baseline': 'middle',
              'font-size': `${height * 0.3}`,
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
      
      const svg = svgsonStringify(inlineSvg)
      setSvgString(svg)
    }
    
    generateSvg()
  }, [seed, width, text, colorTheme])
  
  if (!svgString) return null
  
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />
}