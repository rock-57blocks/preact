import { EMPTY_OBJ } from './constants';
import { commitRoot, diff } from './diff/patch';
import { createElement, Fragment } from './create-element';
import options from './options';
import { slice } from './util';
import { mount } from './diff/mount';

/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./internal').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to render into
 * @param {import('./internal').PreactElement | object} [replaceNode] Optional: Attempt to re-use an
 * existing DOM tree rooted at `replaceNode`
 */
export function render(vnode, parentDom, replaceNode) {
	// https://github.com/preactjs/preact/issues/3794
	if (parentDom == document) {
		parentDom = document.documentElement;
	}

	if (options._root) options._root(vnode, parentDom);

	// We abuse the `replaceNode` parameter in `hydrate()` to signal if we are in
	// hydration mode or not by passing the `hydrate` function instead of a DOM
	// element..
	let isHydrating = replaceNode === hydrate;

	// To be able to support calling `render()` multiple times on the same
	// DOM node, we need to obtain a reference to the previous tree. We do
	// this by assigning a new `_children` property to DOM nodes which points
	// to the last rendered tree. By default this property is not present, which
	// means that we are mounting a new tree for the first time.
	let oldVNode = isHydrating ? null : parentDom._children;

	vnode = parentDom._children = createElement(Fragment, null, [vnode]);

	// List of effects that need to be called after diffing.
	let commitQueue = [],
		refQueue = [];

	if (oldVNode) {
		diff(
			parentDom,
			// Determine the new vnode tree and store it on the DOM element on
			// our custom `_children` property.
			vnode,
			oldVNode,
			EMPTY_OBJ,
			parentDom.namespaceURI,
			null,
			commitQueue,
			oldVNode._dom,
			isHydrating,
			refQueue
		);
	} else {
		mount(
			parentDom,
			// Determine the new vnode tree and store it on the DOM element on
			// our custom `_children` property.
			vnode,
			EMPTY_OBJ,
			parentDom.namespaceURI,
			parentDom.firstChild ? slice.call(parentDom.childNodes) : null,
			commitQueue,
			parentDom.firstChild,
			isHydrating,
			refQueue
		);
	}

	// Flush all queued effects
	commitRoot(commitQueue, vnode, refQueue);
}

/**
 * Update an existing DOM element with data from a Preact virtual node
 * @param {import('./internal').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to update
 */
export function hydrate(vnode, parentDom) {
	render(vnode, parentDom, hydrate);
}
