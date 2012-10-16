Tiles
=====

Tiles is an approach to page layouts we've been working on at OMBU. This
approach uses core blocks, beans, and context to let site editors manage page
layouts by adding, arranging, and setting widths of blocks directly on the page.

Tiles is an alternative to creating layouts via the block or context UIs,
Panels, and sometimes even theme regions. When coupled with a Bootstrap
fluid-grid theme, this approach allows building modern HTML5 layouts well suited
for desktop and mobile.

Goals
-----

Tiles enhances Drupal core blocks so that, site editors can add, move, and
resize blocks on any page without leaving it. Tiles provides:

- An "Add Block" local task on all pages
- Easily add blocks
- Move blocks around the page
- Resize blocks

Architecture
------------

- Tiles stores a width on blocks. Widths are integers provided by the theme in
  the info file.i The hightest integer is a the width of a row. For example, a
  5-column grid would define:

        tiles_widths[1] = '20%'
        tiles_widths[2] = '40%'
        tiles_widths[3] = '60%'
        tiles_widths[4] = '80%'
        tiles_widths[5] = '100%'

- Tiles provides a UI for settings the width and weight on blocks and exposes an
  API for theming these.

    - On the backend:

     `theme_tile`
     :

     `theme_tile_row`
     :

    - On the frontend:

    Drupal.tiles.render_region(region_name);
    : Requests updated region markup from the backend, based on the region manifest.

    Drupal.tiles.save_region(region_name);
    : Saves current region state.

    Drupal.tiles._serialize_region(region_name)
    : Returns a JSON object describing the region's blocks and their weight and
    width.

Integrations
------------

### Bean

When coupled with the [Bean module]() this approach provides a powerful way to
manage page content and layouts. Tiles provides an "Add Block" local task on all
pages that site editors can use to instantiate Beans on a page (e.g. twitter
bean, RSS bean). Once instantiated, a Bean is a block, so Tiles functionality
such as inline moving and sizing is available.

### BeanContainer

When coupled with the [bean_container module]() this approach allows to create
multicolumn layouts without theme regions or page specific CSS.

### Grids and Responsive Layouts

This approach shines when coupled with a theme that provides a grid layout, such
as [Bootstrap's fluid grid](http://twitter.github.com/bootstrap/scaffolding.html#fluidGridSystem) where avilable tile widths can be set to the grid
columns. Our [Tiles Demo profile]() serves as an example for this approach.

Hooks
-----

`hook_tiles_widths` and `hook_tiles_widths_alter`
: Hard codes widths for tiles

`hook_tiles_info` and `hook_tiles_info_alter`
: Exposes blocks as tiles (tiles also implements this hook and defines all beans
as tiles)

`hook_tiles_regions`
: Defines what regions can have Tiles

`hook_tiles_widths`
: Available widths for a row `range(1, 12)`

`quasi-hook_tiles_types`
: huh?

`theme_tile($block)`
: Allows the theme to adds markup to a block. Default implementation does
nothing.

`theme_tile_row($blocks)`
: Gets passed the blocks that fit into a row as determined by
`hook_tiles_widths`. Default implementation does nothing.


Take it for a spin
-------------------

Specs
-----

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
