import * as React from 'react'
import classNames from 'classnames'
import $ from 'jquery'

export const getTaskClass = (type: string) => {
    if (type in AvailableTasks) {
        const taskClass = AvailableTasks[type]
        return taskClass
    } else {
        return null
    }
}

// removes relative links in Markdown
// used to clean github docs for storybook
export const updateMarkdownLinks = (doc: string) => {
    const html = $($.parseHTML('<div>' + doc + '</div>'))
    html.find('a')
        .filter(function () {
            const pattern = /^((http|https|ftp):\/\/)/
            const href = $(this).attr("href")
            return !pattern.test(href)
        })
        .each(function () {
            $(this).attr('href', null)
            $(this).css({
                'pointer-events': 'none',
                cursor: 'default',
                'text-decoration': 'none',
                'color': 'black'
            })
        })
    return html.html()
}

export class CodeBlock extends React.Component {
    render() {
        return <>
            <div>
                <pre className={classNames('docs-code-block')}>
                    {JSON.stringify(this.props.code, null, 2)}
                </pre >
            </div >
        </>
    }
}

export class LivePreviewFrame extends React.Component {
    render() {
        return <>
            <div style={{border: '1px solid #c8c8c8'}}>
                <div style={{ backgroundColor: '#d8d8d8', padding: '3px 5px', textAlign: 'center', color: '#555555'}}>LIVE PREVIEW: data is not being collected</div>
                {this.props.children}
            </div >
        </>
    }
}