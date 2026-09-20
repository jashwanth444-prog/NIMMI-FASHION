/* ═══════════════════════════════════════════════════════════════
   NIMMI FASHIONS — Premium Interactions
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOM Ready ──────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initHeroVideo();
        initNavbar();
        initMobileNav();
        initHeroAnimations();
        initScrollReveal();
        initSmoothScroll();
        initProductGalleries();
        initProductDetails();
        initEditorialCarousel();
        initEditorialCards();
        initStoryParallax();
    }


    /* ─── 0. Hero Video — Ensure Playback ───────────────────── */
    function initHeroVideo() {
        const video = document.querySelector('.hero__video');
        if (!video) return;

        // Attempt to play (browsers may block autoplay)
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay blocked — the fallback gradient is already visible via CSS
                video.style.display = 'none';
            });
        }

        // When video can play, hide the fallback
        video.addEventListener('canplay', function onCanPlay() {
            const fallback = document.querySelector('.hero__video-fallback');
            if (fallback) {
                fallback.style.opacity = '0';
                setTimeout(() => { fallback.style.display = 'none'; }, 800);
            }
            video.removeEventListener('canplay', onCanPlay);
        });
    }


    /* ─── 1. Navbar — Transparent → Solid on Scroll ───────────── */
    function initNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let ticking = false;

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    if (window.scrollY > 80) {
                        navbar.classList.add('navbar--scrolled');
                    } else {
                        navbar.classList.remove('navbar--scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Run once on load

        // Active link highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.navbar__link');

        function highlightActiveLink() {
            const scrollPos = window.scrollY + window.innerHeight / 3;

            sections.forEach((section) => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach((link) => {
                        link.classList.remove('navbar__link--active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('navbar__link--active');
                        }
                    });
                }
            });
        }

        window.addEventListener('scroll', highlightActiveLink, { passive: true });
    }


    /* ─── 2. Mobile Navigation ────────────────────────────────── */
    function initMobileNav() {
        const toggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.navbar__link');

        if (!toggle || !navMenu) return;

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'navbar__backdrop';
        document.body.appendChild(backdrop);

        function openNav() {
            navMenu.classList.add('navbar__nav--open');
            toggle.classList.add('navbar__toggle--active');
            backdrop.classList.add('navbar__backdrop--visible');
            document.body.style.overflow = 'hidden';
        }

        function closeNav() {
            navMenu.classList.remove('navbar__nav--open');
            toggle.classList.remove('navbar__toggle--active');
            backdrop.classList.remove('navbar__backdrop--visible');
            document.body.style.overflow = '';
        }

        toggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.contains('navbar__nav--open');
            isOpen ? closeNav() : openNav();
        });

        backdrop.addEventListener('click', closeNav);

        navLinks.forEach((link) => {
            link.addEventListener('click', closeNav);
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeNav();
        });
    }


    /* ─── 3. Hero Fade-In Animations ──────────────────────────── */
    function initHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero .fade-in-up');

        heroElements.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            // Stagger: first element appears at 400ms, others follow
            setTimeout(() => {
                el.classList.add('fade-in-up--visible');
            }, 400 + delay);
        });
    }


    /* ─── 4. Scroll Reveal — Intersection Observer ─────────────── */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');

        if (!revealElements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);

                        setTimeout(() => {
                            el.classList.add('reveal--visible');
                        }, delay);

                        observer.unobserve(el);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -60px 0px',
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }


    /* ─── 5. Product Galleries — Crossfade, Hover, Swipe ──────── */
    var GALLERY_INTERVAL = 5200;   // ms each frame is held before the next crossfade
    var GALLERY_STAGGER = 900;     // ms offset per card so the grid never flips in unison
    var SWIPE_THRESHOLD = 40;      // px of horizontal travel that counts as a swipe

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /** Is any part of this element inside the viewport right now? */
    function isOnScreen(el) {
        var rect = el.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    /**
     * Gallery controller for a stack of absolutely-positioned images.
     * With a single frame it is inert: no timer, no indicators, no duplicated image.
     */
    function createGallery(container, options) {
        var opts = options || {};
        var frames = Array.prototype.slice.call(container.querySelectorAll('img'));
        if (!frames.length) return null;

        var interval = opts.interval || GALLERY_INTERVAL;
        var current = 0;
        var timeoutId = null;
        var visible = false;
        var hovered = false;

        frames.forEach(function (frame) {
            frame.classList.add('gallery__item');
        });
        container.classList.add('gallery--ready');
        frames[0].classList.add('gallery__item--active');

        function paint() {
            frames.forEach(function (frame, index) {
                frame.classList.toggle('gallery__item--active', index === current);
            });
            container.dispatchEvent(new CustomEvent('gallery:change', {
                detail: { index: current, total: frames.length },
            }));
        }

        function canPlay() {
            return !!opts.autoplay && frames.length > 1 && visible && !hovered && !document.hidden;
        }

        function cancel() {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }

        function schedule(delay) {
            cancel();
            if (!canPlay()) return;
            timeoutId = window.setTimeout(function () {
                show(current + 1);
                schedule(interval);
            }, delay);
        }

        function show(index) {
            var next = ((index % frames.length) + frames.length) % frames.length;
            if (next === current) return;
            current = next;
            paint();
        }

        return {
            frames: frames,
            index: function () { return current; },
            show: show,
            next: function () { show(current + 1); schedule(interval); },
            prev: function () { show(current - 1); schedule(interval); },
            setVisible: function (isVisible) {
                visible = isVisible;
                if (isVisible) {
                    schedule(opts.startDelay || interval);
                } else {
                    cancel();
                }
            },
            setHovered: function (isHovered) {
                hovered = isHovered;
                if (isHovered) {
                    cancel();
                } else {
                    schedule(interval);
                }
            },
            restart: function () { schedule(interval); },
            destroy: cancel,
        };
    }

    function initProductGalleries() {
        var galleries = document.querySelectorAll('.product-card [data-gallery]');
        if (!galleries.length) return;

        var reduceMotion = prefersReducedMotion();
        var controllers = [];

        Array.prototype.forEach.call(galleries, function (gallery, order) {
            var frames = Array.prototype.slice.call(gallery.querySelectorAll('img'));
            if (!frames.length) return;

            var card = gallery.closest('.product-card') || gallery.parentElement;
            var wrap = gallery.parentElement;

            var controller = createGallery(gallery, {
                autoplay: frames.length > 1 && !reduceMotion,
                startDelay: (order * GALLERY_STAGGER) % GALLERY_INTERVAL,
            });
            if (!controller) return;
            controllers.push({ controller: controller, gallery: gallery });

            // Start immediately if the card is already in view (observers can be late)
            controller.setVisible(isOnScreen(gallery));

            // Frame indicators — pointer devices only, mouse convenience (kept out of tab order)
            if (frames.length > 1 && wrap) {
                var bar = document.createElement('div');
                bar.className = 'product-card__frames';
                bar.setAttribute('aria-hidden', 'true');

                var dots = frames.map(function (frame, index) {
                    var dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'product-card__frame';
                    dot.tabIndex = -1;
                    dot.addEventListener('click', function (event) {
                        event.stopPropagation();
                        controller.show(index);
                        controller.restart();
                    });
                    bar.appendChild(dot);
                    return dot;
                });

                gallery.addEventListener('gallery:change', function (event) {
                    dots.forEach(function (dot, index) {
                        dot.classList.toggle('product-card__frame--active', index === event.detail.index);
                    });
                });
                dots[0].classList.add('product-card__frame--active');
                wrap.appendChild(bar);
            }

            // Touch swipe (mobile) — the card click is suppressed right after a swipe
            if (frames.length > 1 && wrap) {
                var startX = null;
                var startY = null;

                wrap.addEventListener('touchstart', function (event) {
                    startX = event.touches[0].clientX;
                    startY = event.touches[0].clientY;
                    controller.setHovered(true);
                }, { passive: true });

                wrap.addEventListener('touchend', function (event) {
                    if (startX === null) return;
                    var touch = event.changedTouches[0];
                    var deltaX = touch.clientX - startX;
                    var deltaY = touch.clientY - startY;
                    startX = null;
                    startY = null;

                    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                        if (deltaX < 0) {
                            controller.next();
                        } else {
                            controller.prev();
                        }
                        card.lastSwipeAt = Date.now();
                    }
                    controller.setHovered(false);
                }, { passive: true });

                wrap.addEventListener('touchcancel', function () {
                    startX = null;
                    startY = null;
                    controller.setHovered(false);
                }, { passive: true });
            }

            // Desktop: hold the current frame while hovering
            var hoverTarget = wrap || gallery;
            hoverTarget.addEventListener('mouseenter', function () { controller.setHovered(true); });
            hoverTarget.addEventListener('mouseleave', function () { controller.setHovered(false); });
        });

        // Only crossfade while a card is actually on screen
        var visibility = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var match = controllers.filter(function (item) {
                    return item.gallery === entry.target;
                })[0];
                if (match) match.controller.setVisible(entry.isIntersecting);
            });
        }, { threshold: 0.2 });

        controllers.forEach(function (item) { visibility.observe(item.gallery); });

        document.addEventListener('visibilitychange', function () {
            controllers.forEach(function (item) {
                item.controller.setVisible(!document.hidden && isOnScreen(item.gallery));
            });
        });
    }


    /* ─── 6. Product Details Modal ─────────────────────────────── */
    function initProductDetails() {
        var modal = document.getElementById('productModal');
        if (!modal) return;

        var galleryHost = document.getElementById('productModalGallery');
        var thumbsHost = document.getElementById('productModalThumbs');
        var stageEl = modal.querySelector('.product-modal__stage');
        var titleEl = document.getElementById('productModalTitle');
        var categoryEl = document.getElementById('productModalCategory');
        var priceEl = document.getElementById('productModalPrice');
        var bodyEl = document.getElementById('productModalBody');
        var collectionEl = document.getElementById('productModalCollection');
        var fabricEl = document.getElementById('productModalFabric');
        var colourEl = document.getElementById('productModalColour');
        var sizesEl = document.getElementById('productModalSizes');
        var careEl = document.getElementById('productModalCare');
        var prevBtn = modal.querySelector('[data-modal-prev]');
        var nextBtn = modal.querySelector('[data-modal-next]');
        var closeBtn = modal.querySelector('.product-modal__close');
        var isOpen = false;
        var controller = null;
        var lastFocused = null;
        var thumbs = [];

        function close() {
            if (!isOpen) return;
            isOpen = false;
            modal.classList.remove('product-modal--open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('product-modal-open');
            document.removeEventListener('keydown', onKeydown);
            if (controller) controller.destroy();
            controller = null;
            if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
            lastFocused = null;
        }

        function onKeydown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                return;
            }
            if (controller && event.key === 'ArrowRight') { controller.next(); return; }
            if (controller && event.key === 'ArrowLeft') { controller.prev(); return; }
            if (event.key !== 'Tab') return;

            var focusables = Array.prototype.filter.call(
                modal.querySelectorAll('button, a[href]'),
                function (el) { return !el.hidden && el.offsetParent !== null; }
            );
            if (!focusables.length) return;

            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        var FEATURED_ITEM = '[data-featured-item]';
        var EDITORIAL_ITEM = '[data-editorial-item]';

        // Where each family of trigger keeps its product information
        function detailSourceFor(source) {
            var matches = source.matches ? source.matches.bind(source) : null;

            if (matches && matches(EDITORIAL_ITEM)) {
                return {
                    images: '[data-editorial-image]',
                    name: '.editorial-card__name',
                    category: '.editorial-card__category',
                    price: '',
                    collection: source.getAttribute('data-editorial-collection') || '',
                };
            }

            if (matches && matches(FEATURED_ITEM)) {
                return {
                    images: '[data-featured-image]',
                    name: '.featured__card-title',
                    category: '.featured__card-category',
                    price: '',
                    collection: source.getAttribute('data-featured-collection') || '',
                };
            }

            var row = source.closest('.products__row');
            return {
                images: '.gallery img',
                name: '.product-card__name',
                category: '.product-card__category',
                price: textFrom(source, '.product-card__price'),
                collection: row ? textFrom(row, '.products__title') : '',
            };
        }

        function textFrom(root, selector) {
            var el = root.querySelector(selector);
            return el ? el.textContent.trim() : '';
        }

        function imagesFrom(root, selector) {
            return Array.prototype.map.call(root.querySelectorAll(selector), function (img) {
                return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
            });
        }

        // No verified product data exists yet, so unknown values stay honest placeholders.
        // A product can override any of them later with optional data attributes.
        var PLACEHOLDERS = {
            price: 'Price on request',
            description: 'Product details coming soon.',
            fabric: 'Fabric details coming soon',
            colour: 'Colour details coming soon',
            sizes: 'Size details coming soon',
            care: 'Care instructions coming soon',
        };

        function detailValue(source, key, fallback) {
            var value = (source.getAttribute('data-' + key) || '').trim();
            return value || fallback || '';
        }

        // The detail panel is shared by catalog cards, The New Edit pieces and
        // the campaign dresses — one panel, never a second system
        function open(source) {
            var config = detailSourceFor(source);
            var images = imagesFrom(source, config.images);
            if (!images.length) return;

            var name = textFrom(source, config.name);
            var category = textFrom(source, config.category);
            var price = config.price;
            var collection = config.collection;
            var trigger = source.querySelector('[data-details]');

            titleEl.textContent = name;
            categoryEl.textContent = category;
            priceEl.textContent = detailValue(source, 'price', price || PLACEHOLDERS.price);
            bodyEl.textContent = detailValue(source, 'description', PLACEHOLDERS.description);
            collectionEl.textContent = collection || 'NIMMI FASHIONS';
            fabricEl.textContent = detailValue(source, 'fabric', PLACEHOLDERS.fabric);
            colourEl.textContent = detailValue(source, 'colour', PLACEHOLDERS.colour);
            sizesEl.textContent = detailValue(source, 'sizes', PLACEHOLDERS.sizes);
            careEl.textContent = detailValue(source, 'care', PLACEHOLDERS.care);

            // Return focus to the control that opened the panel
            var active = document.activeElement;
            if (trigger) {
                lastFocused = trigger;
            } else if (active && active !== document.body && active !== document.documentElement) {
                lastFocused = active;
            } else {
                lastFocused = null;
            }

            galleryHost.innerHTML = '';
            thumbsHost.innerHTML = '';

            thumbs = images.map(function (image, index) {
                var frame = document.createElement('img');
                frame.src = image.src;
                frame.alt = image.alt;
                galleryHost.appendChild(frame);

                var thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = 'product-modal__thumb';
                thumb.setAttribute('aria-label', 'Show image ' + (index + 1) + ' of ' + images.length);
                var thumbImage = document.createElement('img');
                thumbImage.src = image.src;
                thumbImage.alt = '';
                thumb.appendChild(thumbImage);
                thumbsHost.appendChild(thumb);
                return thumb;
            });

            var multiple = images.length > 1;
            prevBtn.hidden = !multiple;
            nextBtn.hidden = !multiple;
            thumbsHost.hidden = !multiple;   // a single thumbnail adds nothing

            controller = createGallery(galleryHost, { autoplay: false, interval: GALLERY_INTERVAL });
            if (controller) controller.setVisible(true);

            thumbs.forEach(function (thumb, index) {
                thumb.addEventListener('click', function () {
                    if (controller) controller.show(index);
                });
            });

            if (multiple) {
                prevBtn.onclick = function () { if (controller) controller.prev(); };
                nextBtn.onclick = function () { if (controller) controller.next(); };
                thumbs[0].classList.add('product-modal__thumb--active');
            }

            isOpen = true;
            modal.classList.add('product-modal--open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('product-modal-open');
            document.addEventListener('keydown', onKeydown);

            if (closeBtn) closeBtn.focus({ preventScroll: true });
        }

        galleryHost.addEventListener('gallery:change', function (event) {
            thumbs.forEach(function (thumb, index) {
                thumb.classList.toggle('product-modal__thumb--active', index === event.detail.index);
            });
        });

        // Touch swipe over the large image (mobile)
        (function bindStageSwipe() {
            if (!stageEl) return;
            var startX = null;
            var startY = null;

            stageEl.addEventListener('touchstart', function (event) {
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
            }, { passive: true });

            stageEl.addEventListener('touchend', function (event) {
                if (startX === null) return;
                var touch = event.changedTouches[0];
                var deltaX = touch.clientX - startX;
                var deltaY = touch.clientY - startY;
                startX = null;
                startY = null;

                if (!controller || controller.frames.length < 2) return;
                if (Math.abs(deltaX) <= SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;

                if (deltaX < 0) {
                    controller.next();
                } else {
                    controller.prev();
                }
            }, { passive: true });

            stageEl.addEventListener('touchcancel', function () {
                startX = null;
                startY = null;
            }, { passive: true });
        })();

        Array.prototype.forEach.call(document.querySelectorAll('.product-card'), function (card) {
            var detailsBtn = card.querySelector('[data-details]');

            if (detailsBtn) {
                detailsBtn.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    open(card);
                });
            }

            card.addEventListener('click', function (event) {
                if (event.target.closest('[data-details], .product-card__frame')) return;
                if (card.lastSwipeAt && Date.now() - card.lastSwipeAt < 400) return;
                open(card);
            });
        });

        // The New Edit pieces and the campaign dresses open the same detail panel
        Array.prototype.forEach.call(document.querySelectorAll(FEATURED_ITEM + ', ' + EDITORIAL_ITEM), function (item) {
            var detailsBtn = item.querySelector('[data-details]');

            if (detailsBtn) {
                detailsBtn.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    open(item);
                });
            }

            item.addEventListener('click', function (event) {
                if (event.target.closest('[data-details]')) return;
                // A swipe through the gallery is not a request to open the panel
                if (item.lastSwipeAt && Date.now() - item.lastSwipeAt < 400) return;
                open(item);
            });
        });

        Array.prototype.forEach.call(modal.querySelectorAll('[data-modal-close]'), function (el) {
            el.addEventListener('click', close);
        });
    }


    /* ─── 6b. Editorial Campaign — Films & Dresses ─────────────── */

    // The slot each film takes, by its distance from the active one: the active
    // film holds the centre, the one after it sits right, the one before it left.
    var FILM_SLOTS = ['center', 'right', 'left'];
    var EDITORIAL_INTERVAL = 6200;   // ms each campaign-dress frame is held

    /**
     * The campaign carousel. Nothing here runs on a timer — a film only moves
     * to the centre once the film in the centre reaches its own end, so the
     * three films always play through in full, in order, forever.
     */
    function initEditorialCarousel() {
        var carousel = document.querySelector('[data-carousel]');
        if (!carousel) return;

        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-slide]'));
        var videos = slides.map(function (slide) { return slide.querySelector('video'); });
        if (slides.length < 2 || videos.indexOf(null) !== -1) return;

        var total = slides.length;
        var counter = carousel.querySelector('[data-carousel-current]');
        var prevBtn = carousel.querySelector('[data-carousel-prev]');
        var nextBtn = carousel.querySelector('[data-carousel-next]');
        var stage = carousel.querySelector('[data-carousel-stage]');
        var active = 0;

        function pad(number) {
            return (number < 10 ? '0' : '') + number;
        }

        function layout() {
            slides.forEach(function (slide, index) {
                var slot = FILM_SLOTS[(index - active + total) % total];
                slide.setAttribute('data-pos', slot);
                slide.setAttribute('aria-hidden', slot === 'center' ? 'false' : 'true');
            });
            if (counter) counter.textContent = pad(active + 1);
        }

        function pauseAll() {
            videos.forEach(function (video) {
                if (!video.paused) video.pause();
            });
        }

        // Whether the campaign is on screen is read from the geometry rather than
        // from a cached flag: observers can fire late (or not at all in a
        // background tab), and a stale flag would stall the handoff.
        function playActive() {
            var video = videos[active];
            if (!video || document.hidden || !isOnScreen(carousel)) return;

            var attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {
                    // Autoplay refused — the poster frame simply stays in place
                });
            }
        }

        function setActive(index) {
            var next = ((index % total) + total) % total;
            if (next === active) return;

            var previous = videos[active];
            if (previous) {
                previous.pause();
                // A film plays its campaign from the start each time it returns
                try { previous.currentTime = 0; } catch (err) { /* not seekable yet */ }
            }

            active = next;
            layout();
            playActive();
        }

        function advance(step) {
            setActive(active + step);
        }

        videos.forEach(function (video, index) {
            video.addEventListener('ended', function () {
                if (index === active) advance(1);
            });

            // Only the film in the centre is ever allowed to play
            video.addEventListener('playing', function () {
                if (index !== active) video.pause();
            });
        });

        if (prevBtn) prevBtn.addEventListener('click', function () { advance(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { advance(1); });

        // Pointing at a side film brings it to the centre
        slides.forEach(function (slide, index) {
            slide.addEventListener('click', function () {
                if (index !== active) setActive(index);
            });
        });

        if (stage) {
            stage.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    advance(1);
                } else if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    advance(-1);
                }
            });

            // Touch: swipe left for the next film, right for the previous one
            var startX = null;
            var startY = null;

            stage.addEventListener('touchstart', function (event) {
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
            }, { passive: true });

            stage.addEventListener('touchend', function (event) {
                if (startX === null) return;
                var touch = event.changedTouches[0];
                var deltaX = touch.clientX - startX;
                var deltaY = touch.clientY - startY;
                startX = null;
                startY = null;

                if (Math.abs(deltaX) <= SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
                advance(deltaX < 0 ? 1 : -1);
            }, { passive: true });

            stage.addEventListener('touchcancel', function () {
                startX = null;
                startY = null;
            }, { passive: true });
        }

        layout();

        // Play only while the campaign is on screen; on leaving, everything pauses
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        playActive();
                    } else {
                        pauseAll();
                    }
                });
            }, { threshold: 0.2 }).observe(carousel);
        } else {
            playActive();
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                pauseAll();
            } else {
                playActive();
            }
        });
    }


    /* ─── 6c. Campaign Dresses — Three-View Galleries ──────────── */
    function initEditorialCards() {
        var galleries = document.querySelectorAll('.editorial-card [data-gallery]');
        if (!galleries.length) return;

        var reduceMotion = prefersReducedMotion();
        var controllers = [];

        Array.prototype.forEach.call(galleries, function (gallery, order) {
            var frames = Array.prototype.slice.call(gallery.querySelectorAll('img'));
            if (!frames.length) return;

            var card = gallery.closest('.editorial-card') || gallery.parentElement;
            var media = card.querySelector('.editorial-card__media') || gallery.parentElement;

            var controller = createGallery(gallery, {
                autoplay: frames.length > 1 && !reduceMotion,
                interval: EDITORIAL_INTERVAL,
                startDelay: (order * GALLERY_STAGGER) % EDITORIAL_INTERVAL,
            });
            if (!controller) return;
            controllers.push({ controller: controller, gallery: gallery });

            // Start immediately if the card is already in view (observers can be late)
            controller.setVisible(isOnScreen(gallery));

            var prevBtn = card.querySelector('[data-editorial-prev]');
            var nextBtn = card.querySelector('[data-editorial-next]');

            if (frames.length < 2) {
                // Nothing to move through — the controls would be dead weight
                if (prevBtn) prevBtn.hidden = true;
                if (nextBtn) nextBtn.hidden = true;
            } else {
                // Frame bars — pointer devices only, mouse convenience
                var bar = document.createElement('div');
                bar.className = 'editorial-card__frames';
                bar.setAttribute('aria-hidden', 'true');

                var dots = frames.map(function (frame, index) {
                    var dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'editorial-card__frame';
                    dot.tabIndex = -1;
                    dot.addEventListener('click', function (event) {
                        event.stopPropagation();
                        controller.show(index);
                        controller.restart();
                    });
                    bar.appendChild(dot);
                    return dot;
                });

                gallery.addEventListener('gallery:change', function (event) {
                    dots.forEach(function (dot, index) {
                        dot.classList.toggle('editorial-card__frame--active', index === event.detail.index);
                    });
                });
                dots[0].classList.add('editorial-card__frame--active');
                media.appendChild(bar);

                if (prevBtn) prevBtn.addEventListener('click', function (event) {
                    event.stopPropagation();
                    controller.prev();
                });
                if (nextBtn) nextBtn.addEventListener('click', function (event) {
                    event.stopPropagation();
                    controller.next();
                });
            }

            // Touch swipe — a swipe never also opens the detail panel
            var startX = null;
            var startY = null;

            media.addEventListener('touchstart', function (event) {
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
                controller.setHovered(true);
            }, { passive: true });

            media.addEventListener('touchend', function (event) {
                if (startX === null) return;
                var touch = event.changedTouches[0];
                var deltaX = touch.clientX - startX;
                var deltaY = touch.clientY - startY;
                startX = null;
                startY = null;

                if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX < 0) {
                        controller.next();
                    } else {
                        controller.prev();
                    }
                    card.lastSwipeAt = Date.now();
                }
                controller.setHovered(false);
            }, { passive: true });

            media.addEventListener('touchcancel', function () {
                startX = null;
                startY = null;
                controller.setHovered(false);
            }, { passive: true });

            // Desktop: hold the current frame while hovering
            media.addEventListener('mouseenter', function () { controller.setHovered(true); });
            media.addEventListener('mouseleave', function () { controller.setHovered(false); });
        });

        // Only crossfade while a dress is actually on screen
        var visibility = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var match = controllers.filter(function (item) {
                    return item.gallery === entry.target;
                })[0];
                if (match) match.controller.setVisible(entry.isIntersecting);
            });
        }, { threshold: 0.2 });

        controllers.forEach(function (item) { visibility.observe(item.gallery); });

        document.addEventListener('visibilitychange', function () {
            controllers.forEach(function (item) {
                item.controller.setVisible(!document.hidden && isOnScreen(item.gallery));
            });
        });
    }


    /* ─── 7. Brand Story Image — Restrained Scroll Shift ──────── */
    var STORY_SHIFT = 14;                          // px of vertical travel — deliberately small
    var STORY_DESKTOP = '(min-width: 1025px)';

    function initStoryParallax() {
        var image = document.querySelector('.story__image');
        if (!image || prefersReducedMotion()) return;

        var active = false;
        var ticking = false;

        function isDesktop() {
            return window.matchMedia(STORY_DESKTOP).matches;
        }

        function apply() {
            ticking = false;
            if (!active) return;

            var wrap = image.parentElement;
            var rect = wrap.getBoundingClientRect();
            var viewport = window.innerHeight;
            // 0 when the photograph is centred in the viewport, ±1 towards the edges
            var progress = (viewport / 2 - (rect.top + rect.height / 2)) /
                (viewport / 2 + rect.height / 2);
            progress = Math.max(-1, Math.min(1, progress));

            image.style.translate = '0 ' + (progress * STORY_SHIFT).toFixed(2) + 'px';
        }

        function update() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(apply);
        }

        function enable() {
            active = true;
            image.classList.add('story__image--parallax');
            update();
        }

        function disable() {
            active = false;
            image.classList.remove('story__image--parallax');
            image.style.translate = '';
        }

        if (isDesktop()) enable();

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', function () {
            if (isDesktop()) {
                if (!active) enable();
            } else if (active) {
                disable();
            }
        });
    }


    /* ─── 8. Smooth Scroll for Anchor Links ─────────────────────── */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (!target) return;

                const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                });
            });
        });
    }

})();
