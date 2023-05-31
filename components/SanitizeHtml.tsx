import sanitizeHtml from "sanitize-html"

const defaultOptions = {
  allowedTags: ["p", "b", "i", "em", "strong", "span", "code", "pre", "br", "div", "h1", "h2", "h3", "h4", "h5"],
}

const sanitize = (dirty: string, options: typeof defaultOptions) => ({
  __html: sanitizeHtml(dirty, { ...defaultOptions, ...options }),
})

const SanitizeHTML = ({ html, options, ...rest }: any) => (
  <div dangerouslySetInnerHTML={sanitize(html, options)} {...rest} />
)
export default SanitizeHTML
