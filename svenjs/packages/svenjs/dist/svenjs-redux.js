/*!
 * svenjs-redux v2.0.0
 * (c) 2016 Sven A Robbestad
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.InfernoRedux = factory());
}(this, (function () { 'use strict';

function addChildrenToProps(children, props) {
	if (!isNullOrUndefined(children)) {
		var isChildrenArray = isArray(children);
		if (isChildrenArray && children.length > 0 || !isChildrenArray) {
			if (props) {
				props = Object.assign({}, props, { children: children });
			} else {
				props = {
					children: children
				};
			}
		}
	}
	return props;
}

var NO_RENDER = 'NO_RENDER';

// Runs only once in applications lifetime
var isBrowser = typeof window !== 'undefined' && window.document;

function toArray(children) {
	return isArray(children) ? children : (children ? [children] : children);
}

function isArray(obj) {
	return obj instanceof Array;
}

function isStatefulComponent(obj) {
	return obj.prototype && obj.prototype.render !== undefined;
}

function isStringOrNumber(obj) {
	return isString(obj) || isNumber(obj);
}

function isNullOrUndefined(obj) {
	return isUndefined(obj) || isNull(obj);
}

function isInvalidNode(obj) {
	return isNull(obj) || obj === false || obj === true || isUndefined(obj);
}

function isFunction(obj) {
	return typeof obj === 'function';
}



function isString(obj) {
	return typeof obj === 'string';
}

function isNumber(obj) {
	return typeof obj === 'number';
}

function isNull(obj) {
	return obj === null;
}

function isTrue(obj) {
	return obj === true;
}

function isUndefined(obj) {
	return obj === undefined;
}





function deepScanChildrenForNode(children, node) {
	if (!isInvalidNode(children)) {
		if (isArray(children)) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];

				if (!isInvalidNode(child)) {
					if (child === node) {
						return true;
					} else if (child.children) {
						return deepScanChildrenForNode(child.children, node);
					}
				}
			}
		} else {
			if (children === node) {
				return true;
			} else if (children.children) {
				return deepScanChildrenForNode(children.children, node);
			}
		}
	}
	return false;
}

function getRefInstance$1(node, instance) {
	if (instance) {
		var children = instance.props.children;

		if (deepScanChildrenForNode(children, node)) {
			return getRefInstance$1(node, instance._parentComponent);
		}
	}
	return instance;
}

var recyclingEnabled = true;

function recycle(node, bp, lifecycle, context, instance) {
	if (bp !== undefined) {
		var pool = bp.pool;
		var recycledNode = pool.pop();

		if (!isNullOrUndefined(recycledNode)) {
			patch(recycledNode, node, null, lifecycle, context, instance, bp.isSVG);
			return node.dom;
		}
	}
	return null;
}

function pool(node) {
	var bp = node.bp;

	if (!isNullOrUndefined(bp)) {
		bp.pool.push(node);
		return true;
	}
	return false;
}

function VNode(blueprint) {
	this.bp = blueprint;
	this.dom = null;
	this.instance = null;
	this.tag = null;
	this.children = null;
	this.style = null;
	this.className = null;
	this.attrs = null;
	this.events = null;
	this.hooks = null;
	this.key = null;
	this.clipData = null;
}

VNode.prototype = {
	setAttrs: function setAttrs(attrs) {
		this.attrs = attrs;
		return this;
	},
	setTag: function setTag(tag) {
		this.tag = tag;
		return this;
	},
	setStyle: function setStyle(style) {
		this.style = style;
		return this;
	},
	setClassName: function setClassName(className) {
		this.className = className;
		return this;
	},
	setChildren: function setChildren(children) {
		this.children = children;
		return this;
	},
	setHooks: function setHooks(hooks) {
		this.hooks = hooks;
		return this;
	},
	setEvents: function setEvents(events) {
		this.events = events;
		return this;
	},
	setKey: function setKey(key) {
		this.key = key;
		return this;
	}
};

function createVNode(bp) {
	return new VNode(bp);
}

function isAttrAnEvent$1(attr) {
	return attr[0] === 'o' && attr[1] === 'n' && attr.length > 3;
}

function isAttrAHook$1(hook) {
	return hook === 'onCreated'
		|| hook === 'onAttached'
		|| hook === 'onWillDetach'
		|| hook === 'onWillUpdate'
		|| hook === 'onDidUpdate';
}

function isAttrAComponentHook$1(hook) {
	return hook === 'onComponentWillMount'
		|| hook === 'onComponentDidMount'
		|| hook === 'onComponentWillUnmount'
		|| hook === 'onComponentShouldUpdate'
		|| hook === 'onComponentWillUpdate'
		|| hook === 'onComponentDidUpdate';
}




function VText(text) {
	this.text = text;
	this.dom = null;
}

function VPlaceholder() {
	this.placeholder = true;
	this.dom = null;
}

function VList(items) {
	this.dom = null;
	this.pointer = null;
	this.items = items;
}

function createVText(text) {
	return new VText(text);
}

function createVPlaceholder() {
	return new VPlaceholder();
}

function createVList(items) {
	return new VList(items);
}

function hydrateChild(child, childNodes, counter, parentDom, lifecycle, context, instance) {
	var domNode = childNodes[counter.i];

	if (isVText(child)) {
		var text = child.text;

		child.dom = domNode;
		if (domNode.nodeType === 3 && text !== '') {
			domNode.nodeValue = text;
		} else {
			var newDomNode = mountVText(text);

			replaceNode(parentDom, newDomNode, domNode);
			childNodes.splice(childNodes.indexOf(domNode), 1, newDomNode);
			child.dom = newDomNode;
		}
	} else if (isVPlaceholder(child)) {
		child.dom = domNode;
	} else if (isVList(child)) {
		var items = child.items;

		// this doesn't really matter, as it won't be used again, but it's what it should be given the purpose of VList
		child.dom = document.createDocumentFragment();
		for (var i = 0; i < items.length; i++) {
			var rebuild = hydrateChild(normaliseChild(items, i), childNodes, counter, parentDom, lifecycle, context, instance);

			if (rebuild) {
				return true;
			}
		}
		// at the end of every VList, there should be a "pointer". It's an empty TextNode used for tracking the VList
		var pointer = childNodes[counter.i++];

		if (pointer && pointer.nodeType === 3) {
			child.pointer = pointer;
		} else {
			// there is a problem, we need to rebuild this tree
			return true;
		}
	} else {
		var rebuild$1 = hydrateNode(child, domNode, parentDom, lifecycle, context, instance, false);

		if (rebuild$1) {
			return true;
		}
	}
	counter.i++;
}

function getChildNodesWithoutComments(domNode) {
	var childNodes = [];
	var rawChildNodes = domNode.childNodes;
	var length = rawChildNodes.length;
	var i = 0;

	while (i < length) {
		var rawChild = rawChildNodes[i];

		if (rawChild.nodeType === 8) {
			if (rawChild.data === '!') {
				var placeholder = document.createTextNode('');

				domNode.replaceChild(placeholder, rawChild);
				childNodes.push(placeholder);
				i++;
			} else {
				domNode.removeChild(rawChild);
				length--;
			}
		} else {
			childNodes.push(rawChild);
			i++;
		}
	}
	return childNodes;
}

function hydrateComponent(node, Component, props, hooks, children, domNode, parentDom, lifecycle, context, lastInstance, isRoot) {
	props = addChildrenToProps(children, props);

	if (isStatefulComponent(Component)) {
		var instance = node.instance = new Component(props);

		instance._patch = patch;
		if (!isNullOrUndefined(lastInstance) && props.ref) {
			mountRef(lastInstance, props.ref, instance);
		}
		var childContext = instance.getChildContext();

		if (!isNullOrUndefined(childContext)) {
			context = Object.assign({}, context, childContext);
		}
		instance.context = context;
		instance._unmounted = false;
		instance._parentNode = node;
		if (lastInstance) {
			instance._parentComponent = lastInstance;
		}
		instance._pendingSetState = true;
		instance.componentWillMount();
		var nextNode = instance.render();

		instance._pendingSetState = false;
		if (isInvalidNode(nextNode)) {
			nextNode = createVPlaceholder();
		}
		hydrateNode(nextNode, domNode, parentDom, lifecycle, context, instance, isRoot);
		instance._lastNode = nextNode;
		instance.componentDidMount();

	} else {
		var instance$1 = node.instance = Component(props);

		if (!isNullOrUndefined(hooks)) {
			if (!isNullOrUndefined(hooks.componentWillMount)) {
				hooks.componentWillMount(null, props);
			}
			if (!isNullOrUndefined(hooks.componentDidMount)) {
				lifecycle.addListener(function () {
					hooks.componentDidMount(domNode, props);
				});
			}
		}
		return hydrateNode(instance$1, domNode, parentDom, lifecycle, context, instance$1, isRoot);
	}
}

function hydrateNode(node, domNode, parentDom, lifecycle, context, instance, isRoot) {
	var bp = node.bp;
	var tag = node.tag || bp.tag;

	if (isFunction(tag)) {
		node.dom = domNode;
		hydrateComponent(node, tag, node.attrs || {}, node.hooks, node.children, domNode, parentDom, lifecycle, context, instance, isRoot);
	} else {
		if (
			domNode.nodeType !== 1 ||
			tag !== domNode.tagName.toLowerCase()
		) {
			// TODO remake node
		} else {
			node.dom = domNode;
			var hooks = node.hooks;

			if ((bp && bp.hasHooks === true) || !isNullOrUndefined(hooks)) {
				handleAttachedHooks(hooks, lifecycle, domNode);
			}
			var children = node.children;

			if (!isNullOrUndefined(children)) {
				if (isStringOrNumber(children)) {
					if (domNode.textContent !== children) {
						domNode.textContent = children;
					}
				} else {
					var childNodes = getChildNodesWithoutComments(domNode);
					var counter = { i: 0 };
					var rebuild = false;

					if (isArray(children)) {
						for (var i = 0; i < children.length; i++) {
							rebuild = hydrateChild(normaliseChild(children, i), childNodes, counter, domNode, lifecycle, context, instance);

							if (rebuild) {
								break;
							}
						}
					} else {
						if (childNodes.length === 1) {
							rebuild = hydrateChild(children, childNodes, counter, domNode, lifecycle, context, instance);
						} else {
							rebuild = true;
						}
					}

					if (rebuild) {
						// TODO scrap children and rebuild again
					}
				}
			}
			var className = node.className;
			var style = node.style;

			if (!isNullOrUndefined(className)) {
				domNode.className = className;
			}
			if (!isNullOrUndefined(style)) {
				patchStyle(null, style, domNode);
			}
			if (bp && bp.hasAttrs === true) {
				mountBlueprintAttrs(node, bp, domNode, instance);
			} else {
				var attrs = node.attrs;

				if (!isNullOrUndefined(attrs)) {
					handleSelects(node);
					mountAttributes(node, attrs, Object.keys(attrs), domNode, instance);
				}
			}
			if (bp && bp.hasEvents === true) {
				mountBlueprintEvents(node, bp, domNode);
			} else {
				var events = node.events;

				if (!isNullOrUndefined(events)) {
					mountEvents(events, Object.keys(events), domNode);
				}
			}
		}
	}
}
var documetBody = isBrowser ? document.body : null;

function hydrate(node, parentDom, lifecycle) {
	if (parentDom && parentDom.nodeType === 1) {
		var rootNode = parentDom.querySelector('[data-sjsroot]');

		if (rootNode && rootNode.parentNode === parentDom) {
			hydrateNode(node, rootNode, parentDom, lifecycle, {}, true);
			return true;
		}
	}
	// clear parentDom, unless it's document.body
	if (parentDom !== documetBody) {
		parentDom.textContent = '';
	} else {
		console.warn('Svenjs Warning: rendering to the "document.body" is dangerous! Use a dedicated container element instead.');
	}
	return false;
}

var roots = new Map();
var componentToDOMNodeMap = new Map();

function unmount(input, parentDom) {
	if (isVList(input)) {
		unmountVList(input, parentDom, true);
	} else if (isVNode(input)) {
		unmountVNode(input, parentDom, false);
	}
}

function unmountVList(vList, parentDom, removePointer) {
	var items = vList.items;
	var itemsLength = items.length;
	var pointer = vList.pointer;

	if (itemsLength > 0) {
		for (var i = 0; i < itemsLength; i++) {
			var item = items[i];

			if (isVList(item)) {
				unmountVList(item, parentDom, true);
			} else {
				if (parentDom) {
					removeChild(parentDom, item.dom);
				}
				unmount(item, null);
			}
		}
	}
	if (parentDom && removePointer) {
		removeChild(parentDom, pointer);
	}
}

function unmountVNode(node, parentDom, shallow) {
	var instance = node.instance;
	var instanceHooks = null;
	var instanceChildren = null;

	if (!isNullOrUndefined(instance)) {
		instanceHooks = instance.hooks;
		instanceChildren = instance.children;

		if (instance.render !== undefined) {
			instance.componentWillUnmount();
			instance._unmounted = true;
			componentToDOMNodeMap.delete(instance);
			!shallow && unmount(instance._lastNode, null);
		}
	}
	var hooks = node.hooks || instanceHooks;

	if (!isNullOrUndefined(hooks)) {
		if (!isNullOrUndefined(hooks.willDetach)) {
			hooks.willDetach(node.dom);
		}
		if (!isNullOrUndefined(hooks.componentWillUnmount)) {
			hooks.componentWillUnmount(node.dom, hooks);
		}
	}
	var children = (isNullOrUndefined(instance) ? node.children : null) || instanceChildren;

	if (!isNullOrUndefined(children)) {
		if (isArray(children)) {
			for (var i = 0; i < children.length; i++) {
				unmount(children[i], null);
			}
		} else {
			unmount(children, null);
		}
	}
}

function constructDefaults(string, object, value) {
	/* eslint no-return-assign: 0 */
	string.split(',').forEach(function (i) { return object[i] = value; });
}

