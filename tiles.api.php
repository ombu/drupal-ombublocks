<?php

/**
 * @file
 * Hooks provided by the Tiles module.
 */

/**
 * Tell Tiles which blocks it should manage.
 */
function hook_tiles_info(&$tiles) {
  // Naming convention is MODULE__DELTA.
  $tiles['user__new'] = array(
    'regions' => array('foo', 'bar', 'baz'),
  );
  return $tiles;
}

/**
 * Tell Tiles which regions it can manage blocks in.
 */
function hook_tiles_regions(&$regions) {
  return array('content');
}
