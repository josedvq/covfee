import '../client/css/gui.css'
import 'antd/dist/antd.css'
import './docs.css'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  viewMode: 'docs',
  options: {
    enableShortcuts: false,
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