module.exports = {
  docs: [
    'overview',
    'installation',
    'getting_started',
    'deployment',
    {
      type: 'category',
      label: 'Playground',
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
        // 'questionnaire',
        // 'continuous_1d',
        // 'continuous_keypoint'
      ],
    },
  ],
};
