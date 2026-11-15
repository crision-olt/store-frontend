const rect = (width: number, height: number) =>
  ({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height, toJSON: () => ({}) }) as DOMRect

// jsdom does no layout: the virtualizer needs sizes to decide which rows are visible
export const defineBoundingClientRect = ({ width = 1000, height = 40 } = {}) => {
  Element.prototype.getBoundingClientRect = () => rect(width, height)
}

export const defineClientDimensions = ({ width = 1000, height = 600 } = {}) => {
  for (const [property, value] of [
    ['clientWidth', width],
    ['offsetWidth', width],
    ['clientHeight', height],
    ['offsetHeight', height],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, property, { configurable: true, get: () => value })
  }
}
