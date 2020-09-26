export default {
    title: 'covfee: continuous video feedback tool',
    description: 'Covfee was created to provide an easily extensible tool for video perception and annotation experiments, especially those requiring continuous feedback from the user.',
    typescript: true,
    public: 'static',
    htmlContext: {
        head: {
            
        },
        footer: {
           
        }
    },
    menu: [
        {
            name: 'Setup'
        },
        {
            name: 'Tasks',
            menu: [
                'Instructions',
                'Form',
                'Continuous Keypoint',
                'Continuous Action',
                'Continuous Emotion'
            ]
        },
        {
            name: 'Players',
            menu: [
                'HTML5 player',
                'VideoJS player',
                'MPEG dash player',
                'OpenCV player'
            ]
        },
        {
            name: 'Input',
            menu: [
                'Mouse Tracker',
            ]
        }
    ]
}