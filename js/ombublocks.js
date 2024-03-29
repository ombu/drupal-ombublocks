(function ($) {
  Drupal.behaviors.ombublocks = {
    attach: function(context,settings) {
      $('.contextual-links .block-arrange a', context).click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(e.target).blur();
        if ($(e.target).closest(Ombublock.prototype.selector.block).hasClass('dragging')) {
          return;
        }
        block = new Ombublock(e.target);
        block.setDraggable();
      });
    }
  }

  /**
   * @class Ombublock
   *   Encapsulate js functionality for an ombublock
   */

  Ombublock = function(domNode) {
    $d = $(domNode);
    this.domNode = $d.attr('data-type') === 'block' ? $d : $d.closest(this.selector.block);
    this.region = $(this.domNode).closest(this.selector.region);
  };

  Ombublock.prototype.selector = {
    block: '[data-type="block"]',
    ombublock: '.ombublock',
    region: '[data-type="region"]',
    row: '.row-fluid'
  };

  Ombublock.prototype.setDraggable = function() {
    this.domNode.addClass('dragging');
    $('body').addClass('dragging');
    this.addMoveOverlay();
    return this;
  };

  Ombublock.prototype.unsetDraggable = function() {
    this.domNode.removeClass('dragging');
    $('body').removeClass('dragging');
    this.removeMoveOverlay();
    return this;
  };

  /**
   * TODO Use jQuery template
   */
  Ombublock.prototype.addMoveOverlay = function() {
    // Prevent irresponsible js plugins (twitter I'm looking at you) from using
    // document.write after a block is moved. Using document.write after a page
    // load overwrites the whole dom.
    document.write = function() {};

    var overlayContent = '<button class="move-left">Left</button>';
    overlayContent += '<button class="move-right">Right</button>';
    overlayContent += '<button class="save">Save</button>';
    overlayContent += '<span class="cancel">Cancel</span>';
    this.domNode.prepend('<div class="drag-overlay"><div class="inner"><div class="control-wrapper">' + overlayContent + '</div></div></div>');
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
  Ombublock.prototype.removeMoveOverlay = function() {
    $('.drag-overlay', this.domNode).remove();
    return this;
  };

  /**
   * Update left/right buttons
   */
  Ombublock.prototype.refreshMoveButtons = function() {
    return this;
  }

  Ombublock.prototype.moveLeft = function(e) {
    this.removeRows(this.region);
    var prev = this.domNode.prev(this.selector.ombublock);
    if (prev.length === 0) {
      this.addRows(this.region);
      alert('This is already the first block in this region.')
      return false;
    }
    this.moved = true;
    this.domNode.insertBefore(prev);
    this.addRows(this.region);
    return false;
  };

  Ombublock.prototype.moveRight = function(e) {
    this.removeRows(this.region);
    var next = this.domNode.next(this.selector.ombublock);
    if (next.length === 0) {
      this.addRows(this.region);
      alert('This is already the first block in this region.')
      return false;
    }
    this.moved = true;
    this.domNode.insertAfter(next);
    this.addRows(this.region);
    return false;
  };

  Ombublock.prototype.moveCancel = function(e) {
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
  Ombublock.prototype.saveState = function() {
    var region_node, region, ids;
    region = this.region.attr('data-name');
    ids = $.makeArray($(this.selector.block, this.region).map(function() {
      return $(this).attr('data-module') + '-' + $(this).attr('data-delta');
    }));
    $.ajax({
      type: 'POST',
      url: '/admin/ombublocks-save-weights',
      data: JSON.stringify({ blocks: ids, region: region, active_context: Drupal.settings.ombublocks.active_context }),
      success: $.proxy(this, 'saveHandleSuccess'),
      error: this.saveHandleError,
      contentType: 'application/json',
      dataType: 'json'
    });
  };

  Ombublock.prototype.saveHandleSuccess = function() {
    this.unsetDraggable();
  };

  Ombublock.prototype.saveHandleError = function() {
    alert('Sorry, there was a problem saving the updated layout. Please try again after the page reloads.');
    window.location.reload();
  };

  Ombublock.prototype.removeRows = function(region) {
    region.find(this.selector.block).unwrap();
    return region;
  };

  Ombublock.prototype.addRows = function(region) {
    var blocks = region.find(this.selector.block).detach();
    var l = blocks.length;
    var curr_row = $('<div class="row-fluid"></div>');
    var width;
    var col_count = 0;
    var max_cols_per_row = 12;

    for (i = 0; i < l; i++) {
      width = Ombublock.getWidth(blocks[i]);

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

  Ombublock.getWidth = function(blockDomNode) {
    var classString = $(blockDomNode).attr('class');
    var matches = classString.match(/span(\d+)/);
    var width = matches.pop();
    return parseInt(width, 10);
  };

}(jQuery));

