import '../app/src/css/gui.css'
import 'antd/dist/antd.css'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    storySort: {
        order: [
          'Getting Started', 
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