var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var strictProps = {};
var booleanProps = {};
var namespaces = {};
var isUnitlessNumber = {};

constructDefaults('xlink:href,xlink:arcrole,xlink:actuate,xlink:role,xlink:titlef,xlink:type', namespaces, xlinkNS);
constructDefaults('xml:base,xml:lang,xml:space', namespaces, xmlNS);
constructDefaults('volume,value', strictProps, true);
constructDefaults('muted,scoped,loop,open,checked,default,capture,disabled,selected,readonly,multiple,required,autoplay,controls,seamless,reversed,allowfullscreen,novalidate', booleanProps, true);
constructDefaults('animationIterationCount,borderImageOutset,borderImageSlice,borderImageWidth,boxFlex,boxFlexGroup,boxOrdinalGroup,columnCount,flex,flexGrow,flexPositive,flexShrink,flexNegative,flexOrder,gridRow,gridColumn,fontWeight,lineClamp,lineHeight,opacity,order,orphans,tabSize,widows,zIndex,zoom,fillOpacity,floodOpacity,stopOpacity,strokeDasharray,strokeDashoffset,strokeMiterlimit,strokeOpacity,strokeWidth,', isUnitlessNumber, true);

function isVText(o) {
	return o.text !== undefined;
}

function isVPlaceholder(o) {
	return o.placeholder === true;
}

function isVList(o) {
	return o.items !== undefined;
}

function isVNode(o) {
	return o.tag !== undefined || o.bp !== undefined;
}

function insertOrAppend(parentDom, newNode, nextNode) {
	if (isNullOrUndefined(nextNode)) {
		parentDom.appendChild(newNode);
	} else {
		parentDom.insertBefore(newNode, nextNode);
	}
}

function replaceVListWithNode(parentDom, vList, dom) {
	var pointer = vList.pointer;

	unmountVList(vList, parentDom, false);
	replaceNode(parentDom, dom, pointer);
}

function documentCreateElement(tag, isSVG) {
	var dom;

	if (isSVG === true) {
		dom = document.createElementNS('http://www.w3.org/2000/svg', tag);
	} else {
		dom = document.createElement(tag);
	}
	return dom;
}

function appendText(text, parentDom, singleChild) {
	if (parentDom === null) {
		return document.createTextNode(text);
	} else {
		if (singleChild) {
			if (text !== '') {
				parentDom.textContent = text;
				return parentDom.firstChild;
			} else {
				var textNode = document.createTextNode('');

				parentDom.appendChild(textNode);
				return textNode;
			}
		} else {
			var textNode$1 = document.createTextNode(text);

			parentDom.appendChild(textNode$1);
			return textNode$1;
		}
	}
}

function replaceWithNewNode(lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG) {
	var lastInstance = null;
	var instanceLastNode = lastNode._lastNode;

	if (!isNullOrUndefined(instanceLastNode)) {
		lastInstance = lastNode;
		lastNode = instanceLastNode;
	}
	unmount(lastNode, false);
	var dom = mount(nextNode, null, lifecycle, context, instance, isSVG);

	nextNode.dom = dom;
	replaceNode(parentDom, dom, lastNode.dom);
	if (lastInstance !== null) {
		lastInstance._lastNode = nextNode;
	}
}

function replaceNode(parentDom, nextDom, lastDom) {
	parentDom.replaceChild(nextDom, lastDom);
}

function normalise(object) {
	if (isStringOrNumber(object)) {
		return createVText(object);
	} else if (isInvalidNode(object)) {
		return createVPlaceholder();
	} else if (isArray(object)) {
		return createVList(object);
	}
	return object;
}

function normaliseChild(children, i) {
	var child = children[i];

	return children[i] = normalise(child);
}

function remove(node, parentDom) {
	if (isVList(node)) {
		return unmount(node, parentDom);
	}
	var dom = node.dom;
	if (dom === parentDom) {
		dom.innerHTML = '';
	} else {
		removeChild(parentDom, dom);
		if (recyclingEnabled) {
			pool(node);
		}
	}
	unmount(node, false);
}

function removeChild(parentDom, dom) {
	parentDom.removeChild(dom);
}

function removeEvents(events, lastEventKeys, dom) {
	var eventKeys = lastEventKeys || Object.keys(events);

	for (var i = 0; i < eventKeys.length; i++) {
		var event = eventKeys[i];

		dom[event] = null;
	}
}

// TODO: for node we need to check if document is valid
function getActiveNode$1() {
	return document.activeElement;
}

function removeAllChildren(dom, children) {
	if (recyclingEnabled) {
		var childrenLength = children.length;

		if (childrenLength > 5) {
			for (var i = 0; i < childrenLength; i++) {
				var child = children[i];

				if (!isInvalidNode(child)) {
					pool(child);
				}
			}
		}
	}
	dom.textContent = '';
}

function resetActiveNode$1(activeNode) {
	if (activeNode !== null && activeNode !== document.body && document.activeElement !== activeNode) {
		activeNode.focus(); // TODO: verify are we doing new focus event, if user has focus listener this might trigger it
	}
}

function isKeyed(lastChildren, nextChildren) {
	if (lastChildren.complex) {
		return false;
	}
	return nextChildren.length && !isNullOrUndefined(nextChildren[0]) && !isNullOrUndefined(nextChildren[0].key)
		&& lastChildren.length && !isNullOrUndefined(lastChildren[0]) && !isNullOrUndefined(lastChildren[0].key);
}

function selectOptionValueIfNeeded(vdom, values) {
	if (vdom.tag !== 'option') {
		for (var i = 0, len = vdom.children.length; i < len; i++) {
			selectOptionValueIfNeeded(vdom.children[i], values);
		}
		// NOTE! Has to be a return here to catch optGroup elements
		return;
	}

	var value = vdom.attrs && vdom.attrs.value;

	if (values[value]) {
		vdom.attrs = vdom.attrs || {};
		vdom.attrs.selected = 'selected';
		vdom.dom.selected = true;
	} else {
		vdom.dom.selected = false;
	}
}

function selectValue(vdom) {
	var value = vdom.attrs && vdom.attrs.value;

	var values = {};
	if (isArray(value)) {
		for (var i = 0, len = value.length; i < len; i++) {
			values[value[i]] = value[i];
		}
	} else {
		values[value] = value;
	}
	for (var i$1 = 0, len$1 = vdom.children.length; i$1 < len$1; i$1++) {
		selectOptionValueIfNeeded(vdom.children[i$1], values);
	}

	if (vdom.attrs && vdom.attrs[value]) {
		delete vdom.attrs.value; // TODO! Avoid deletion here. Set to null or undef. Not sure what you want to usev
	}
}

function handleAttachedHooks(hooks, lifecycle, dom) {
	if (!isNullOrUndefined(hooks.created)) {
		hooks.created(dom);
	}
	if (!isNullOrUndefined(hooks.attached)) {
		lifecycle.addListener(function () {
			hooks.attached(dom);
		});
	}
}

function setValueProperty(nextNode) {
	var value = nextNode.attrs.value;
	if (!isNullOrUndefined(value)) {
		nextNode.dom.value = value;
	}
}

function setFormElementProperties(nextTag, nextNode) {
	if (nextTag === 'input' && nextNode.attrs) {
		var inputType = nextNode.attrs.type;
		if (inputType === 'text') {
			setValueProperty(nextNode);
		} else if (inputType === 'checkbox' || inputType === 'radio') {
			var checked = nextNode.attrs.checked;
			nextNode.dom.checked = !!checked;
		}
	} else if (nextTag === 'textarea') {
		setValueProperty(nextNode);
	}
}

