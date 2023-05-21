import IconSend from "public/icon-send.svg";
import { useEffect, useRef } from "react";

type Props = {
  input: string;
  onChangeInput: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (isFirstMessageMessage: boolean) => void;
  isFirstMessage: boolean;
  placeholder?: string;
  className?: string;
  [x: string]: any;
};

function TextArea({
  onSubmit,
  input,
  onChangeInput,
  isFirstMessage,
  className,
  placeholder,
  ...rest
}: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      onSubmit(isFirstMessage);
    }
  };

  const handleSubmit = () => onSubmit(isFirstMessage);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div
      className={`w-full max-w-3xl relative mb-8 ${className ? className : ""}`}
      {...rest}
    >
      <textarea
        ref={textAreaRef}
        rows={1}
        className="w-full overflow-hidden resize-none rounded-md h-10 px-3 py-3 pr-9 bg-secondary focus:outline-none"
        placeholder={placeholder}
        value={input}
        onKeyDown={handleKeyDown}
        onChange={onChangeInput}
      />
      <button className="absolute top-[15px] right-3" onClick={handleSubmit}>
        <IconSend className="fill-primary" />
      </button>
    </div>
  );
}

export default TextArea;
