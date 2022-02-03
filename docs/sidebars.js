module.exports = {
  docs: [
    'overview',
    'installation',
    'getting_started',
    'output',
    'deployment',
    {
      type: 'category',
      label: 'Tasks',
      collapsed: false,
      items: [
        'tasks/instructions',
        'tasks/questionnaire',
        'tasks/continuous_1d',
        'tasks/continuous_keypoint'
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: false,
      items: [
        'development',
        'custom_task'
      ],
    },
  ],
};