function mount(input, parentDom, lifecycle, context, instance, isSVG) {
	if (isVPlaceholder(input)) {
		return mountVPlaceholder(input, parentDom);
	} else if (isVText(input)) {
		return mountVText(input, parentDom);
	} else if (isVList(input)) {
		return mountVList(input, parentDom, lifecycle, context, instance, isSVG);
	} else if (isVNode(input)) {
		return mountVNode$1(input, parentDom, lifecycle, context, instance, isSVG);
	} else {
		var normalisedInput = normalise(input);

		if (input !== normalisedInput) {
			return mount(normalisedInput, parentDom, lifecycle, context, instance, isSVG);
		} else {
			throw new Error(("Svenjs Error: invalid object \"" + (typeof input) + "\" passed to mount()"));
		}
	}
}

function mountVNode$1(vNode, parentDom, lifecycle, context, instance, isSVG) {
	var bp = vNode.bp;

	if (isUndefined(bp)) {
		return mountVNodeWithoutBlueprint(vNode, parentDom, lifecycle, context, instance, isSVG);
	} else {
		if (recyclingEnabled) {
			var dom = recycle(vNode, bp, lifecycle, context, instance);

			if (!isNull(dom)) {
				if (!isNull(parentDom)) {
					parentDom.appendChild(dom);
				}
				return dom;
			}
		}
		return mountVNodeWithBlueprint(vNode, bp, parentDom, lifecycle, context, instance);
	}
}

function mountVList(vList, parentDom, lifecycle, context, instance, isSVG) {
	var items = vList.items;
	var pointer = document.createTextNode('');
	var dom = document.createDocumentFragment();

	mountArrayChildren(items, dom, lifecycle, context, instance, isSVG);
	vList.pointer = pointer;
	vList.dom = dom;
	dom.appendChild(pointer);
	if (parentDom) {
		insertOrAppend(parentDom, dom);
	}
	return dom;
}

function mountVText(vText, parentDom) {
	var dom = document.createTextNode(vText.text);

	vText.dom = dom;
	if (parentDom) {
		insertOrAppend(parentDom, dom);
	}
	return dom;
}

function mountVPlaceholder(vPlaceholder, parentDom) {
	var dom = document.createTextNode('');

	vPlaceholder.dom = dom;
	if (parentDom) {
		insertOrAppend(parentDom, dom);
	}
	return dom;
}

function handleSelects(node) {
	if (node.tag === 'select') {
		selectValue(node);
	}
}

function mountBlueprintAttrs(node, bp, dom, instance) {
	handleSelects(node);
	var attrs = node.attrs;

	if (isNull(bp.attrKeys)) {
		var newKeys = Object.keys(attrs);
		bp.attrKeys = bp.attrKeys ? bp.attrKeys.concat(newKeys) : newKeys;
	}
	var attrKeys = bp.attrKeys;

	mountAttributes(node, attrs, attrKeys, dom, instance);
}

function mountBlueprintEvents(node, bp, dom) {
	var events = node.events;

	if (isNull(bp.eventKeys)) {
		bp.eventKeys = Object.keys(events);
	}
	var eventKeys = bp.eventKeys;

	mountEvents(events, eventKeys, dom);
}

function mountVNodeWithBlueprint(node, bp, parentDom, lifecycle, context, instance) {
	var tag = node.tag;

	if (isTrue(bp.isComponent)) {
		return mountComponent(node, tag, node.attrs || {}, node.hooks, node.children, instance, parentDom, lifecycle, context);
	}
	var dom = documentCreateElement(bp.tag, bp.isSVG);

	node.dom = dom;
	if (isTrue(bp.hasHooks)) {
		handleAttachedHooks(node.hooks, lifecycle, dom);
	}
	if (isTrue(bp.lazy)) {
		handleLazyAttached(node, lifecycle, dom);
	}
	var children = node.children;
	// bp.childrenType:
	// 0: no children
	// 1: text node
	// 2: single child
	// 3: multiple children
	// 4: multiple children (keyed)
	// 5: variable children (defaults to no optimisation)

	switch (bp.childrenType) {
		case 1:
			appendText(children, dom, true);
			break;
		case 2:
			mount(node.children, dom, lifecycle, context, instance, bp.isSVG);
			break;
		case 3:
			mountArrayChildren(children, dom, lifecycle, context, instance, bp.isSVG);
			break;
		case 4:
			for (var i = 0; i < children.length; i++) {
				mount(children[i], dom, lifecycle, context, instance, bp.isSVG);
			}
			break;
		case 5:
			mountChildren(node, children, dom, lifecycle, context, instance, bp.isSVG);
			break;
		default:
			break;
	}

	if (isTrue(bp.hasAttrs)) {
		mountBlueprintAttrs(node, bp, dom, instance);
	}
	if (isTrue(bp.hasClassName)) {
		dom.className = node.className;
	}
	if (isTrue(bp.hasStyle)) {
		patchStyle(null, node.style, dom);
	}
	if (isTrue(bp.hasEvents)) {
		mountBlueprintEvents(node, bp, dom);
	}
	if (!isNull(parentDom)) {
		parentDom.appendChild(dom);
	}
	return dom;
}

function mountVNodeWithoutBlueprint(node, parentDom, lifecycle, context, instance, isSVG) {
	var tag = node.tag;

	if (isFunction(tag)) {
		return mountComponent(node, tag, node.attrs || {}, node.hooks, node.children, instance, parentDom, lifecycle, context);
	}
	if (!isString(tag) || tag === '') {
		throw Error('Svenjs Error: Expected function or string for element tag type');
	}
	if (tag === 'svg') {
		isSVG = true;
	}
	var dom = documentCreateElement(tag, isSVG);
	var children = node.children;
	var attrs = node.attrs;
	var events = node.events;
	var hooks = node.hooks;
	var className = node.className;
	var style = node.style;

	node.dom = dom;
	if (!isNullOrUndefined(hooks)) {
		handleAttachedHooks(hooks, lifecycle, dom);
	}
	if (!isInvalidNode(children)) {
		mountChildren(node, children, dom, lifecycle, context, instance, isSVG);
	}
	if (!isNullOrUndefined(attrs)) {
		handleSelects(node);
		mountAttributes(node, attrs, Object.keys(attrs), dom, instance);
	}
	if (!isNullOrUndefined(className)) {
		dom.className = className;
	}
	if (!isNullOrUndefined(style)) {
		patchStyle(null, style, dom);
	}
	if (!isNullOrUndefined(events)) {
		mountEvents(events, Object.keys(events), dom);
	}
	if (!isNull(parentDom)) {
		parentDom.appendChild(dom);
	}
	return dom;
}

function mountArrayChildren(children, parentDom, lifecycle, context, instance, isSVG) {
	children.complex = false;
	for (var i = 0; i < children.length; i++) {
		var child = normaliseChild(children, i);

		if (isVText(child)) {
			mountVText(child, parentDom);
			children.complex = true;
		} else if (isVPlaceholder(child)) {
			mountVPlaceholder(child, parentDom);
			children.complex = true;
		} else if (isVList(child)) {
			mountVList(child, parentDom, lifecycle, context, instance, isSVG);
			children.complex = true;
		} else {
			mount(child, parentDom, lifecycle, context, instance, isSVG);
		}
	}
}

function mountChildren(node, children, parentDom, lifecycle, context, instance, isSVG) {
	if (isArray(children)) {
		mountArrayChildren(children, parentDom, lifecycle, context, instance, isSVG);
	} else if (isStringOrNumber(children)) {
		appendText(children, parentDom, true);
	} else if (!isInvalidNode(children)) {
		mount(children, parentDom, lifecycle, context, instance, isSVG);
	}
}

function mountRef(instance, value, refValue) {
	if (!isInvalidNode(instance) && isString(value)) {
		instance.refs[value] = refValue;
	}
	else if (isFunction(value)) {
		value(refValue);
	}
}

function mountEvents(events, eventKeys, dom) {
	for (var i = 0; i < eventKeys.length; i++) {
		var event = eventKeys[i];

		dom[event] = events[event];
	}
}

function mountComponent(parentNode, Component, props, hooks, children, lastInstance, parentDom, lifecycle, context) {
	props = addChildrenToProps(children, props);

	var dom;
	if (isStatefulComponent(Component)) {
		var instance = new Component(props, context);

		instance._patch = patch;
		instance._componentToDOMNodeMap = componentToDOMNodeMap;
		if (!isNullOrUndefined(lastInstance) && props.ref) {
			mountRef(lastInstance, props.ref, instance);
		}
		var childContext = instance.getChildContext();

		if (!isNullOrUndefined(childContext)) {
			context = Object.assign({}, context, childContext);
		}
		instance.context = context;
		instance._unmounted = false;
		instance._parentNode = parentNode;
		if (lastInstance) {
			instance._parentComponent = lastInstance;
		}
		instance._pendingSetState = true;
		instance.componentWillMount();
		var node = instance.render();

		if (isInvalidNode(node)) {
			node = createVPlaceholder();
		}
		instance._pendingSetState = false;
		dom = mount(node, null, lifecycle, context, instance, false);
		instance._lastNode = node;
		instance.componentDidMount();
		if (parentDom !== null && !isInvalidNode(dom)) {
			parentDom.appendChild(dom);
		}
		componentToDOMNodeMap.set(instance, dom);
		parentNode.dom = dom;
		parentNode.instance = instance;
	} else {
		if (!isNullOrUndefined(hooks)) {
			if (!isNullOrUndefined(hooks.componentWillMount)) {
				hooks.componentWillMount(null, props);
			}
			if (!isNullOrUndefined(hooks.componentDidMount)) {
				lifecycle.addListener(function () {
					hooks.componentDidMount(dom, props);
				});
			}
		}

		/* eslint new-cap: 0 */
		var node$1 = Component(props, context);

		if (isInvalidNode(node$1)) {
			node$1 = createVPlaceholder();
		}
		dom = mount(node$1, null, lifecycle, context, null, false);

		parentNode.instance = node$1;

		if (parentDom !== null && !isInvalidNode(dom)) {
			parentDom.appendChild(dom);
		}
		parentNode.dom = dom;
	}
	return dom;
}

function mountAttributes(node, attrs, attrKeys, dom, instance) {
	for (var i = 0; i < attrKeys.length; i++) {
		var attr = attrKeys[i];

		if (attr === 'ref') {
			mountRef(getRefInstance$1(node, instance), attrs[attr], dom);
		} else {
			patchAttribute(attr, null, attrs[attr], dom);
		}
	}
}

