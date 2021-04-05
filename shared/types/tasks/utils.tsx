/**
 * 
 * Props for raw Markdown/HTML data
 * @TJS-additionalProperties false
 * @title raw
 */
export interface MarkdownContentRawSpec {
    /**
     * @default "raw"
     */
    type: 'raw'
    /**
     * A valid Markdown/HTML string
     */
    content: string
}

/**
 * Supplied is a link to a Markdown/HTML file.
 * @TJS-additionalProperties false
 * @title link
 */
export interface MarkdownContentLinkSpec {
    /**
     * @default "link"
     */
    type: 'link'
    /**
     * A url pointing to a valid Markdown/HTML file.
     */
    url: string
}

export type MarkdownContentSpec = MarkdownContentRawSpec | MarkdownContentLinkSpec

