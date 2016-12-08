/**
 * Shiftbox.js
 *
 * @author: Damian Szczerbiński
 * @version: v1.0
 * @dependency: jQuery v1.11.3 or higher
 */
if (typeof jQuery === "undefined") {
  // plugin won't work without jQuery
  throw new Error("Shiftbox requires jQuery");
}

(function ($) {
  "use strict";

  /**
   * Shiftbox class definition.
   *
   * @constructor
   * @param el      DOM element
   * @param options Options to customize this instance of plugin.
   */
  var Shiftbox = function (el, options) {
    var plugin = this;
    plugin.$element = $(el);
    plugin.options = $.extend({}, Shiftbox.DEFAULTS, options);
    plugin.initGallery();
    plugin.$element.on('click', function (e) {
      if (plugin.$element.data('lock') !== true) {
        plugin.open(e);
      } else {
        return false;
      }
    });
    plugin.createModal();
    plugin.current = {};
    plugin.modalOpened = false;
    // true = shifting, false = static
    plugin.zoomState = false;
  };

  /**
   * Default options.
   *
   * @type {{loadingText: string, errorText: string, zoomSwitch: boolean, zoomSwitchSelector: string, modalSelector: string, modalAttachSelector: string, modalLayout: string, prevBtnSelector: string, nextBtnSelector: string, pictureSelector: string}}
   */
  Shiftbox.DEFAULTS = {
    loadingText: "Loading...",
    errorText: "Preview not available",
    zoomSwitch: true,
    zoomSwitchSelector: "#shiftbox-zoom-switch",
    modalSelector: "#shiftbox-modal",
    modalAttachSelector: "body",
    modalLayout: '<div class="modal fade" tabindex="-1" role="dialog" id="shiftbox-modal">' +
    '<div class="modal-dialog">' +
    '<div class="modal-content" style="overflow:hidden">' +
    '<div class="modal-body" style="padding:0">' +
    '<div id="shiftbox-picture"></div>' +
    '<div id="shiftbox-button-prev"><img src="/images/shiftbox/prev.png"></div>' +
    '<div id="shiftbox-button-next"><img src="/images/shiftbox/next.png"></div>' +
    '<div id="shiftbox-zoom-switch"><img src="/images/shiftbox/zoom.png"></div>' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">&times;</span>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>',
    prevBtnSelector: "#shiftbox-button-prev",
    nextBtnSelector: "#shiftbox-button-next",
    pictureSelector: "#shiftbox-picture"
  };

  /**
   * Create modal, attach events and place it in DOM.
   *
   * @returns void
   */
  Shiftbox.prototype.createModal = function () {
    var plugin = this,
        $modal = $(plugin.options.modalLayout);

    // if modal is not known to plugin
    if (typeof plugin.$modal === 'undefined') {
      // if modal is not placed in DOM
      if ($(plugin.options.modalSelector).length === 0) {
        // place it
        $(plugin.options.modalAttachSelector).prepend($modal);
      } else {
        // get it
        $modal = $(plugin.options.modalSelector).first();
      }

      // control buttons
      plugin.buttons = {
        prev: $modal.find(plugin.options.prevBtnSelector).first(),
        next: $modal.find(plugin.options.nextBtnSelector).first(),
        zoomSwitch: $modal.find(plugin.options.zoomSwitchSelector).first()
      };

      // control button events
      plugin.buttons.prev.off('click').on('click', function () {
        plugin.prev(plugin);
      });
      plugin.buttons.next.off('click').on('click', function () {
        plugin.next(plugin);
      });
      plugin.buttons.zoomSwitch.off('click').on('click', function () {
        plugin.zoomSwitch(plugin);
      });

      // modal state for internal plugin use
      $modal
        .on('shown.bs.modal', function () {
          plugin.modalOpened = true;
        })
        .on('hide.bs.modal', function () {
          plugin.modalOpened = false;
        });

      // fix modal after viewport resize
      $(window).on('resize', function () {
        if(plugin.modalOpened) {
          plugin.fitModal(plugin);
        }
      });

      // assign modal to plugin
      plugin.$modal = $modal;
    }
  };

  /**
   * Reset modal to it's initial state.
   *
   * @returns void
   */
  Shiftbox.prototype.resetModal = function () {
    var plugin = this;

    // if modal is known to plugin
    if (typeof plugin.$modal !== 'undefined') {
      // remove computed style
      plugin.$modal.find('.modal-dialog').removeAttr('style');
      plugin.$modal.find('.modal-content').removeAttr('style').css('overflow', 'hidden');
      plugin.$modal.find(plugin.options.pictureSelector).html('').removeAttr('style');
    }
  };

  /**
   * Shows modal.
   *
   * @param e Triggered event
   *
   * @returns void
   */
  Shiftbox.prototype.open = function (e) {
    var plugin = this,
        pluginGallery = $(document).data('shiftbox.gallery'),
        gallery = plugin.gallery;

    // check for 100% sure e is an Event and prevent any default action
    if (typeof e === 'object' && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // if there is a collection of images, find it's index in gallery and remember
    if (gallery) {
      for (var i = 0; i < pluginGallery[gallery].list.length; i++) {
        if (pluginGallery[gallery].list[i] === plugin.$element.attr('href')) {
          pluginGallery[gallery].index = i;
          break;
        }
      }
    }
    // refresh control buttons state
    plugin.checkButtons(plugin);

    // if plugin is in 2-way display mode, show switch button
    if (plugin.options.zoomSwitch) {
      plugin.$modal.find(plugin.options.zoomSwitchSelector).show();
    } else {
      plugin.$modal.find(plugin.options.zoomSwitchSelector).hide();
    }

    // finally, show modal and load image
    plugin.$modal.modal('show');
    plugin.loadImage(plugin.$element.attr('href'));
  };

  /**
   * Compute modal's size to fit perfectly into viewport.
   *
   * @param plugin Self injection
   *
   * @returns void
   */
  Shiftbox.prototype.fitModal = function (plugin) {
    var viewport = plugin.getViewport();

    // initial modal height
    plugin.current.modalHeight = Math.max(viewport.height - 60, 320);
    // initial modal width
    plugin.current.modalWidth = parseInt(viewport.width * 0.9) > plugin.current.baseImg.naturalWidth ?
      plugin.current.baseImg.naturalWidth :
      parseInt(viewport.width * 0.9);

    // switch CSS of image, depending on zoomState
    plugin.current.$baseImg.css({
      maxWidth: plugin.zoomState ? 'unset' : plugin.current.modalWidth,
      maxHeight: plugin.zoomState ? 'unset' : plugin.current.modalHeight,
      left: plugin.zoomState ? 0 : 'auto',
      top: 0,
      position: plugin.zoomState ? 'absolute' : 'static',
      textAlign: plugin.zoomState ? 'unset' : 'center'
    });
    plugin.current.$picture.html(plugin.current.$baseImg);
    // recalculate modal height
    plugin.current.modalHeight = Math.min(plugin.current.modalHeight, plugin.current.baseImg.naturalHeight);

    // final modal sizes
    plugin.$modal.find('.modal-dialog').css('width', plugin.current.modalWidth);
    plugin.$modal.find('.modal-content').css('height', plugin.current.modalHeight);

    // compute again size for non-zooming mode (modal always fits to scaled image)
    // because there is no possibility to get calculated sizes from browser
    if (!plugin.zoomState) {
      var modalAspect = plugin.current.modalWidth / plugin.current.modalHeight,
        imageAspect = plugin.current.baseImg.naturalWidth / plugin.current.baseImg.naturalHeight;
      // compute height
      if (modalAspect < imageAspect) {
        plugin.$modal.find('.modal-content').css('height', plugin.current.modalWidth / imageAspect);
      } else {
        // compute width
        plugin.$modal.find('.modal-dialog').css('width', plugin.current.modalHeight * imageAspect);
      }
    }

    // save computed data to image
    plugin.current.$picture
      .data('modal-width', plugin.$modal.find('.modal-dialog').width())
      .data('modal-height', plugin.$modal.find('.modal-content').height())
      .data('picture-width', plugin.current.baseImg.naturalWidth)
      .data('picture-height', plugin.current.baseImg.naturalHeight)
      // reassign events
      .off('mousemove')
      .on('mousemove', function (e) {
        plugin.shiftOnMouse(plugin, e);
      })
      .off('touchmove')
      .on('touchmove', function (e) {
        // on mobile touch position's fix is required
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
            elm = $(this).offset();

        e.pageX = touch.pageX - elm.left;
        e.pageY = touch.pageY - elm.top;
        e.preventDefault();

        // shift only when touch is on modal
        if(e.pageX < $(this).width() && e.pageX > 0) {
          if(e.pageY < $(this).height() && e.pageY > 0) {
            plugin.shiftOnMouse(plugin, e);
          }
        }
      })
      // make sure image is as same size as modal
      .css({
        width: plugin.current.$picture.data('modal-width'),
        height: plugin.current.$picture.data('modal-height')
      });
  };

  /**
   * Get actual viewport size, do not include scrollbars.
   *
   * @returns {{width: number, height: number}}
   */
  Shiftbox.prototype.getViewport = function () {
    return {
      width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
  };

  /**
   * Load image and display it on modal.
   *
   * @param {{string}} imgSrc Web-related path to image, e.g. "/path/to/img.jpg"
   *
   * @returns void
   */
  Shiftbox.prototype.loadImage = function (imgSrc) {
    var plugin = this;

    // create current image's data
    plugin.current.$picture = plugin.$modal.find(plugin.options.pictureSelector);
    plugin.current.baseImg = new Image();
    plugin.current.$baseImg = $(plugin.current.baseImg);
    plugin.zoomState = false;

    // after image is downloaded compute modal and image sizes to fit into viewport
    plugin.current.baseImg.onload = function () {
      plugin.fitModal(plugin);
    };
    // display message on error
    plugin.current.baseImg.onerror = function () {
      plugin.resetModal();
      plugin.current.$picture.html('<p style="margin:20px">' + plugin.options.errorText + '</p>');
    };
    // display loading message
    plugin.current.$picture.html('<p style="margin:20px">' + plugin.options.loadingText + '</p>');
    // load image
    plugin.current.baseImg.src = imgSrc;
  };

  /**
   * Initialize collection of images, grouped by gallery name.
   *
   * @returns void
   */
  Shiftbox.prototype.initGallery = function () {
    var plugin = this,
        gallery = plugin.$element.data('gallery'),
        pluginGallery = $(document).data('shiftbox.gallery') ? $(document).data('shiftbox.gallery') : {};
    // if there is gallery name
    if (gallery) {
      // initial, empty gallery
      pluginGallery[gallery] = {
        index: 0,
        list: []
      };
      plugin.gallery = gallery;
      // find all gallery's images and assign them
      $('[data-toggle="shiftbox"][data-gallery="' + gallery + '"]').each(function () {
        pluginGallery[gallery].list.push($(this).attr('href'));
      });
      // get current image's index in gallery and remeber it
      for (var i = 0; i < pluginGallery[gallery].list.length; i++) {
        if (pluginGallery[gallery].list[i] === plugin.$element.attr('href')) {
          pluginGallery[gallery].index = i;
          break;
        }
      }
    }
    // save gallery
    $(document).data('shiftbox.gallery', pluginGallery);
  };

  /**
   * Move backward in gallery's array.
   *
   * @param plugin Self injection
   *
   * @returns void
   */
  Shiftbox.prototype.prev = function (plugin) {
    // do only if there is gallery
    if (plugin.gallery) {
      var gallery = plugin.gallery,
          pluginGallery = $(document).data('shiftbox.gallery');

      // if you are able move backward, do so
      if (pluginGallery[gallery].index > 0) {
        pluginGallery[gallery].index--;
      } else {
        // set me at the beginning
        pluginGallery[gallery].index = 0;
      }
      // check control buttons state
      plugin.checkButtons(plugin);
      // load new image
      plugin.loadImage(pluginGallery[gallery].list[pluginGallery[gallery].index]);
    }
  };

  /**
   * Move forward in gallery's array.
   *
   * @param plugin Self injection
   *
   * @returns void
   */
  Shiftbox.prototype.next = function (plugin) {
    // do only if there is gallery
    if (plugin.gallery) {
      var gallery = plugin.gallery,
          pluginGallery = $(document).data('shiftbox.gallery');

      // if you are able move forward, do so
      if (pluginGallery[gallery].index < pluginGallery[gallery].list.length - 1) {
        pluginGallery[gallery].index++;
      } else {
        // set me at the end
        pluginGallery[gallery].index = pluginGallery[gallery].list.length;
      }
      // check control buttons state
      plugin.checkButtons(plugin);
      // load new image
      plugin.loadImage(pluginGallery[gallery].list[pluginGallery[gallery].index]);
    }
  };

  /**
   * Switch display mode state.
   *
   * @param plugin Self injection
   *
   * @returns void
   */
  Shiftbox.prototype.zoomSwitch = function (plugin) {
    plugin.zoomState = !plugin.zoomState;
    // must recalculate sizes
    plugin.fitModal(plugin);
  };

  /**
   * Show or hide specific control buttons. Depends on current gallery's state.
   *
   * @param plugin Self injection
   *
   * @returns void
   */
  Shiftbox.prototype.checkButtons = function (plugin) {
    var pluginGallery = $(document).data('shiftbox.gallery');

    // do only if there is gallery
    if (plugin.gallery) {
      var gallery = plugin.gallery;

      if (pluginGallery[gallery].index > 0) {
        plugin.buttons.prev.show();
      } else {
        plugin.buttons.prev.hide();
      }
      if (pluginGallery[gallery].index < pluginGallery[gallery].list.length - 1) {
        plugin.buttons.next.show();
      } else {
        plugin.buttons.next.hide();
      }
    } else {
      // hide control buttons
      plugin.buttons.next.hide();
      plugin.buttons.prev.hide();
    }
  };

  /**
   * Close modal.
   *
   * @param e Triggered event
   *
   * @returns void
   */
  Shiftbox.prototype.close = function (e) {
    var plugin = this;

    plugin.$modal.modal('hide');
    if (e) {
      e.preventDefault();
    }
  };

  /**
   * Shifts image correlating to mouse movements.
   *
   * @param plugin Self injection
   * @param e      Triggered event
   *
   * @returns void
   */
  Shiftbox.prototype.shiftOnMouse = function (plugin, e) {
    // available only when in shifting state
    if (!plugin.zoomState) {
      return;
    }

    // some magic
    var moveX = plugin.current.$picture.data('picture-width') > plugin.current.$picture.data('modal-width'),
        moveY = plugin.current.$picture.data('picture-height') > $(window).height() - 60,
        diffX = e.pageX - plugin.current.$picture.offset().left,
        diffY = e.pageY - plugin.current.$picture.offset().top;

    // more magic :)
    if (moveX) {
      plugin.current.$picture.find('img').css('left', -parseInt((diffX * plugin.current.$picture.data('picture-width')) / plugin.current.$picture.data('modal-width')) + diffX);
    }
    if (moveY) {
      plugin.current.$picture.find('img').css('top', -parseInt((diffY * plugin.current.$picture.data('picture-height')) / plugin.current.$picture.data('modal-height')) + diffY);
    }
  };

  /**
   * Uninitialize plugin.
   *
   * @returns void
   */
  Shiftbox.prototype.destroy = function () {
    var plugin = this,
        $plugin = $(this);

    if (plugin.$modal) {
      plugin.$modal.remove();
    }
    $plugin.data('shiftbox', undefined);
    plugin.prototype.open = function () {};
  };


  /**
   * Plugin's factory and access point to class Shiftbox.
   *
   * @param option
   * @returns {*}
   * @constructor
   */
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data('shiftbox'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('shiftbox', (data = new Shiftbox(this, options)));
      }
      if (typeof option === 'string' || option instanceof String) {
        data[option].call($this);
      }
    });
  }

  $.fn.shiftbox = Plugin;
  $.fn.shiftbox.Constructor = Shiftbox;
})(jQuery);