(function ($) {
  Drupal.behaviors.ombublocksAdmin = {
    attach: function (context) {
      var $layout = $(".form-item-ombublocks-layout select");
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

      $('fieldset.ombublocks-node-settings-form', context).drupalSetSummary(function (context) {
        return Drupal.checkPlain($('.form-item-ombublocks-layout select :selected', context).text());
      });
    }
  };
})(jQuery);
