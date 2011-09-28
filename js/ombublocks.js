(function ($) {
  Drupal.behaviors.ombublocks = {
    attach: function(context,settings) {
      $('.contextual-links', context).click(function (e) {
        // @todo would be nicer to do this via class/url
        if(e.target.innerHTML !== 'Arrange block' ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        Drupal.behaviors.ombublocks._setDraggable(e.target);
      });
    },

    _getBlock: function(domNode) {
        return $(domNode).closest('.block');
    },

    /**
    * If node is not a block, searches up for a block node
    */
    _setDraggable: function(domNode) {
      var b = $(domNode).hasClass('block') ? $(domNode) : b =
        this._getBlock(domNode);
      this._getBlock(domNode);
      $('body').addClass('dragging');
      b.addClass('dragging-this');
    }
  }
}(jQuery));

