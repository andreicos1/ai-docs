import IconSend from "public/icon-send.svg"
import IconStop from "public/icon-stop.svg"
import { useEffect, useRef } from "react"

interface Props {
  input: string
  onChangeInput: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (isFirstMessageMessage: boolean) => void
  handleStop?: () => void
  isFirstMessage: boolean
  generatingMessage?: boolean
  placeholder?: string
  className?: string
  [x: string]: any
}

function TextArea({
  onSubmit,
  input,
  onChangeInput,
  handleStop,
  isFirstMessage,
  className,
  placeholder,
  generatingMessage,
  ...rest
}: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit(isFirstMessage)
    }
  }

  const handleSubmit = () => onSubmit(isFirstMessage)

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div className={`w-full max-w-[816px] mb-8 px-6 ${className ? className : ""}`} {...rest}>
      <div className="relative">
        <textarea
          ref={textAreaRef}
          rows={1}
          className="w-full overflow-auto resize-none rounded-md h-10 max-h-96 px-3 py-3 pr-9 bg-secondary focus:outline-none"
          placeholder={placeholder}
          value={input}
          onKeyDown={handleKeyDown}
          onChange={onChangeInput}
        />
        {generatingMessage ? (
          <button className="absolute top-[15px] right-4" onClick={handleStop}>
            <IconStop className="fill-primary" />
          </button>
        ) : (
          <button className="absolute top-[15px] right-4" onClick={handleSubmit}>
            <IconSend className="fill-primary" />
          </button>
        )}
      </div>
    </div>
  )
}

export default TextArea
