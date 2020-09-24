export default {
    title: 'covfee: continuous video feedback tool',
    description: 'Covfee was created to provide an easily extensible tool for video perception and annotation experiments, especially those requiring continuous feedback from the user.',
    typescript: true,
    public: 'static',
    htmlContext: {
        head: {
            raw: ['<script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"><script src="https://unpkg.com/antd@4.3.3/dist/antd.min.js"/>'],
            links: [{
                    rel: 'stylesheet',
                    href: '//vjs.zencdn.net/7.8.2/video-js.min.css'
                },
                {
                    rel: 'stylesheet',
                    href: 'https://unpkg.com/antd@4.3.3/dist/antd.min.css'
                }
            ]
        },
        footer: {
            scripts: [{
                    src: 'https://unpkg.com/react@16/umd/react.development.js'
                },
                {
                    src: 'https://unpkg.com/react-dom@16/umd/react-dom.development.js'
                },
                {
                    src: 'https://unpkg.com/antd@4.3.3/dist/antd.min.js'
                },
                {
                    src: '//vjs.zencdn.net/7.8.2/video.min.js'
                },
                {
                    src: '/static/opencv.js'
                }
            ],
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