function patch(lastInput, nextInput, parentDom, lifecycle, context, instance, isSVG) {
	if (lastInput !== nextInput) {
		if (isInvalidNode(lastInput)) {
			mount(nextInput, parentDom, lifecycle, context, instance, isSVG);
		} else if (isInvalidNode(nextInput)) {
			remove(lastInput, parentDom);
		} else if (isStringOrNumber(lastInput)) {
			if (isStringOrNumber(nextInput)) {
				parentDom.firstChild.nodeValue = nextInput;
			} else {
				var dom = mount(nextInput, null, lifecycle, context, instance, isSVG);

				nextInput.dom = dom;
				replaceNode(parentDom, dom, parentDom.firstChild);
			}
		} else if (isStringOrNumber(nextInput)) {
			replaceNode(parentDom, document.createTextNode(nextInput), lastInput.dom);
		} else {
			if (isVList(nextInput)) {
				if (isVList(lastInput)) {
					patchVList(lastInput, nextInput, parentDom, lifecycle, context, instance, isSVG);
				} else {
					replaceNode(parentDom, mountVList(nextInput, null, lifecycle, context, instance, isSVG), lastInput.dom);
					unmount(lastInput, null);
				}
			} else if (isVList(lastInput)) {
				replaceVListWithNode(parentDom, lastInput, mount(nextInput, null, lifecycle, context, instance, isSVG));
			} else if (isVPlaceholder(nextInput)) {
				if (isVPlaceholder(lastInput)) {
					patchVFragment(lastInput, nextInput);
				} else {
					replaceNode(parentDom, mountVPlaceholder(nextInput, null), lastInput.dom);
					unmount(lastInput, null);
				}
			} else if (isVPlaceholder(lastInput)) {
				replaceNode(parentDom, mount(nextInput, null, lifecycle, context, instance, isSVG), lastInput.dom);
			} else if (isVText(nextInput)) {
				if (isVText(lastInput)) {
					patchVText(lastInput, nextInput);
				} else {
					replaceNode(parentDom, mountVText(nextInput, null), lastInput.dom);
					unmount(lastInput, null);
				}
			} else if (isVText(lastInput)) {
				replaceNode(parentDom, mount(nextInput, null, lifecycle, context, instance, isSVG), lastInput.dom);
			} else if (isVNode(nextInput)) {
				if (isVNode(lastInput)) {
					patchVNode(lastInput, nextInput, parentDom, lifecycle, context, instance, isSVG, false);
				} else {
					replaceNode(parentDom, mountVNode(nextInput, null, lifecycle, context, instance, isSVG), lastInput.dom);
					unmount(lastInput, null);
				}
			} else if (isVNode(lastInput)) {
				replaceNode(parentDom, mount(nextInput, null, lifecycle, context, instance, isSVG), lastInput.dom);
				unmount(lastInput, null);
			} else {
				return patch(lastInput, normalise(nextInput), parentDom, lifecycle, context, instance, isSVG);
			}
		}
	}
	return nextInput;
}

function patchTextNode(dom, lastChildren, nextChildren) {
	if (isStringOrNumber(lastChildren) && lastChildren !== '') {
		dom.firstChild.nodeValue = nextChildren;
	} else {
		dom.textContent = nextChildren;
	}
}

function patchRef(instance, lastValue, nextValue, dom) {
	if (instance) {
		if (isString(lastValue)) {
			delete instance.refs[lastValue];
		}
		if (isString(nextValue)) {
			instance.refs[nextValue] = dom;
		}
	}
}

function patchChildren(lastNode, nextNode, dom, lifecycle, context, instance, isSVG) {
	var nextChildren = nextNode.children;
	var lastChildren = lastNode.children;

	if (lastChildren === nextChildren) {
		return;
	}
	if (isInvalidNode(lastChildren)) {
		if (isStringOrNumber(nextChildren)) {
			patchTextNode(dom, lastChildren, nextChildren);
		} else if (!isInvalidNode(nextChildren)) {
			if (isArray(nextChildren)) {
				mountArrayChildren(nextChildren, dom, lifecycle, context, instance, isSVG);
			} else {
				mount(nextChildren, dom, lifecycle, context, instance, isSVG);
			}
		}
	} else {
		if (isInvalidNode(nextChildren)) {
			removeAllChildren(dom, lastChildren);
		} else {
			if (isArray(lastChildren)) {
				if (isArray(nextChildren)) {
					nextChildren.complex = lastChildren.complex;
					if (isKeyed(lastChildren, nextChildren)) {
						patchKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG, null);
					} else {
						patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG, null);
					}
				} else {
					patchNonKeyedChildren(lastChildren, [nextChildren], dom, lifecycle, context, instance, isSVG, null);
				}
			} else {
				if (isArray(nextChildren)) {
					var lastChild = lastChildren;

					if (isStringOrNumber(lastChildren)) {
						lastChild = createVText(lastChild);
						lastChild.dom = dom.firstChild;
					}
					patchNonKeyedChildren([lastChild], nextChildren, dom, lifecycle, context, instance, isSVG, null);
				} else if (isStringOrNumber(nextChildren)) {
					patchTextNode(dom, lastChildren, nextChildren);
				} else if (isStringOrNumber(lastChildren)) {
					patch(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG);
				} else {
					patchVNode(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG, false);
				}
			}
		}
	}
}

function patchVNode(lastVNode, nextVNode, parentDom, lifecycle, context, instance, isSVG, skipLazyCheck) {
	var lastBp = lastVNode.bp;
	var nextBp = nextVNode.bp;

	if (lastBp === undefined || nextBp === undefined) {
		patchVNodeWithoutBlueprint(lastVNode, nextVNode, parentDom, lifecycle, context, instance, isSVG);
	} else {
		patchVNodeWithBlueprint(lastVNode, nextVNode, lastBp, nextBp, parentDom, lifecycle, context, instance, skipLazyCheck);
	}
}

function patchVNodeWithBlueprint(lastVNode, nextVNode, lastBp, nextBp, parentDom, lifecycle, context, instance, skipLazyCheck) {
	var nextHooks;

	if (nextBp.hasHooks === true) {
		nextHooks = nextVNode.hooks;
		if (nextHooks && !isNullOrUndefined(nextHooks.willUpdate)) {
			nextHooks.willUpdate(lastVNode.dom);
		}
	}
	var nextTag = nextVNode.tag || nextBp.tag;
	var lastTag = lastVNode.tag || lastBp.tag;

	if (lastTag !== nextTag) {
		if (lastBp && lastBp.isComponent === true) {
			var lastNodeInstance = lastVNode.instance;

			if (nextBp.isComponent === true) {
				replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, instance, false);
			} else if (isStatefulComponent(lastTag)) {
				unmountVNode(lastVNode, null, true);
				var lastNode = lastNodeInstance._lastNode;
				patchVNodeWithBlueprint(lastNode, nextVNode, lastNode.bp, nextBp, parentDom, lifecycle, context, instance, nextBp.isSVG);
			} else {
				unmountVNode(lastVNode, null, true);
				patchVNodeWithBlueprint(lastNodeInstance, nextVNode, lastNodeInstance.bp, nextBp, parentDom, lifecycle, context, instance, nextBp.isSVG);
			}
		} else {
			replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, instance, nextBp.isSVG);
		}
	} else if (isNullOrUndefined(lastTag)) {
		nextVNode.dom = lastVNode.dom;
	} else {
		if (lastBp && lastBp.isComponent === true) {
			if (nextBp.isComponent === true) {
				var instance$1 = lastVNode.instance;

				if (!isNullOrUndefined(instance$1) && instance$1._unmounted) {
					var newDom = mountComponent(nextVNode, lastTag, nextVNode.attrs || {}, nextVNode.hooks, nextVNode.children, instance$1, parentDom, lifecycle, context);
					if (parentDom !== null) {
						replaceNode(parentDom, newDom, lastVNode.dom);
					}
				} else {
					nextVNode.instance = instance$1;
					nextVNode.dom = lastVNode.dom;
					patchComponent(true, nextVNode, nextVNode.tag, lastBp, nextBp, instance$1, lastVNode.attrs || {}, nextVNode.attrs || {}, nextVNode.hooks, lastVNode.children, nextVNode.children, parentDom, lifecycle, context);
				}
			}
		} else {
			var dom = lastVNode.dom;
			var lastChildrenType = lastBp.childrenType;
			var nextChildrenType = nextBp.childrenType;
			nextVNode.dom = dom;

			if (nextBp.lazy === true && skipLazyCheck === false) {
				var clipData = lastVNode.clipData;

				if (lifecycle.scrollY === null) {
					lifecycle.refresh();
				}

				nextVNode.clipData = clipData;
				if (clipData.pending === true || clipData.top - lifecycle.scrollY > lifecycle.screenHeight) {
					if (setClipNode(clipData, dom, lastVNode, nextVNode, parentDom, lifecycle, context, instance, lastBp.isSVG)) {
						return;
					}
				}
				if (clipData.bottom < lifecycle.scrollY) {
					if (setClipNode(clipData, dom, lastVNode, nextVNode, parentDom, lifecycle, context, instance, lastBp.isSVG)) {
						return;
					}
				}
			}

			if (lastChildrenType > 0 || nextChildrenType > 0) {
				if (nextChildrenType === 5 || lastChildrenType === 5) {
					patchChildren(lastVNode, nextVNode, dom, lifecycle, context, instance);
				} else {
					var lastChildren = lastVNode.children;
					var nextChildren = nextVNode.children;

					if (lastChildrenType === 0 || isInvalidNode(lastChildren)) {
						if (nextChildrenType > 2) {
							mountArrayChildren(nextChildren, dom, lifecycle, context, instance);
						} else {
							mount(nextChildren, dom, lifecycle, context, instance);
						}
					} else if (nextChildrenType === 0 || isInvalidNode(nextChildren)) {
						if (lastChildrenType > 2) {
							removeAllChildren(dom, lastChildren);
						} else {
							remove(lastChildren, dom);
						}
					} else {
						if (lastChildren !== nextChildren) {
							if (lastChildrenType === 4 && nextChildrenType === 4) {
								patchKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, instance, nextBp.isSVG, null);
							} else if (lastChildrenType === 2 && nextChildrenType === 2) {
								patch(lastChildren, nextChildren, dom, lifecycle, context, instance, true, nextBp.isSVG);
							} else if (lastChildrenType === 1 && nextChildrenType === 1) {
								patchTextNode(dom, lastChildren, nextChildren);
							} else {
								patchChildren(lastVNode, nextVNode, dom, lifecycle, context, instance, nextBp.isSVG);
							}
						}
					}
				}
			}
			if (lastBp.hasAttrs === true || nextBp.hasAttrs === true) {
				patchAttributes(lastVNode, nextVNode, lastBp.attrKeys, nextBp.attrKeys, dom, instance);
			}
			if (lastBp.hasEvents === true || nextBp.hasEvents === true) {
				patchEvents(lastVNode.events, nextVNode.events, lastBp.eventKeys, nextBp.eventKeys, dom);
			}
			if (lastBp.hasClassName === true || nextBp.hasClassName === true) {
				var nextClassName = nextVNode.className;

				if (lastVNode.className !== nextClassName) {
					if (isNullOrUndefined(nextClassName)) {
						dom.removeAttribute('class');
					} else {
						dom.className = nextClassName;
					}
				}
			}
			if (lastBp.hasStyle === true || nextBp.hasStyle === true) {
				var nextStyle = nextVNode.style;
				var lastStyle = lastVNode.style;

				if (lastStyle !== nextStyle) {
					patchStyle(lastStyle, nextStyle, dom);
				}
			}
			if (nextBp.hasHooks === true && !isNullOrUndefined(nextHooks.didUpdate)) {
				nextHooks.didUpdate(dom);
			}
			setFormElementProperties(nextTag, nextVNode);
		}
	}
}

