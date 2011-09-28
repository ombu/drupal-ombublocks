<?php

function hook_ombublock_info() {
  // naming convention is MODULE__DELTA
  $ombublocks['user__new'] = array(
    'regions' => array('foo', 'bar', 'baz'),
  );
  return $ombublocks;
}
