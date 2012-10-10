(function ($) {
  Drupal.behaviors.tilesAdmin = {
    attach: function (context) {
      var $layout = $(".form-item-tiles-layout select");
      var options = $layout.html();
      $("option[value=2]", $layout).remove();

      $("#edit-menu-enabled").click(function() {
        if ($(this).is(':checked')) {
          $layout.html("");
          $layout.append(options);
        }
        else {
          $("option[value=2]", $layout).remove();
        }
      });

      $('fieldset.tiles-node-settings-form', context).drupalSetSummary(function (context) {
        return Drupal.checkPlain($('.form-item-tiles-layout select :selected', context).text());
      });
    }
  };
})(jQuery);