function patchVNodeWithoutBlueprint(lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG) {
	var nextHooks = nextNode.hooks;
	var nextHooksDefined = !isNullOrUndefined(nextHooks);

	if (nextHooksDefined && !isNullOrUndefined(nextHooks.willUpdate)) {
		nextHooks.willUpdate(lastNode.dom);
	}
	var nextTag = nextNode.tag || ((isNullOrUndefined(nextNode.bp)) ? null : nextNode.bp.tag);
	var lastTag = lastNode.tag || ((isNullOrUndefined(lastNode.bp)) ? null : lastNode.bp.tag);

	if (nextTag === 'svg') {
		isSVG = true;
	}
	if (lastTag !== nextTag) {
		var lastNodeInstance = lastNode.instance;

		if (isFunction(lastTag)) {
			if (isFunction(nextTag)) {
				replaceWithNewNode(lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG);
			} else if (isStatefulComponent(lastTag)) {
				unmountVNode(lastNode, null, true);
				patchVNodeWithoutBlueprint(lastNodeInstance._lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG);
			} else {
				unmountVNode(lastNode, null, true);
				patchVNodeWithoutBlueprint(lastNodeInstance, nextNode, parentDom, lifecycle, context, instance, isSVG);
			}
		} else {
			replaceWithNewNode(lastNodeInstance || lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG);
		}
	} else if (isNullOrUndefined(lastTag)) {
		nextNode.dom = lastNode.dom;
	} else {
		if (isFunction(lastTag)) {
			if (isFunction(nextTag)) {
				var instance$1 = lastNode._instance;

				if (!isNullOrUndefined(instance$1) && instance$1._unmounted) {
					var newDom = mountComponent(nextNode, lastTag, nextNode.attrs || {}, nextNode.hooks, nextNode.children, instance$1, parentDom, lifecycle, context);
					if (parentDom !== null) {
						replaceNode(parentDom, newDom, lastNode.dom);
					}
				} else {
					nextNode.instance = lastNode.instance;
					nextNode.dom = lastNode.dom;
					patchComponent(false, nextNode, nextNode.tag, null, null, nextNode.instance, lastNode.attrs || {}, nextNode.attrs || {}, nextNode.hooks, lastNode.children, nextNode.children, parentDom, lifecycle, context);
				}
			}
		} else {
			var dom = lastNode.dom;
			var nextClassName = nextNode.className;
			var nextStyle = nextNode.style;

			nextNode.dom = dom;

			patchChildren(lastNode, nextNode, dom, lifecycle, context, instance, isSVG);
			patchAttributes(lastNode, nextNode, null, null, dom, instance);
			patchEvents(lastNode.events, nextNode.events, null, null, dom);

			if (lastNode.className !== nextClassName) {
				if (isNullOrUndefined(nextClassName)) {
					dom.removeAttribute('class');
				} else {
					dom.className = nextClassName;
				}
			}
			if (lastNode.style !== nextStyle) {
				patchStyle(lastNode.style, nextStyle, dom);
			}
			if (nextHooksDefined && !isNullOrUndefined(nextHooks.didUpdate)) {
				nextHooks.didUpdate(dom);
			}
			setFormElementProperties(nextTag, nextNode);
		}
	}
}

function patchAttributes(lastNode, nextNode, lastAttrKeys, nextAttrKeys, dom, instance) {
	if (lastNode.tag === 'select') {
		selectValue(nextNode);
	}
	var nextAttrs = nextNode.attrs;
	var lastAttrs = lastNode.attrs;
	var nextAttrsIsUndef = isNullOrUndefined(nextAttrs);
	var lastAttrsIsNotUndef = !isNullOrUndefined(lastAttrs);

	if (!nextAttrsIsUndef) {
		var nextAttrsKeys = nextAttrKeys || Object.keys(nextAttrs);
		var attrKeysLength = nextAttrsKeys.length;

		for (var i = 0; i < attrKeysLength; i++) {
			var attr = nextAttrsKeys[i];
			var lastAttrVal = lastAttrsIsNotUndef && lastAttrs[attr];
			var nextAttrVal = nextAttrs[attr];

			if (lastAttrVal !== nextAttrVal) {
				if (attr === 'ref') {
					patchRef(instance, lastAttrVal, nextAttrVal, dom);
				} else {
					patchAttribute(attr, lastAttrVal, nextAttrVal, dom);
				}
			}
		}
	}
	if (lastAttrsIsNotUndef) {
		var lastAttrsKeys = lastAttrKeys || Object.keys(lastAttrs);
		var attrKeysLength$1 = lastAttrsKeys.length;

		for (var i$1 = 0; i$1 < attrKeysLength$1; i$1++) {
			var attr$1 = lastAttrsKeys[i$1];

			if (nextAttrsIsUndef || isNullOrUndefined(nextAttrs[attr$1])) {
				if (attr$1 === 'ref') {
					patchRef(getRefInstance(node, instance), lastAttrs[attr$1], null, dom);
				} else {
					dom.removeAttribute(attr$1);
				}
			}
		}
	}
}


function patchStyle(lastAttrValue, nextAttrValue, dom) {
	if (isString(nextAttrValue)) {
		dom.style.cssText = nextAttrValue;
	} else if (isNullOrUndefined(lastAttrValue)) {
		if (!isNullOrUndefined(nextAttrValue)) {
			var styleKeys = Object.keys(nextAttrValue);

			for (var i = 0; i < styleKeys.length; i++) {
				var style = styleKeys[i];
				var value = nextAttrValue[style];

				if (isNumber(value) && !isUnitlessNumber[style]) {
					dom.style[style] = value + 'px';
				} else {
					dom.style[style] = value;
				}
			}
		}
	} else if (isNullOrUndefined(nextAttrValue)) {
		dom.removeAttribute('style');
	} else {
		var styleKeys$1 = Object.keys(nextAttrValue);

		for (var i$1 = 0; i$1 < styleKeys$1.length; i$1++) {
			var style$1 = styleKeys$1[i$1];
			var value$1 = nextAttrValue[style$1];

			if (isNumber(value$1) && !isUnitlessNumber[style$1]) {
				dom.style[style$1] = value$1 + 'px';
			} else {
				dom.style[style$1] = value$1;
			}
		}
		var lastStyleKeys = Object.keys(lastAttrValue);

		for (var i$2 = 0; i$2 < lastStyleKeys.length; i$2++) {
			var style$2 = lastStyleKeys[i$2];
			if (isNullOrUndefined(nextAttrValue[style$2])) {
				dom.style[style$2] = '';
			}
		}
	}
}

function patchEvents(lastEvents, nextEvents, _lastEventKeys, _nextEventKeys, dom) {
	var nextEventsDefined = !isNullOrUndefined(nextEvents);
	var lastEventsDefined = !isNullOrUndefined(lastEvents);
	var lastEventKeys;

	if (lastEventsDefined) {
		lastEventKeys = _lastEventKeys || Object.keys(lastEvents);
	}
	if (nextEventsDefined) {
		var nextEventKeys = _nextEventKeys || Object.keys(nextEvents);

		if (lastEventsDefined) {
			for (var i = 0; i < nextEventKeys.length; i++) {
				var event = nextEventKeys[i];
				var lastEvent = lastEvents[event];
				var nextEvent = nextEvents[event];

				if (lastEvent !== nextEvent) {
					dom[event] = nextEvent;
				}
			}
			for (var i$1 = 0; i$1 < lastEventKeys.length; i$1++) {
				var event$1 = lastEventKeys[i$1];

				if (isNullOrUndefined(nextEvents[event$1])) {
					dom[event$1] = null;
				}
			}
		} else {
			mountEvents(nextEvents, nextEventKeys, dom);
		}
	} else if (lastEventsDefined) {
		removeEvents(lastEvents, lastEventKeys, dom);
	}
}

function patchAttribute(attrName, lastAttrValue, nextAttrValue, dom) {
	if (attrName === 'dangerouslySetInnerHTML') {
		var lastHtml = lastAttrValue && lastAttrValue.__html;
		var nextHtml = nextAttrValue && nextAttrValue.__html;

		if (isNullOrUndefined(nextHtml)) {
			throw new Error('Svenjs Error: dangerouslySetInnerHTML requires an object with a __html propety containing the innerHTML content');
		}
		if (lastHtml !== nextHtml) {
			dom.innerHTML = nextHtml;
		}
	} else if (attrName === 'eventData') {
		dom.eventData = nextAttrValue;
	} else if (strictProps[attrName]) {
		dom[attrName] = nextAttrValue === null ? '' : nextAttrValue;
	} else {
		if (booleanProps[attrName]) {
			dom[attrName] = nextAttrValue ? true : false;
		} else {
			var ns = namespaces[attrName];

			if (nextAttrValue === false || isNullOrUndefined(nextAttrValue)) {
				if (ns !== undefined) {
					dom.removeAttributeNS(ns, attrName);
				} else {
					dom.removeAttribute(attrName);
				}
			} else {
				if (ns !== undefined) {
					dom.setAttributeNS(ns, attrName, nextAttrValue === true ? attrName : nextAttrValue);
				} else {
					dom.setAttribute(attrName, nextAttrValue === true ? attrName : nextAttrValue);
				}
			}
		}
	}
}

