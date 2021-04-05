module.exports = {
  docs: [
    'getting_started',
    'annotation',
    'timeline',
    'custom_task',
    'development',
    'deployment',
    {
      type: 'category',
      label: 'Tasks Playground',
      collapsed: false,
      items: [
        'tasks/instructions',
        'tasks/questionnaire',
        'tasks/continuous_1d',
        'tasks/continuous_keypoint'
      ],
    },
  ],
};
