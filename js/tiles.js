(function ($) {
  Drupal.behaviors.tiles = {
    attach: function(context,settings) {
      $('.contextual-links .block-arrange a', context).click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(e.target).blur();
        if ($(e.target).closest(Tiles.prototype.selector.block).hasClass('dragging')) {
          return;
        }
        block = new Tiles(e.target);
        block.setDraggable();
      });

      $('.contextual-links .block-set-width a', context).once('block-width', function() {
        $(this).click(function(e) {
          e.preventDefault();
          e.stopPropagation();
          $(e.target).blur();
          if ($(e.target).closest(Tiles.prototype.selector.block).hasClass('dragging')) {
            return;
          }
          block = new Tiles(e.target);
          block.setResizable();
        });
      });
    }
  };

  /**
   * @class Tiles
   *   Encapsulate js functionality for a tile.
   */

  Tiles = function(domNode) {
    $d = $(domNode);
    this.domNode = $d.attr('data-type') === 'block' ? $d : $d.closest(this.selector.block);
    this.region = $(this.domNode).closest(this.selector.region);
  };

  Tiles.prototype.selector = {
    block: '[data-type="block"]',
    tile: '.tile',
    region: '[data-type="region"]',
    row: '.row-fluid'
  };

  Tiles.prototype.setDraggable = function() {
    this.domNode.addClass('dragging');
    $('body').addClass('dragging');
    this.addMoveOverlay();
    return this;
  };

  Tiles.prototype.unsetDraggable = function() {
    this.domNode.removeClass('dragging');
    $('body').removeClass('dragging');
    this.removeMoveOverlay();
    return this;
  };

  /**
   * TODO Use jQuery template
   */
  Tiles.prototype.addMoveOverlay = function() {
    // Prevent irresponsible js plugins (twitter I'm looking at you) from using
    // document.write after a block is moved. Using document.write after a page
    // load overwrites the whole dom.
    document.write = function() {};

    var overlayContent = '<button class="move-left">Left</button>';
    overlayContent += '<button class="move-right">Right</button>';
    overlayContent += '<button class="save">Save</button>';
    overlayContent += '<span class="cancel">Cancel</span>';
    this.domNode.prepend('<div class="tile-overlay"><div class="inner"><div class="control-wrapper">' + overlayContent + '</div></div></div>');
    $('.move-left', this.domNode).click($.proxy(this,'moveLeft'));
    $('.move-right', this.domNode).click($.proxy(this,'moveRight'));
    $('.cancel', this.domNode).click($.proxy(this, 'moveCancel'));
    $('.save', this.domNode).click($.proxy(this, 'saveState'));
    return this;
  };

  /**
   * TODO Check if we need to unbind events of children elements before we
   * remove the parent to avoid memory leaks (some libs handle this)
   */
  Tiles.prototype.removeMoveOverlay = function() {
    $('.tile-overlay', this.domNode).remove();
    return this;
  };

  /**
   * Update left/right buttons
   */
  Tiles.prototype.refreshMoveButtons = function() {
    return this;
  };

  Tiles.prototype.moveLeft = function(e) {
    this.removeRows(this.region);
    var prev = this.domNode.prev(this.selector.tile);
    if (prev.length === 0) {
      this.addRows(this.region);
      alert('This is already the first block in this region.');
      return false;
    }
    this.moved = true;
    this.domNode.insertBefore(prev);
    this.addRows(this.region);
    return false;
  };

  Tiles.prototype.moveRight = function(e) {
    this.removeRows(this.region);
    var next = this.domNode.next(this.selector.tile);
    if (next.length === 0) {
      this.addRows(this.region);
      alert('This is already the first block in this region.');
      return false;
    }
    this.moved = true;
    this.domNode.insertAfter(next);
    this.addRows(this.region);
    return false;
  };

  Tiles.prototype.moveCancel = function(e) {
    // if there hasen't yet been any moving action, do a soft reset
    if (typeof this.moved === 'undefined' || !this.moved) {
      this.unsetDraggable();
      return this;
    }
    // if there's already been some moving action, do a hard reset
    else {
      window.location.reload();
    }
  };

  /**
   * Static methods
   */
  Tiles.prototype.saveState = function() {
    var region_node, region, ids;
    region = this.region.attr('data-name');
    ids = $.makeArray($(this.selector.block, this.region).map(function() {
      return $(this).attr('data-module') + '-' + $(this).attr('data-delta');
    }));
    $.ajax({
      type: 'POST',
      url: '/admin/tiles-save-weights',
      data: JSON.stringify({ blocks: ids, region: region, active_context: Drupal.settings.tiles.active_context }),
      success: $.proxy(this, 'saveHandleSuccess'),
      error: this.saveHandleError,
      contentType: 'application/json',
      dataType: 'json'
    });
  };

  Tiles.prototype.saveHandleSuccess = function() {
    this.unsetDraggable();
    this.unsetResizable();
  };

  Tiles.prototype.saveHandleError = function() {
    alert('Sorry, there was a problem saving the updated layout. Please try again after the page reloads.');
    window.location.reload();
  };

  Tiles.prototype.removeRows = function(region) {
    region.find(this.selector.block).unwrap();
    return region;
  };

  Tiles.prototype.addRows = function(region) {
    var blocks = region.find(this.selector.block).detach();
    var l = blocks.length;
    var curr_row = $('<div class="row-fluid"></div>');
    var width;
    var col_count = 0;
    var max_cols_per_row = 12;

    for (i = 0; i < l; i++) {
      width = Tiles.getWidth(blocks[i]);

      if ((col_count + width) <= max_cols_per_row) {
        col_count += width;
      }
      else {
        region.append(curr_row);
        curr_row = $('<div class="row-fluid"></div>');
        col_count = width;
      }

      curr_row.append(blocks[i]);
    }

    region.append(curr_row);
    return region;
  };

  Tiles.prototype.setWidth = function(width) {
    this.domNode[0].className = this.domNode[0].className.replace(/\bspan\d+/g, '');
    this.domNode.addClass('span' + width);
  };

  Tiles.prototype.saveWidth = function(e) {
    $.ajax({
      type: 'POST',
      url: '/admin/tiles-save-width',
      data: JSON.stringify({
        width: this.getWidth(),
        module: this.domNode.attr('data-module'),
        delta: this.domNode.attr('data-delta'),
        active_context: Drupal.settings.tiles.active_context
      }),
      success: $.proxy(this, 'saveHandleSuccess'),
      error: this.saveHandleError,
      contentType: 'application/json',
      dataType: 'json'
    });
    return false;
  };

  Tiles.prototype.setResizable = function() {
    this.domNode.addClass('resizing');
    $('body').addClass('resizing');
    this.addResizeOverlay();
    this.startWidth = this.getWidth();
    return this;
  };

  Tiles.prototype.unsetResizable = function() {
    this.domNode.removeClass('resizing');
    $('body').removeClass('resizing');
    this.removeResizeOverlay();
    return this;
  };

  /**
   * TODO Use jQuery template
   */
  Tiles.prototype.addResizeOverlay = function() {
    // Prevent irresponsible js plugins (twitter I'm looking at you) from using
    // document.write after a block is moved. Using document.write after a page
    // load overwrites the whole dom.
    document.write = function() {};

    var overlayContent = '<button class="width-minus">-</button>';
    overlayContent += '<button class="width-plus">+</button>';
    overlayContent += '<button class="save">Save</button>';
    overlayContent += '<span class="cancel">Cancel</span>';
    this.domNode.prepend('<div class="tile-overlay"><div class="inner"><div class="control-wrapper">' + overlayContent + '</div></div></div>');
    $('.width-plus', this.domNode).click($.proxy(this,'widthPlus'));
    $('.width-minus', this.domNode).click($.proxy(this,'widthMinus'));
    $('.cancel', this.domNode).click($.proxy(this, 'resizeCancel'));
    $('.save', this.domNode).click($.proxy(this, 'saveWidth'));
    return this;
  };

  Tiles.prototype.widthPlus = function(e) {
    var currentWidth = this.getWidth();
    if (currentWidth + 1 > 12) {
      alert('This tile is already full width.');
      return false;
    }
    this.setWidth(currentWidth + 1);
    return false;
  };

  Tiles.prototype.widthMinus = function(e) {
    var currentWidth = this.getWidth();
    if (currentWidth - 1 < 1) {
      alert('This tile is already at the minimum width.');
      return false;
    }
    this.setWidth(currentWidth - 1);
    return false;
  };

  /**
   * TODO Check if we need to unbind events of children elements before we
   * remove the parent to avoid memory leaks (some libs handle this)
   */
  Tiles.prototype.removeResizeOverlay = function() {
    $('.tile-overlay', this.domNode).remove();
    return this;
  };

  Tiles.prototype.resizeCancel = function(e) {
    this.setWidth(this.startWidth);
    this.startWidth = undefined;
    this.unsetResizable();
  };

  Tiles.prototype.getWidth = function() {
    return Tiles.getWidth(this.domNode);
  }

  Tiles.getWidth = function(blockDomNode) {
    var classString = $(blockDomNode).attr('class');
    var matches = classString.match(/span(\d+)/);
    var width = matches.pop();
    return parseInt(width, 10);
  };

}(jQuery));
