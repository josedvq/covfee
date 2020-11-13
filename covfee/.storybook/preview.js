import '../app/src/css/gui.css'
import 'antd/dist/antd.css'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  viewMode: 'docs',
  options: {
    storySort: {
        order: [
          'Covfee',
          'Getting Started', 
          'Timeline HITs',
          'Annotation HITs',
          'Custom Tasks', 
          'Development Setup', 
          'Deploying covfee',
          'Tasks',
          'Input',
          'Players'
        ],
    }
  }
}