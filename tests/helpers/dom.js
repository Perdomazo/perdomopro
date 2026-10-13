import { parse } from 'parse5';

/**
 * Traverses a parse5 AST node recursively.
 * @param {object} node
 * @param {(n: object) => boolean | void} visitor
 */
export function walk(node, visitor) {
  if (!node) return;
  const stop = visitor(node);
  if (stop === true) return;
  if (node.childNodes && Array.isArray(node.childNodes)) {
    for (const child of node.childNodes) {
      walk(child, visitor);
    }
  }
}

/**
 * Parses an HTML string into an AST.
 * @param {string} html
 */
export function parseHtml(html) {
  return parse(html);
}

/**
 * Returns all elements matching a predicate.
 * @param {object} rootNode
 * @param {(n: object) => boolean} predicate
 * @returns {object[]}
 */
export function querySelectorAll(rootNode, predicate) {
  const matches = [];
  walk(rootNode, (node) => {
    if (node.nodeName && !node.nodeName.startsWith('#')) {
      if (predicate(node)) {
        matches.push(node);
      }
    }
  });
  return matches;
}

/**
 * Returns the first element matching a predicate.
 * @param {object} rootNode
 * @param {(n: object) => boolean} predicate
 * @returns {object | null}
 */
export function querySelector(rootNode, predicate) {
  let found = null;
  walk(rootNode, (node) => {
    if (node.nodeName && !node.nodeName.startsWith('#')) {
      if (predicate(node)) {
        found = node;
        return true; // stop search
      }
    }
  });
  return found;
}

/**
 * Gets attribute value by name.
 * @param {object} node
 * @param {string} name
 * @returns {string | null}
 */
export function getAttribute(node, name) {
  if (!node || !node.attrs) return null;
  const attr = node.attrs.find((a) => a.name === name);
  return attr ? attr.value : null;
}

/**
 * Checks if attribute exists.
 * @param {object} node
 * @param {string} name
 * @returns {boolean}
 */
export function hasAttribute(node, name) {
  if (!node || !node.attrs) return false;
  return node.attrs.some((a) => a.name === name);
}

/**
 * Returns list of class names.
 * @param {object} node
 * @returns {string[]}
 */
export function getClasses(node) {
  const classAttr = getAttribute(node, 'class');
  if (!classAttr) return [];
  return classAttr.split(/\s+/).filter(Boolean);
}

/**
 * Recursively extracts text content.
 * @param {object} node
 * @returns {string}
 */
export function getTextContent(node) {
  if (!node) return '';
  if (node.nodeName === '#text') return node.value || '';
  if (!node.childNodes) return '';
  return node.childNodes.map(getTextContent).join('');
}

/**
 * Finds element by ID attribute.
 * @param {object} rootNode
 * @param {string} id
 * @returns {object | null}
 */
export function getElementById(rootNode, id) {
  return querySelector(rootNode, (node) => getAttribute(node, 'id') === id);
}

/**
 * Matches elements by tag name.
 * @param {string} tagName
 */
export function byTag(tagName) {
  const lower = tagName.toLowerCase();
  return (node) => node.tagName === lower;
}

/**
 * Matches elements having a specific class name.
 * @param {string} className
 */
export function byClass(className) {
  return (node) => getClasses(node).includes(className);
}

/**
 * Matches elements by attribute presence and optional value.
 * @param {string} attrName
 * @param {string} [value]
 */
export function byAttr(attrName, value) {
  return (node) => {
    if (value === undefined) return hasAttribute(node, attrName);
    return getAttribute(node, attrName) === value;
  };
}
