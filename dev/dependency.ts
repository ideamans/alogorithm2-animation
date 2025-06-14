import { BrowserDependency } from './browser-dependency'

let dependencyInstance: BrowserDependency | null = null

export function getDependency(): BrowserDependency {
  if (!dependencyInstance) {
    dependencyInstance = new BrowserDependency()
  }
  return dependencyInstance
}