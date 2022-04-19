
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.47.0 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let body;
    	let div;
    	let ul0;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t4;
    	let br;
    	let span0;
    	let t6;
    	let ul1;
    	let li3;
    	let t8;
    	let li4;
    	let t10;
    	let li5;
    	let t12;
    	let li6;
    	let t14;
    	let li7;
    	let t16;
    	let li8;
    	let t18;
    	let li9;
    	let t20;
    	let ul2;
    	let li10;
    	let t22;
    	let li11;
    	let t24;
    	let li12;
    	let t26;
    	let li13;
    	let t28;
    	let li14;
    	let t30;
    	let li15;
    	let t32;
    	let li16;
    	let t34;
    	let li17;
    	let t36;
    	let li18;
    	let t38;
    	let li19;
    	let span1;
    	let t40;
    	let li20;
    	let t42;
    	let li21;
    	let t44;
    	let li22;
    	let t46;
    	let li23;
    	let t48;
    	let li24;
    	let t50;
    	let li25;
    	let t52;
    	let li26;
    	let t54;
    	let li27;
    	let t56;
    	let li28;
    	let t58;
    	let li29;
    	let t60;
    	let li30;
    	let t62;
    	let li31;
    	let t64;
    	let li32;
    	let t66;
    	let li33;
    	let t68;
    	let li34;
    	let t70;
    	let li35;
    	let t72;
    	let li36;
    	let t74;
    	let li37;
    	let t76;
    	let li38;
    	let t78;
    	let li39;
    	let t80;
    	let li40;

    	const block = {
    		c: function create() {
    			main = element("main");
    			body = element("body");
    			div = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "❮";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "❯";
    			t3 = space();
    			li2 = element("li");
    			t4 = text("August");
    			br = element("br");
    			span0 = element("span");
    			span0.textContent = "2021";
    			t6 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			li3.textContent = "Mo";
    			t8 = space();
    			li4 = element("li");
    			li4.textContent = "Tu";
    			t10 = space();
    			li5 = element("li");
    			li5.textContent = "We";
    			t12 = space();
    			li6 = element("li");
    			li6.textContent = "Th";
    			t14 = space();
    			li7 = element("li");
    			li7.textContent = "Fr";
    			t16 = space();
    			li8 = element("li");
    			li8.textContent = "Sa";
    			t18 = space();
    			li9 = element("li");
    			li9.textContent = "Su";
    			t20 = space();
    			ul2 = element("ul");
    			li10 = element("li");
    			li10.textContent = "1";
    			t22 = space();
    			li11 = element("li");
    			li11.textContent = "2";
    			t24 = space();
    			li12 = element("li");
    			li12.textContent = "3";
    			t26 = space();
    			li13 = element("li");
    			li13.textContent = "4";
    			t28 = space();
    			li14 = element("li");
    			li14.textContent = "5";
    			t30 = space();
    			li15 = element("li");
    			li15.textContent = "6";
    			t32 = space();
    			li16 = element("li");
    			li16.textContent = "7";
    			t34 = space();
    			li17 = element("li");
    			li17.textContent = "8";
    			t36 = space();
    			li18 = element("li");
    			li18.textContent = "9";
    			t38 = space();
    			li19 = element("li");
    			span1 = element("span");
    			span1.textContent = "10";
    			t40 = space();
    			li20 = element("li");
    			li20.textContent = "11";
    			t42 = space();
    			li21 = element("li");
    			li21.textContent = "12";
    			t44 = space();
    			li22 = element("li");
    			li22.textContent = "13";
    			t46 = space();
    			li23 = element("li");
    			li23.textContent = "14";
    			t48 = space();
    			li24 = element("li");
    			li24.textContent = "15";
    			t50 = space();
    			li25 = element("li");
    			li25.textContent = "16";
    			t52 = space();
    			li26 = element("li");
    			li26.textContent = "17";
    			t54 = space();
    			li27 = element("li");
    			li27.textContent = "18";
    			t56 = space();
    			li28 = element("li");
    			li28.textContent = "19";
    			t58 = space();
    			li29 = element("li");
    			li29.textContent = "20";
    			t60 = space();
    			li30 = element("li");
    			li30.textContent = "21";
    			t62 = space();
    			li31 = element("li");
    			li31.textContent = "22";
    			t64 = space();
    			li32 = element("li");
    			li32.textContent = "23";
    			t66 = space();
    			li33 = element("li");
    			li33.textContent = "24";
    			t68 = space();
    			li34 = element("li");
    			li34.textContent = "25";
    			t70 = space();
    			li35 = element("li");
    			li35.textContent = "26";
    			t72 = space();
    			li36 = element("li");
    			li36.textContent = "27";
    			t74 = space();
    			li37 = element("li");
    			li37.textContent = "28";
    			t76 = space();
    			li38 = element("li");
    			li38.textContent = "29";
    			t78 = space();
    			li39 = element("li");
    			li39.textContent = "30";
    			t80 = space();
    			li40 = element("li");
    			li40.textContent = "31";
    			attr_dev(li0, "class", "prev svelte-1qd5p1t");
    			add_location(li0, file, 7, 8, 79);
    			attr_dev(li1, "class", "next svelte-1qd5p1t");
    			add_location(li1, file, 8, 8, 118);
    			add_location(br, file, 9, 18, 167);
    			set_style(span0, "font-size", "18px");
    			add_location(span0, file, 9, 24, 173);
    			attr_dev(li2, "class", "svelte-1qd5p1t");
    			add_location(li2, file, 9, 8, 157);
    			attr_dev(ul0, "class", "svelte-1qd5p1t");
    			add_location(ul0, file, 6, 6, 66);
    			attr_dev(div, "class", "month svelte-1qd5p1t");
    			add_location(div, file, 5, 4, 40);
    			attr_dev(li3, "class", "svelte-1qd5p1t");
    			add_location(li3, file, 14, 6, 275);
    			attr_dev(li4, "class", "svelte-1qd5p1t");
    			add_location(li4, file, 15, 6, 293);
    			attr_dev(li5, "class", "svelte-1qd5p1t");
    			add_location(li5, file, 16, 6, 311);
    			attr_dev(li6, "class", "svelte-1qd5p1t");
    			add_location(li6, file, 17, 6, 329);
    			attr_dev(li7, "class", "svelte-1qd5p1t");
    			add_location(li7, file, 18, 6, 347);
    			attr_dev(li8, "class", "svelte-1qd5p1t");
    			add_location(li8, file, 19, 6, 365);
    			attr_dev(li9, "class", "svelte-1qd5p1t");
    			add_location(li9, file, 20, 6, 383);
    			attr_dev(ul1, "class", "weekdays svelte-1qd5p1t");
    			add_location(ul1, file, 13, 4, 247);
    			attr_dev(li10, "class", "svelte-1qd5p1t");
    			add_location(li10, file, 24, 6, 434);
    			attr_dev(li11, "class", "svelte-1qd5p1t");
    			add_location(li11, file, 25, 6, 451);
    			attr_dev(li12, "class", "svelte-1qd5p1t");
    			add_location(li12, file, 26, 6, 468);
    			attr_dev(li13, "class", "svelte-1qd5p1t");
    			add_location(li13, file, 27, 6, 485);
    			attr_dev(li14, "class", "svelte-1qd5p1t");
    			add_location(li14, file, 28, 6, 502);
    			attr_dev(li15, "class", "svelte-1qd5p1t");
    			add_location(li15, file, 29, 6, 519);
    			attr_dev(li16, "class", "svelte-1qd5p1t");
    			add_location(li16, file, 30, 6, 536);
    			attr_dev(li17, "class", "svelte-1qd5p1t");
    			add_location(li17, file, 31, 6, 553);
    			attr_dev(li18, "class", "svelte-1qd5p1t");
    			add_location(li18, file, 32, 6, 570);
    			attr_dev(span1, "class", "active svelte-1qd5p1t");
    			add_location(span1, file, 33, 10, 591);
    			attr_dev(li19, "class", "svelte-1qd5p1t");
    			add_location(li19, file, 33, 6, 587);
    			attr_dev(li20, "class", "svelte-1qd5p1t");
    			add_location(li20, file, 34, 6, 633);
    			attr_dev(li21, "class", "svelte-1qd5p1t");
    			add_location(li21, file, 35, 6, 651);
    			attr_dev(li22, "class", "svelte-1qd5p1t");
    			add_location(li22, file, 36, 6, 669);
    			attr_dev(li23, "class", "svelte-1qd5p1t");
    			add_location(li23, file, 37, 6, 687);
    			attr_dev(li24, "class", "svelte-1qd5p1t");
    			add_location(li24, file, 38, 6, 705);
    			attr_dev(li25, "class", "svelte-1qd5p1t");
    			add_location(li25, file, 39, 6, 723);
    			attr_dev(li26, "class", "svelte-1qd5p1t");
    			add_location(li26, file, 40, 6, 741);
    			attr_dev(li27, "class", "svelte-1qd5p1t");
    			add_location(li27, file, 41, 6, 759);
    			attr_dev(li28, "class", "svelte-1qd5p1t");
    			add_location(li28, file, 42, 6, 777);
    			attr_dev(li29, "class", "svelte-1qd5p1t");
    			add_location(li29, file, 43, 6, 795);
    			attr_dev(li30, "class", "svelte-1qd5p1t");
    			add_location(li30, file, 44, 6, 813);
    			attr_dev(li31, "class", "svelte-1qd5p1t");
    			add_location(li31, file, 45, 6, 831);
    			attr_dev(li32, "class", "svelte-1qd5p1t");
    			add_location(li32, file, 46, 6, 849);
    			attr_dev(li33, "class", "svelte-1qd5p1t");
    			add_location(li33, file, 47, 6, 867);
    			attr_dev(li34, "class", "svelte-1qd5p1t");
    			add_location(li34, file, 48, 6, 885);
    			attr_dev(li35, "class", "svelte-1qd5p1t");
    			add_location(li35, file, 49, 6, 903);
    			attr_dev(li36, "class", "svelte-1qd5p1t");
    			add_location(li36, file, 50, 6, 921);
    			attr_dev(li37, "class", "svelte-1qd5p1t");
    			add_location(li37, file, 51, 6, 939);
    			attr_dev(li38, "class", "svelte-1qd5p1t");
    			add_location(li38, file, 52, 6, 957);
    			attr_dev(li39, "class", "svelte-1qd5p1t");
    			add_location(li39, file, 53, 6, 975);
    			attr_dev(li40, "class", "svelte-1qd5p1t");
    			add_location(li40, file, 54, 6, 993);
    			attr_dev(ul2, "class", "days svelte-1qd5p1t");
    			add_location(ul2, file, 23, 4, 410);
    			attr_dev(body, "class", "svelte-1qd5p1t");
    			add_location(body, file, 4, 2, 29);
    			add_location(main, file, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, body);
    			append_dev(body, div);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t1);
    			append_dev(ul0, li1);
    			append_dev(ul0, t3);
    			append_dev(ul0, li2);
    			append_dev(li2, t4);
    			append_dev(li2, br);
    			append_dev(li2, span0);
    			append_dev(body, t6);
    			append_dev(body, ul1);
    			append_dev(ul1, li3);
    			append_dev(ul1, t8);
    			append_dev(ul1, li4);
    			append_dev(ul1, t10);
    			append_dev(ul1, li5);
    			append_dev(ul1, t12);
    			append_dev(ul1, li6);
    			append_dev(ul1, t14);
    			append_dev(ul1, li7);
    			append_dev(ul1, t16);
    			append_dev(ul1, li8);
    			append_dev(ul1, t18);
    			append_dev(ul1, li9);
    			append_dev(body, t20);
    			append_dev(body, ul2);
    			append_dev(ul2, li10);
    			append_dev(ul2, t22);
    			append_dev(ul2, li11);
    			append_dev(ul2, t24);
    			append_dev(ul2, li12);
    			append_dev(ul2, t26);
    			append_dev(ul2, li13);
    			append_dev(ul2, t28);
    			append_dev(ul2, li14);
    			append_dev(ul2, t30);
    			append_dev(ul2, li15);
    			append_dev(ul2, t32);
    			append_dev(ul2, li16);
    			append_dev(ul2, t34);
    			append_dev(ul2, li17);
    			append_dev(ul2, t36);
    			append_dev(ul2, li18);
    			append_dev(ul2, t38);
    			append_dev(ul2, li19);
    			append_dev(li19, span1);
    			append_dev(ul2, t40);
    			append_dev(ul2, li20);
    			append_dev(ul2, t42);
    			append_dev(ul2, li21);
    			append_dev(ul2, t44);
    			append_dev(ul2, li22);
    			append_dev(ul2, t46);
    			append_dev(ul2, li23);
    			append_dev(ul2, t48);
    			append_dev(ul2, li24);
    			append_dev(ul2, t50);
    			append_dev(ul2, li25);
    			append_dev(ul2, t52);
    			append_dev(ul2, li26);
    			append_dev(ul2, t54);
    			append_dev(ul2, li27);
    			append_dev(ul2, t56);
    			append_dev(ul2, li28);
    			append_dev(ul2, t58);
    			append_dev(ul2, li29);
    			append_dev(ul2, t60);
    			append_dev(ul2, li30);
    			append_dev(ul2, t62);
    			append_dev(ul2, li31);
    			append_dev(ul2, t64);
    			append_dev(ul2, li32);
    			append_dev(ul2, t66);
    			append_dev(ul2, li33);
    			append_dev(ul2, t68);
    			append_dev(ul2, li34);
    			append_dev(ul2, t70);
    			append_dev(ul2, li35);
    			append_dev(ul2, t72);
    			append_dev(ul2, li36);
    			append_dev(ul2, t74);
    			append_dev(ul2, li37);
    			append_dev(ul2, t76);
    			append_dev(ul2, li38);
    			append_dev(ul2, t78);
    			append_dev(ul2, li39);
    			append_dev(ul2, t80);
    			append_dev(ul2, li40);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
