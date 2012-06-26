<?php

/**
 * @file
 * Admin callbacks for ombublocks.module.
 */

/**
 * Form for adding ombublocks to a context
 */
function ombublock_add_form($form, &$form_state, $context_name = '') {
  if (empty($form_state['next_step'])) {
    $form['context'] = array(
      '#type' => 'value',
      '#value' => $context_name,
    );
    $form['destination'] = array(
      '#type' => 'value',
      '#value' => $_GET['destination'],
    );

    $form['block_type'] = array(
      '#type' => 'select',
      '#title' => t('Block Type'),
      '#options' => array('' => 'Select One') + ombublocks_get_types(),
      '#description' => t('Choose the type of block you\'d like to add'),
      '#required' => TRUE,
    );

    $form['region'] = array(
      '#title' => t('Region'),
      '#type' => 'select',
      '#options' => _ombublocks_get_regions(),
      '#description' => t('Choose a region for the block. Only regions where
      you can add blocks are listed.'),
      '#default_value' => 'content',
    );

    $form['next'] = array(
      '#type' => 'submit',
      '#value' => t('Next'),
      '#submit' => array('ombublock_add_form_next'),
    );
  }
  else {
    $bean = bean_create(array('type' => $form_state['type_values']['block_type']));
    $form_state['bean'] = $bean;
    module_load_include('inc', 'bean', 'includes/bean.pages');
    $form['bean_form'] = bean_form(array(), $form_state, $bean, $form_state['type_values']['block_type']);
    unset($form['bean_form']['actions']);

    // Hide the label
    $form['bean_form']['label']['#access'] = FALSE;
    $form['bean_form']['label']['#default_value'] = 'ombucleanup-tempkey';

    // Add in width form element for beans.
    $form['width'] = array(
      '#type' => 'select',
      '#title' => t('Width'),
      '#options' => _ombublocks_width_step_options(),
      '#default_value' => OMBUBLOCKS_WIDTH_STEPS,
      '#description' => t('Select the width of this block.'),
    );

    $form['save'] = array(
      '#type' => 'submit',
      '#value' => t('Add'),
      '#validate' => array('ombublock_add_form_add_validate'),
      '#submit' => array('ombublock_add_form_add_submit'),
    );
  }
  return $form;
}

function ombublock_add_form_next($form, &$form_state) {
    $form_state['next_step'] = TRUE;
    $form_state['type_values'] = $form_state['values'];
    $form_state['rebuild'] = TRUE;
}

function ombublock_add_form_add_validate($form, &$form_state) {
  if (isset($form_state['values']['bean'])) {
    $bean = $form_state['values']['bean'];

    $bean->label = $form_state['values']['label'];
    $bean->title = $form_state['values']['title'];

    if (isset($form_state['values']['view_mode'])) {
      $bean->view_mode = $form_state['values']['view_mode'];
    }

    field_attach_form_validate('bean', $bean, $form, $form_state);
    $form_state['values']['bean'] = $bean;

    $bean->validate($form_state['values'], $form_state);
  }
}

function ombublock_add_form_add_submit($form, &$form_state) {
  module_load_include('inc', 'bean', 'includes/bean.pages');
  $bean = $form_state['bean'];
  entity_form_submit_build_entity('bean', $bean, $form, $form_state);

  // Transform temporary delta key into a readable key.
  if ($bean->label == 'ombucleanup-tempkey') {
    if ($bean->title) {
      $bean->label = $bean->title;
    }
    else {
      $bean->label = $bean->type;
    }
  }

  $max_length = 32;
  // Base it on the label and make sure it isn't too long for the database
  $bean->delta = drupal_clean_css_identifier(strtolower($bean->label));
  $bean->delta = substr($bean->delta, 0, $max_length);

  // Check if delta is unique
  if (bean_load_delta($bean->delta)) {
    $i = 0;
    $separator = '-';
    $original_delta = $bean->delta;
    do {
      $unique_suffix = $separator . $i++;
      $bean->delta = substr($original_delta, 0, $max_length - drupal_strlen($unique_suffix)) . $unique_suffix;
    } while (bean_load_delta($bean->delta));
  }

  foreach (module_implements('bean_submit') as $module) {
    $function = $module . '_bean_submit';
    $function($bean, $form, $form_state);
  }

  $bean->setValues($form_state['values']);
  field_attach_submit('bean', $bean, $form, $form_state);
  $bean->save();
  $watchdog_args = array('@type' => $bean->type, '%title' => $bean->label);
  $t_args = array('@type' => $bean->typeName(), '%title' => $bean->label);

  watchdog('bean', '@type: added %title.', $watchdog_args, WATCHDOG_NOTICE, $bean->viewURL());
  drupal_set_message(t('@type %title has been created.', $t_args));

  // Save bean to selected region in the active page context.
  if ($form_state['type_values']['context']) {
    $context = context_load($form_state['type_values']['context']);
  }
  else {
    $context = _ombublocks_create_path_context($form_state['type_values']['destination']);
  }

  // Save the weight for this bean.
  ombublocks_block_set_width('bean', $bean->delta, $form_state['values']['width'], $context->name);

  $context->reactions['block']['blocks']['bean-' . $bean->delta] = array(
    'module' => 'bean',
    'delta' => $bean->delta,
    'region' => $form_state['type_values']['region'],
    'weight' => 0,
  );
  context_save($context);
}

/**
 * Form for setting the width on a block.
 */
function ombublocks_set_width($form, &$form_state, $module, $delta) {
  if (isset($_GET['destination'])) {
    $form['#context'] = 'ombublocks-' . _ombublocks_normalize_path($_GET['destination']);
  }

  $form['module'] = array(
    '#type' => 'value',
    '#value' => $module,
  );
  $form['delta'] = array(
    '#type' => 'value',
    '#value' => $delta,
  );

  $form['help'] = array(
    '#markup' => t('<p>Select the width of this block.</p>'),
  );

  $width = ombublocks_block_get_width($module, $delta, $form['#context']);

  $form['width'] = array(
    '#type' => 'select',
    '#title' => t('Width'),
    '#options' => _ombublocks_width_step_options(),
    '#default_value' => $width ? $width : OMBUBLOCKS_WIDTH_STEPS,

  );

  $form['actions'] = array(
    '#type' => 'actions',
    'submit' => array(
      '#type' => 'submit',
      '#value' => t('Save'),
      '#weight' => 5,
      '#submit' => array('ombublocks_set_width_submit'),
    ),
  );

  return $form;
}

/**
 * Submit handler for saving block width.
 */
function ombublocks_set_width_submit($form, &$form_state) {
  ombublocks_block_set_width($form_state['values']['module'], $form_state['values']['delta'], $form_state['values']['width'], $form['#context']);
  drupal_set_message('Block width saved');
}

/**
 * Delete an ombublock. Renders the block_custom_block_delete form. This
 * function is a placeholder in case we want to do a bit more later.
 *
 * @return form array
 */
function ombublocks_delete($module, $delta) {
  switch ($module) {
    // Block is a bean, delete bean since it's only on this page.
    case 'bean':
      $bean = bean_load_delta($delta);
      module_load_include('inc', 'bean', 'includes/bean.pages');
      $form = drupal_get_form('bean_delete_confirm', $bean);
      return $form;
      break;

    // Otherwise remove block from context.
    default:
      if (isset($_GET['destination'])) {
        $context = context_load('ombublocks-' . _ombublocks_normalize_path($_GET['destination']));
        if ($context) {
          foreach($context->reactions['block']['blocks'] as $key => $value) {
            if ($value['module'] == $module && $value['delta'] == $delta) {
              unset($context->reactions['block']['blocks'][$key]);
            }
          }
          context_save($context);

          drupal_set_message(t('Block removed'));
        }
      }
      break;
  }

  drupal_goto($_GET['destination']);
}

function ombublocks_delete_submit($form, &$form_state) {
  $context = context_load($form['#context']);
  if ($context) {
    // Delete bean from context.
    foreach($context->reactions['block']['blocks'] as $key => $value) {
      if ($value['module'] == 'bean' && $value['delta'] == $form['#bean']->delta) {
        unset($context->reactions['block']['blocks'][$key]);
      }
    }
    context_save($context);
  }
}

/**
 * Returns a themed link list with ombublocks
 * @param string $region
 *      Optional. Limit list to a given region
 * @return string
 */
function ombublocks_get_link_list($region = NULL) {
  $links = array();
  foreach (ombublocks_get($region) as $source => $title) {
    $links['links'][$source]['title'] = $title;
    $links['links'][$source]['href'] = '#';
  }
  return theme('links', $links);
}
