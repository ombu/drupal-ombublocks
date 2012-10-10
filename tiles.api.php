<?php

function hook_ombublock_info() {
  // naming convention is MODULE__DELTA
  $tiles['user__new'] = array(
    'regions' => array('foo', 'bar', 'baz'),
  );
  return $tiles;
}