function patchComponent(hasBlueprint, lastNode, Component, lastBp, nextBp, instance, lastProps, nextProps, nextHooks, lastChildren, nextChildren, parentDom, lifecycle, context) {
	nextProps = addChildrenToProps(nextChildren, nextProps);

	if (isStatefulComponent(Component)) {
		var prevProps = instance.props;
		var prevState = instance.state;
		var nextState = instance.state;

		var childContext = instance.getChildContext();
		if (!isNullOrUndefined(childContext)) {
			context = Object.assign({}, context, childContext);
		}
		instance.context = context;
		var nextNode = instance._updateComponent(prevState, nextState, prevProps, nextProps);

		if (nextNode === NO_RENDER) {
			nextNode = instance._lastNode;
		} else if (isNullOrUndefined(nextNode)) {
			nextNode = createVPlaceholder();
		}
		patch(instance._lastNode, nextNode, parentDom, lifecycle, context, instance, null, false);
		lastNode.dom = nextNode.dom;
		instance._lastNode = nextNode;
		instance.componentDidUpdate(prevProps, prevState);
		componentToDOMNodeMap.set(instance, nextNode.dom);
	} else {
		var shouldUpdate = true;
		var nextHooksDefined = (hasBlueprint && nextBp.hasHooks === true) || !isNullOrUndefined(nextHooks);

		lastProps = addChildrenToProps(lastChildren, lastProps);
		if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentShouldUpdate)) {
			shouldUpdate = nextHooks.componentShouldUpdate(lastNode.dom, lastProps, nextProps);
		}
		if (shouldUpdate !== false) {
			if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentWillUpdate)) {
				nextHooks.componentWillUpdate(lastNode.dom, lastProps, nextProps);
			}
			var nextNode$1 = Component(nextProps, context);

			if (isInvalidNode(nextNode$1)) {
				nextNode$1 = createVPlaceholder();
			}
			nextNode$1.dom = lastNode.dom;
			patch(instance, nextNode$1, parentDom, lifecycle, context, null, null, false);
			lastNode.instance = nextNode$1;
			if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentDidUpdate)) {
				nextHooks.componentDidUpdate(lastNode.dom, lastProps, nextProps);
			}
		}
	}
}

function patchVList(lastVList, nextVList, parentDom, lifecycle, context, instance, isSVG) {
	var lastItems = lastVList.items;
	var nextItems = nextVList.items;
	var pointer = lastVList.pointer;

	nextVList.dom = lastVList.dom;
	nextVList.pointer = pointer;
	if (!lastItems !== nextItems) {
		if (isKeyed(lastItems, nextItems)) {
			patchKeyedChildren(lastItems, nextItems, parentDom, lifecycle, context, instance, isSVG, nextVList);
		} else {
			patchNonKeyedChildren(lastItems, nextItems, parentDom, lifecycle, context, instance, isSVG, nextVList);
		}
	}
}

function patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG, parentVList) {
	var lastChildrenLength = lastChildren.length;
	var nextChildrenLength = nextChildren.length;
	var commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
	var i = 0;

	for (; i < commonLength; i++) {
		var lastChild = lastChildren[i];
		var nextChild = normaliseChild(nextChildren, i);

		patch(lastChild, nextChild, dom, lifecycle, context, instance, isSVG);
	}
	if (lastChildrenLength < nextChildrenLength) {
		for (i = commonLength; i < nextChildrenLength; i++) {
			var child = normaliseChild(nextChildren, i);

			insertOrAppend(dom, mount(child, null, lifecycle, context, instance, isSVG), parentVList && parentVList.pointer);
		}
	} else if (lastChildrenLength > nextChildrenLength) {
		for (i = commonLength; i < lastChildrenLength; i++) {
			remove(lastChildren[i], dom);
		}
	}
}

function patchVFragment(lastVFragment, nextVFragment) {
	nextVFragment.dom = lastVFragment.dom;
}

function patchVText(lastVText, nextVText) {
	var nextText = nextVText.text;
	var dom = lastVText.dom;

	nextVText.dom = dom;
	if (lastVText.text !== nextText) {
		dom.nodeValue = nextText;
	}
}

function patchKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, instance, isSVG, parentVList) {
	var lastChildrenLength = lastChildren.length;
	var nextChildrenLength = nextChildren.length;
	var lastEndIndex = lastChildrenLength - 1;
	var nextEndIndex = nextChildrenLength - 1;
	var lastStartIndex = 0;
	var nextStartIndex = 0;
	var lastStartNode = null;
	var nextStartNode = null;
	var nextEndNode = null;
	var lastEndNode = null;
	var nextNode;

	while (lastStartIndex <= lastEndIndex && nextStartIndex <= nextEndIndex) {
		nextStartNode = nextChildren[nextStartIndex];
		lastStartNode = lastChildren[lastStartIndex];

		if (nextStartNode.key !== lastStartNode.key) {
			break;
		}
		patchVNode(lastStartNode, nextStartNode, dom, lifecycle, context, instance, isSVG, false);
		nextStartIndex++;
		lastStartIndex++;
	}
	while (lastStartIndex <= lastEndIndex && nextStartIndex <= nextEndIndex) {
		nextEndNode = nextChildren[nextEndIndex];
		lastEndNode = lastChildren[lastEndIndex];

		if (nextEndNode.key !== lastEndNode.key) {
			break;
		}
		patchVNode(lastEndNode, nextEndNode, dom, lifecycle, context, instance, isSVG, false);
		nextEndIndex--;
		lastEndIndex--;
	}
	while (lastStartIndex <= lastEndIndex && nextStartIndex <= nextEndIndex) {
		nextEndNode = nextChildren[nextEndIndex];
		lastStartNode = lastChildren[lastStartIndex];

		if (nextEndNode.key !== lastStartNode.key) {
			break;
		}
		nextNode = (nextEndIndex + 1 < nextChildrenLength) ? nextChildren[nextEndIndex + 1].dom : null;
		patchVNode(lastStartNode, nextEndNode, dom, lifecycle, context, instance, isSVG, false);
		insertOrAppend(dom, nextEndNode.dom, nextNode);
		nextEndIndex--;
		lastStartIndex++;
	}
	while (lastStartIndex <= lastEndIndex && nextStartIndex <= nextEndIndex) {
		nextStartNode = nextChildren[nextStartIndex];
		lastEndNode = lastChildren[lastEndIndex];

		if (nextStartNode.key !== lastEndNode.key) {
			break;
		}
		nextNode = lastChildren[lastStartIndex].dom;
		patchVNode(lastEndNode, nextStartNode, dom, lifecycle, context, instance, isSVG, false);
		insertOrAppend(dom, nextStartNode.dom, nextNode);
		nextStartIndex++;
		lastEndIndex--;
	}

	if (lastStartIndex > lastEndIndex) {
		if (nextStartIndex <= nextEndIndex) {
			nextNode = (nextEndIndex + 1 < nextChildrenLength) ? nextChildren[nextEndIndex + 1].dom : parentVList && parentVList.pointer;
			for (; nextStartIndex <= nextEndIndex; nextStartIndex++) {
				insertOrAppend(dom, mount(nextChildren[nextStartIndex], null, lifecycle, context, instance, isSVG), nextNode);
			}
		}
	} else if (nextStartIndex > nextEndIndex) {
		while (lastStartIndex <= lastEndIndex) {
			remove(lastChildren[lastStartIndex++], dom);
		}
	} else {
		var aLength = lastEndIndex - lastStartIndex + 1;
		var bLength = nextEndIndex - nextStartIndex + 1;
		var sources = new Array(bLength);

		// Mark all nodes as inserted.
		var i;
		for (i = 0; i < bLength; i++) {
			sources[i] = -1;
		}
		var moved = false;
		var removeOffset = 0;
		var lastTarget = 0;
		var index;
		var removed = true;
		var k = 0;

		if ((bLength <= 4) || (aLength * bLength <= 16)) {
			for (i = lastStartIndex; i <= lastEndIndex; i++) {
				removed = true;
				lastEndNode = lastChildren[i];
				if (k < bLength) {
					for (index = nextStartIndex; index <= nextEndIndex; index++) {
						nextEndNode = nextChildren[index];
						if (lastEndNode.key === nextEndNode.key) {
							sources[index - nextStartIndex] = i;

							if (lastTarget > index) {
								moved = true;
							} else {
								lastTarget = index;
							}
							patchVNode(lastEndNode, nextEndNode, dom, lifecycle, context, instance, isSVG, false);
							k++;
							removed = false;
							break;
						}
					}
				}
				if (removed) {
					remove(lastEndNode, dom);
					removeOffset++;
				}
			}
		} else {
			var prevItemsMap = new Map();

			for (i = nextStartIndex; i <= nextEndIndex; i++) {
				prevItemsMap.set(nextChildren[i].key, i);
			}
			for (i = lastStartIndex; i <= lastEndIndex; i++) {
				removed = true;
				lastEndNode = lastChildren[i];

				if (k < nextChildrenLength) {
					index = prevItemsMap.get(lastEndNode.key);

					if (index !== undefined) {
						nextEndNode = nextChildren[index];
						sources[index - nextStartIndex] = i;
						if (lastTarget > index) {
							moved = true;
						} else {
							lastTarget = index;
						}
						patchVNode(lastEndNode, nextEndNode, dom, lifecycle, context, instance, isSVG, false);
						k++;
						removed = false;
					}
				}
				if (removed) {
					remove(lastEndNode, dom);
					removeOffset++;
				}
			}
		}

		var pos;
		if (moved) {
			var seq = lis_algorithm(sources);
			index = seq.length - 1;
			for (i = bLength - 1; i >= 0; i--) {
				if (sources[i] === -1) {
					pos = i + nextStartIndex;
					nextNode = (pos + 1 < nextChildrenLength) ? nextChildren[pos + 1].dom : parentVList && parentVList.pointer;
					insertOrAppend(dom, mount(nextChildren[pos], null, lifecycle, context, instance, isSVG), nextNode);
				} else {
					if (index < 0 || i !== seq[index]) {
						pos = i + nextStartIndex;
						nextNode = (pos + 1 < nextChildrenLength) ? nextChildren[pos + 1].dom : parentVList && parentVList.pointer;
						insertOrAppend(dom, nextChildren[pos].dom, nextNode);
					} else {
						index--;
					}
				}
			}
		} else if (aLength - removeOffset !== bLength) {
			for (i = bLength - 1; i >= 0; i--) {
				if (sources[i] === -1) {
					pos = i + nextStartIndex;
					nextNode = (pos + 1 < nextChildrenLength) ? nextChildren[pos + 1].dom : parentVList && parentVList.pointer;
					insertOrAppend(dom, mount(nextChildren[pos], null, lifecycle, context, instance, isSVG), nextNode);
				}
			}
		}
	}
}

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function lis_algorithm(a) {
	var p = a.slice(0);
	var result = [];
	result.push(0);
	var i;
	var j;
	var u;
	var v;
	var c;

	for (i = 0; i < a.length; i++) {
		if (a[i] === -1) {
			continue;
		}

		j = result[result.length - 1];
		if (a[j] < a[i]) {
			p[i] = j;
			result.push(i);
			continue;
		}

		u = 0;
		v = result.length - 1;

		while (u < v) {
			c = ((u + v) / 2) | 0;
			if (a[result[c]] < a[i]) {
				u = c + 1;
			} else {
				v = c;
			}
		}

		if (a[i] < a[result[u]]) {
			if (u > 0) {
				p[i] = result[u - 1];
			}
			result[u] = i;
		}
	}

	u = result.length;
	v = result[u - 1];

	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}

	return result;
}

