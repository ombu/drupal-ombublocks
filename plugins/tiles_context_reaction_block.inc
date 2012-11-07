<?php

/**
 * Expose blocks with proper weights as context reactions.
 *
 * This context gets triggered after context_reaction_block, so weights of
 * blocks assigned to this context will take precedence.
 */
class tiles_context_reaction_block extends context_reaction_block {
  /**
   * Extends context_reaction_block::execute() to add widths on blocks.
   */
  public function execute(&$page) {
    parent::execute($page);

    foreach (element_children($page) as $region_key) {
      foreach (element_children($page[$region_key]) as $block_key) {
        // Only set the width of the block if it is not already set.
        if (isset($page[$region_key][$block_key]['#block'])) {
          $block = $page[$region_key][$block_key]['#block'];
          if (!isset($block->bypass_width)) {
            $page[$region_key][$block_key]['#block']->width = tiles_get_block_width($block->module, $block->delta);
          }
        }
      }
    }
  }
}
