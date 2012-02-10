(function ($) {
  Drupal.behaviors.ombublocks = {
    attach: function(context,settings) {
      $('.contextual-links', context).click(function (e) {
        // @todo would be nicer to do this via class/url
        if(e.target.innerHTML !== 'Move' ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
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
    this.domNode = $d.hasClass('block') ? $d : $d.closest('.block');
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
  }

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
  }

  /**
   * Update left/right buttons
   */
  Ombublock.prototype.refreshMoveButtons = function() {
    return this;
  }

  Ombublock.prototype.moveLeft = function(e) {
    this.moved = true;
    var prev = this.domNode.prev();
    if(!prev.hasClass('block')) {
      alert('This is already the first block in this region.')
      return false;
    }
    this.domNode.insertBefore(prev);
    return false;
  }

  Ombublock.prototype.moveRight = function(e) {
    this.moved = true;
    var next = this.domNode.next();
    if(!next.hasClass('block')) {
      alert('This is already the last block in this region.')
      return false;
    }
    this.domNode.insertAfter(next);
    return false;
  }

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
  }

  /**
   * Static methods
   */
  Ombublock.prototype.saveState = function() {
    var region_node, region, ids;
    region_node = this.domNode.parent('.region');
    region = region_node.attr('class').match(/region-([^ ]+)/)[1];
    ids = $.makeArray($('.block', region_node).map(function() {
      return this.id.match(/block-(.+)/)[1];
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
  },

  Ombublock.prototype.saveHandleSuccess = function() {
    this.unsetDraggable();
  },

  Ombublock.prototype.saveHandleError = function() {
    alert('Sorry, there was a problem saving the updated layout. Please try again after the page reloads.');
    window.location.reload();
  }

}(jQuery));