var screenWidth = isBrowser && window.screen.width;
var screenHeight = isBrowser && window.screen.height;
var scrollX = 0;
var scrollY = 0;
var lastScrollTime = 0;

if (isBrowser) {
	window.onscroll = function () {
		scrollX = window.scrollX;
		scrollY = window.scrollY;
		lastScrollTime = performance.now();
	};

	window.resize = function () {
		scrollX = window.scrollX;
		scrollY = window.scrollY;
		screenWidth = window.screen.width;
		screenHeight = window.screen.height;
		lastScrollTime = performance.now();
	};
}

function Lifecycle() {
	this._listeners = [];
	this.scrollX = null;
	this.scrollY = null;
	this.screenHeight = screenHeight;
	this.screenWidth = screenWidth;
}

Lifecycle.prototype = {
	refresh: function refresh() {
		this.scrollX = isBrowser && window.scrollX;
		this.scrollY = isBrowser && window.scrollY;
	},
	addListener: function addListener(callback) {
		this._listeners.push(callback);
	},
	trigger: function trigger() {
		var this$1 = this;

		for (var i = 0; i < this._listeners.length; i++) {
			this$1._listeners[i]();
		}
	}
};

var lazyNodeMap = new Map();
var lazyCheckRunning = false;

function handleLazyAttached(node, lifecycle, dom) {
	lifecycle.addListener(function () {
		var rect = dom.getBoundingClientRect();

		if (lifecycle.scrollY === null) {
			lifecycle.refresh();
		}
		node.clipData = {
			top: rect.top + lifecycle.scrollY,
			left: rect.left + lifecycle.scrollX,
			bottom: rect.bottom + lifecycle.scrollY,
			right: rect.right + lifecycle.scrollX,
			pending: false
		};
	});
}

function patchLazyNode(value) {
	patchVNode(value.lastNode, value.nextNode, value.parentDom, value.lifecycle, value.context, value.instance, isSVG, true);
	value.clipData.pending = false;
}

function runPatchLazyNodes() {
	lazyCheckRunning = true;
	setTimeout(patchLazyNodes, 100);
}

function patchLazyNodes() {
	lazyNodeMap.forEach(patchLazyNode);
	lazyNodeMap.clear();
	lazyCheckRunning = false;
}

var noOp = 'Svenjs Error: Can only update a mounted or mounting component. This usually means you called setState() or forceUpdate() on an unmounted component. This is a no-op.';

// Copy of the util from dom/util, otherwise it makes massive bundles
function getActiveNode() {
	return document.activeElement;
}

// Copy of the util from dom/util, otherwise it makes massive bundles
function resetActiveNode(activeNode) {
	if (activeNode !== document.body && document.activeElement !== activeNode) {
		activeNode.focus(); // TODO: verify are we doing new focus event, if user has focus listener this might trigger it
	}
}

function queueStateChanges(component, newState, callback) {
	for (var stateKey in newState) {
		component._pendingState[stateKey] = newState[stateKey];
	}
	if (!component._pendingSetState) {
		component._pendingSetState = true;
		applyState(component, false, callback);
	} else {
		component.state = Object.assign({}, component.state, component._pendingState);
		component._pendingState = {};
	}
}

function applyState(component, force, callback) {
	if ((!component._deferSetState || force) && !component._blockRender) {
		component._pendingSetState = false;
		var pendingState = component._pendingState;
		var prevState = component.state;
		var nextState = Object.assign({}, prevState, pendingState);
		var props = component.props;

		component._pendingState = {};
		var nextNode = component._updateComponent(prevState, nextState, props, props, force);

		if (nextNode === NO_RENDER) {
			nextNode = component._lastNode;
		} else if (isNullOrUndefined(nextNode)) {
			nextNode = createVPlaceholder();
		}
		var lastNode = component._lastNode;
		var parentDom = lastNode.dom.parentNode;
		var activeNode = getActiveNode();
		var subLifecycle = new Lifecycle();

		component._patch(lastNode, nextNode, parentDom, subLifecycle, component.context, component, null);
		component._lastNode = nextNode;
		component._componentToDOMNodeMap.set(component, nextNode.dom);
		component._parentNode.dom = nextNode.dom;
		component.componentDidUpdate(props, prevState);
		subLifecycle.trigger();
		if (!isNullOrUndefined(callback)) {
			callback();
		}
		resetActiveNode(activeNode);
	}
}

var Component = function Component(props, context) {
	if ( context === void 0 ) context = {};

	/** @type {object} */
	this.props = props || {};

	/** @type {object} */
	this.state = {};

	/** @type {object} */
	this.refs = {};
	this._blockRender = false;
	this._blockSetState = false;
	this._deferSetState = false;
	this._pendingSetState = false;
	this._pendingState = {};
	this._parentNode = null;
	this._lastNode = null;
	this._unmounted = true;
	this.context = context;
	this._patch = null;
	this._parentComponent = null;
	this._componentToDOMNodeMap = null;
};

Component.prototype.render = function render () {
};

Component.prototype.forceUpdate = function forceUpdate (callback) {
	if (this._unmounted) {
		throw Error(noOp);
	}
	applyState(this, true, callback);
};

Component.prototype.setState = function setState (newState, callback) {
	if (this._unmounted) {
		throw Error(noOp);
	}
	if (this._blockSetState === false) {
		queueStateChanges(this, newState, callback);
	} else {
		throw Error('Svenjs Warning: Cannot update state via setState() in componentWillUpdate()');
	}
};

Component.prototype.componentDidMount = function componentDidMount () {
};

Component.prototype.componentWillMount = function componentWillMount () {
};

Component.prototype.componentWillUnmount = function componentWillUnmount () {
};

Component.prototype.componentDidUpdate = function componentDidUpdate () {
};

Component.prototype.shouldComponentUpdate = function shouldComponentUpdate () {
	return true;
};

Component.prototype.componentWillReceiveProps = function componentWillReceiveProps () {
};

Component.prototype.componentWillUpdate = function componentWillUpdate () {
};

Component.prototype.getChildContext = function getChildContext () {
};

