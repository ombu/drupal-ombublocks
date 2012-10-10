Tiles
==========
Block management that doesn't suck

## Specs

* Provides a hook to define reusable block types
    * User can create "instaces" instances of these blocks and assign to
      regions like any other block. These instances are plain Drupal
      blocks.
    * Blocks can be restricted to regions
* Adds ability to add blocks to regions
* Adds ability to set block weights within a region via drag & drop
* Manages contexts for blocks
    * User can choose between *shared* and *page* contexts.
    * Shared contexts affect multiple pages.
    * Page contect affects only the page for the current Drupal path.
    * Provides a hook for modules to register *shared* contexts contexts.
