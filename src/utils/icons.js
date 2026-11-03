import { ICON_SVGS } from './iconSvgs.js'

export const ICON_NAMES = Object.keys(ICON_SVGS).sort()

export function resolveIconName(name) {
  return Object.prototype.hasOwnProperty.call(ICON_SVGS, name) ? name : 'Picture'
}

export function renderIconSvg(name) {
  return ICON_SVGS[resolveIconName(name)].replace('<svg ', '<svg width="100%" height="100%" ')
}