Component.prototype._updateComponent = function _updateComponent (prevState, nextState, prevProps, nextProps, force) {
	if (this._unmounted === true) {
		this._unmounted = false;
		return false;
	}
	if (!isNullOrUndefined(nextProps) && isNullOrUndefined(nextProps.children)) {
		nextProps.children = prevProps.children;
	}
	if (prevProps !== nextProps || prevState !== nextState || force) {
		if (prevProps !== nextProps) {
			this._blockRender = true;
			this.componentWillReceiveProps(nextProps);
			this._blockRender = false;
			if (this._pendingSetState) {
				nextState = Object.assign({}, nextState, this._pendingState);
				this._pendingSetState = false;
				this._pendingState = {};
			}
		}
		var shouldUpdate = this.shouldComponentUpdate(nextProps, nextState);

		if (shouldUpdate !== false || force) {
			this._blockSetState = true;
			this.componentWillUpdate(nextProps, nextState);
			this._blockSetState = false;
			this.props = nextProps;
			this.state = nextState;
			return this.render();
		}
	}
	return NO_RENDER;
};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$1.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$1.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$2.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  value = Object(value);
  return (symToStringTag && symToStringTag in value)
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype;
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject$1(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

/* global window */
var root$2;

if (typeof self !== 'undefined') {
  root$2 = self;
} else if (typeof window !== 'undefined') {
  root$2 = window;
} else if (typeof global !== 'undefined') {
  root$2 = global;
} else if (typeof module !== 'undefined') {
  root$2 = module;
} else {
  root$2 = Function('return this')();
}

var result = symbolObservablePonyfill(root$2);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!isPlainObject$1(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/zenparsing/es-observable
   */
  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[result] = function () {
      return this;
    }, _ref;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[result] = observable, _ref2;
}

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning$1(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  var arguments$1 = arguments;

  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments$1[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

var _extends = Object.assign || function (target) {
var arguments$1 = arguments;
 for (var i = 1; i < arguments.length; i++) { var source = arguments$1[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if ("production" !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning$1('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
	/* eslint-disable no-console */
	if (typeof console !== 'undefined' && typeof console.error === 'function') {
		console.error(message);
	}

	/* eslint-enable no-console */
	try {
		// This error was thrown as a convenience so that if you enable
		// "break on all exceptions" in your console,
		// it would pause the execution at this line.
		throw new Error(message);

		/* eslint-disable no-empty */
	} catch (e) {}

	/* eslint-enable no-empty */
}

function shallowEqual(objA, objB) {
	if (objA === objB) {
		return true;
	}
	var keysA = Object.keys(objA);
	var keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}
	// Test for A's keys different from B.
	var hasOwn = Object.prototype.hasOwnProperty;
	for (var i = 0; i < keysA.length; i++) {
		if (!hasOwn.call(objB, keysA[i]) ||
			objA[keysA[i]] !== objB[keysA[i]]) {
			return false;
		}
	}
	return true;
}

function wrapActionCreators(actionCreators) {
	return function (dispatch) { return bindActionCreators(actionCreators, dispatch); };
}

var didWarnAboutReceivingStore = false;
var Provider = (function (Component$$1) {
	function Provider(props, context) {
		Component$$1.call(this, props, context);
		this.store = props.store;
	}

	if ( Component$$1 ) Provider.__proto__ = Component$$1;
	Provider.prototype = Object.create( Component$$1 && Component$$1.prototype );
	Provider.prototype.constructor = Provider;

	Provider.prototype.getChildContext = function getChildContext () {
		return { store: this.store };
	};

	Provider.prototype.render = function render () {
		if (isNullOrUndefined(this.props.children) || toArray(this.props.children).length !== 1) {
			throw Error('Svenjs Error: Only one child is allowed within the `Provider` component');
		}

		return this.props.children;
	};

	return Provider;
}(Component));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$1 = createCommonjsModule(function (module) {
'use strict';

var INFERNO_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    arguments: true,
    arity: true
};

var isGetOwnPropertySymbolsAvailable = typeof Object.getOwnPropertySymbols === 'function';

function hoistNonReactStatics(targetComponent, sourceComponent, customStatics) {
    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
        var keys = Object.getOwnPropertyNames(sourceComponent);

        /* istanbul ignore else */
        if (isGetOwnPropertySymbolsAvailable) {
            keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
        }

        for (var i = 0; i < keys.length; ++i) {
            if (!INFERNO_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
                try {
                    targetComponent[keys[i]] = sourceComponent[keys[i]];
                } catch (error) {

                }
            }
        }
    }

    return targetComponent;
}

module.exports = hoistNonReactStatics;
module.exports.default = module.exports;
});

/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var NODE_ENV = "production";

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

var invariant_1 = invariant;

var errorObject = { value: null };
var defaultMapStateToProps = function (state) { return ({}); }; // eslint-disable-line no-unused-vars
var defaultMapDispatchToProps = function (dispatch) { return ({ dispatch: dispatch }); };
var defaultMergeProps = function (stateProps, dispatchProps, parentProps) { return (Object.assign({}, parentProps,
	stateProps,
	dispatchProps)); };

function tryCatch(fn, ctx) {
	try {
		return fn.apply(ctx);
	} catch (e) {
		errorObject.value = e;
		return errorObject;
	}
}

function getDisplayName(WrappedComponent) {
	return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Helps track hot reloading.
var nextVersion = 0;

function connect(mapStateToProps, mapDispatchToProps, mergeProps, options) {
	if ( options === void 0 ) options = {};

	var shouldSubscribe = Boolean(mapStateToProps);
	var mapState = mapStateToProps || defaultMapStateToProps;
	var mapDispatch;

	if (isFunction(mapDispatchToProps)) {
		mapDispatch = mapDispatchToProps;
	} else if (!mapDispatchToProps) {
		mapDispatch = defaultMapDispatchToProps;
	} else {
		mapDispatch = wrapActionCreators(mapDispatchToProps);
	}
	var finalMergeProps = mergeProps || defaultMergeProps;
	var pure = options.pure; if ( pure === void 0 ) pure = true;
	var withRef = options.withRef; if ( withRef === void 0 ) withRef = false;
	var checkMergedEquals = pure && finalMergeProps !== defaultMergeProps;
	// Helps track hot reloading.
	var version = nextVersion++;

	return function wrapWithConnect(WrappedComponent) {
		var connectDisplayName = "Connect(" + (getDisplayName(WrappedComponent)) + ")";

		function checkStateShape(props, methodName) {
			if (!isPlainObject(props)) {
				warning(
					methodName + "() in " + connectDisplayName + " must return a plain object. " +
					"Instead received " + props + "."
				);
			}
		}
		function computeMergedProps(stateProps, dispatchProps, parentProps) {
			var mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps);
			return mergedProps;
		}

		var Connect = (function (Component$$1) {
			function Connect(props, context) {
				Component$$1.call(this, props, context);

				this.version = version;
				this.store = (props && props.store) || (context && context.store);

				invariant_1(this.store,
					'Could not find "store" in either the context or ' +
					"props of \"" + connectDisplayName + "\". " +
					'Either wrap the root component in a <Provider>, ' +
					"or explicitly pass \"store\" as a prop to \"" + connectDisplayName + "\"."
				);

				var storeState = this.store.getState();
				this.state = { storeState: storeState };
				this.clearCache();
			}

			if ( Component$$1 ) Connect.__proto__ = Component$$1;
			Connect.prototype = Object.create( Component$$1 && Component$$1.prototype );
			Connect.prototype.constructor = Connect;
			Connect.prototype.shouldComponentUpdate = function shouldComponentUpdate () {
				return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged;
			};

			Connect.prototype.computeStateProps = function computeStateProps (store, props) {
				if (!this.finalMapStateToProps) {
					return this.configureFinalMapState(store, props);
				}
				var state = store.getState();
				var stateProps = this.doStatePropsDependOnOwnProps ?
					this.finalMapStateToProps(state, props) :
					this.finalMapStateToProps(state);

				return stateProps;
			};
			Connect.prototype.configureFinalMapState = function configureFinalMapState (store, props) {
				var mappedState = mapState(store.getState(), props);
				var isFactory = isFunction(mappedState);

				this.finalMapStateToProps = isFactory ? mappedState : mapState;
				this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;
				if (isFactory) {
					return this.computeStateProps(store, props);
				}
				return mappedState;
			};
			Connect.prototype.computeDispatchProps = function computeDispatchProps (store, props) {
				if (!this.finalMapDispatchToProps) {
					return this.configureFinalMapDispatch(store, props);
				}
				var dispatch = store.dispatch;
				var dispatchProps = this.doDispatchPropsDependOnOwnProps ?
					this.finalMapDispatchToProps(dispatch, props) :
					this.finalMapDispatchToProps(dispatch);

				return dispatchProps;
			};
			Connect.prototype.configureFinalMapDispatch = function configureFinalMapDispatch (store, props) {
				var mappedDispatch = mapDispatch(store.dispatch, props);
				var isFactory = isFunction(mappedDispatch);

				this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch;
				this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

				if (isFactory) {
					return this.computeDispatchProps(store, props);
				}
				return mappedDispatch;
			};
			Connect.prototype.updateStatePropsIfNeeded = function updateStatePropsIfNeeded () {
				var nextStateProps = this.computeStateProps(this.store, this.props);

				if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
					return false;
				}
				this.stateProps = nextStateProps;
				return true;
			};
			Connect.prototype.updateDispatchPropsIfNeeded = function updateDispatchPropsIfNeeded () {
				var nextDispatchProps = this.computeDispatchProps(this.store, this.props);

				if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
					return false;
				}
				this.dispatchProps = nextDispatchProps;
				return true;
			};
			Connect.prototype.updateMergedPropsIfNeeded = function updateMergedPropsIfNeeded () {
				var nextMergedProps = computeMergedProps(this.stateProps, this.dispatchProps, this.props);

				if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps)) {
					return false;
				}
				this.mergedProps = nextMergedProps;
				return true;
			};
			Connect.prototype.isSubscribed = function isSubscribed () {
				return isFunction(this.unsubscribe);
			};
			Connect.prototype.trySubscribe = function trySubscribe () {
				if (shouldSubscribe && !this.unsubscribe) {
					this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
					this.handleChange();
				}
			};
			Connect.prototype.tryUnsubscribe = function tryUnsubscribe () {
				if (this.unsubscribe) {
					this.unsubscribe();
					this.unsubscribe = null;
				}
			};
			Connect.prototype.componentDidMount = function componentDidMount () {
				this.trySubscribe();
			};
			Connect.prototype.componentWillReceiveProps = function componentWillReceiveProps (nextProps) {
				if (!pure || !shallowEqual(nextProps, this.props)) {
					this.haveOwnPropsChanged = true;
				}
			};
			Connect.prototype.componentWillUnmount = function componentWillUnmount () {
				this.tryUnsubscribe();
				this.clearCache();
			};
			Connect.prototype.clearCache = function clearCache () {
				this.dispatchProps = null;
				this.stateProps = null;
				this.mergedProps = null;
				this.haveOwnPropsChanged = true;
				this.hasStoreStateChanged = true;
				this.haveStatePropsBeenPrecalculated = false;
				this.statePropsPrecalculationError = null;
				this.renderedElement = null;
				this.finalMapDispatchToProps = null;
				this.finalMapStateToProps = null;
			};
			Connect.prototype.handleChange = function handleChange () {
				if (!this.unsubscribe) {
					return;
				}
				var storeState = this.store.getState();
				var prevStoreState = this.state.storeState;

				if (pure && prevStoreState === storeState) {
					return;
				}
				if (pure && !this.doStatePropsDependOnOwnProps) {
					var haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this);
					if (!haveStatePropsChanged) {
						return;
					}
					if (haveStatePropsChanged === errorObject) {
						this.statePropsPrecalculationError = errorObject.value;
					}
					this.haveStatePropsBeenPrecalculated = true;
				}
				this.hasStoreStateChanged = true;
				this.setState({ storeState: storeState });
			};
			Connect.prototype.getWrappedInstance = function getWrappedInstance () {
				return this.refs.wrappedInstance;
			};
			Connect.prototype.render = function render () {
				var ref = this;
				var haveOwnPropsChanged = ref.haveOwnPropsChanged;
				var hasStoreStateChanged = ref.hasStoreStateChanged;
				var haveStatePropsBeenPrecalculated = ref.haveStatePropsBeenPrecalculated;
				var statePropsPrecalculationError = ref.statePropsPrecalculationError;
				var renderedElement = ref.renderedElement;

				this.haveOwnPropsChanged = false;
				this.hasStoreStateChanged = false;
				this.haveStatePropsBeenPrecalculated = false;
				this.statePropsPrecalculationError = null;

				if (statePropsPrecalculationError) {
					throw statePropsPrecalculationError;
				}
				var shouldUpdateStateProps = true;
				var shouldUpdateDispatchProps = true;

				if (pure && renderedElement) {
					shouldUpdateStateProps = hasStoreStateChanged || (
						haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
					);
					shouldUpdateDispatchProps =
						haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps;
				}
				var haveStatePropsChanged = false;
				var haveDispatchPropsChanged = false;

				if (haveStatePropsBeenPrecalculated) {
					haveStatePropsChanged = true;
				} else if (shouldUpdateStateProps) {
					haveStatePropsChanged = this.updateStatePropsIfNeeded();
				}
				if (shouldUpdateDispatchProps) {
					haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded();
				}
				var haveMergedPropsChanged = true;

				if (
					haveStatePropsChanged ||
					haveDispatchPropsChanged ||
					haveOwnPropsChanged
				) {
					haveMergedPropsChanged = this.updateMergedPropsIfNeeded();
				} else {
					haveMergedPropsChanged = false;
				}

				if (!haveMergedPropsChanged && renderedElement) {
					return renderedElement;
				}
				if (withRef) {
					this.renderedElement = createVNode().setTag(WrappedComponent)
						.setAttrs(Object.assign({}, this.mergedProps, { ref: 'wrappedInstance' }));
				} else {
					this.renderedElement = createVNode().setTag(WrappedComponent)
						.setAttrs(this.mergedProps);
				}
				return this.renderedElement;
			};

			return Connect;
		}(Component));
		Connect.displayName = connectDisplayName;
		Connect.WrappedComponent = WrappedComponent;

		return index$1(Connect, WrappedComponent);
	};
}

var index = {
	Provider: Provider,
	connect: connect,
};

return index;

})));
