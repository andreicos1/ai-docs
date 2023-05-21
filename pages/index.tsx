import AiIcon from "public/ai-icon.svg";
import IconUser from "public/icon-user.svg";
import { useRef, useState } from "react";
import { remark } from "remark";
import html from "remark-html";
import Layout from "../components/Layout";
import SanitizeHTML from "../components/SanitizeHtml";
import TextArea from "../components/TextArea";
import generateRandomString from "../utils/generateRandomString";

// TODO: Move the chatHtml state to a child component

const convertMarkdownToHtml = async (data: string) => {
  const processedContent = await remark().use(html).process(data);
  return processedContent.toString();
};

type Message = {
  htmlContent: string;
  isUser: boolean;
};

export default function Home() {
  const [generatingMessage, setGeneratingMessage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [firstInput, setFirstInput] = useState<string>("");
  const [chatHtml, setChatHtml] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [followupInput, setFollowupInput] = useState<string>("");
  const [showFollupInput, setShowFollowupInput] = useState<boolean>(false);
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);
  const controller = useRef<AbortController>(new AbortController());

  const onChangeFirstInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFirstInput(event.target.value);
  };

  const onChangeFollowupInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFollowupInput(event.target.value);
  };

  const handleSubmit = async (isFirstMessage: boolean) => {
    setLoading(true);
    setGeneratingMessage(true);
    if (isFirstMessage) {
      setFirstInput("");
    } else {
      setFollowupInput("");
    }
    setPreviousMessages((previousMessages) =>
      isFirstMessage
        ? [
            {
              htmlContent: firstInput,
              isUser: true,
            },
          ]
        : [
            ...previousMessages,
            {
              htmlContent: followupInput,
              isUser: true,
            },
          ]
    );

    let newConversationId;
    if (isFirstMessage) {
      newConversationId = generateRandomString();
      setConversationId(newConversationId);
    }

    const endpoint = isFirstMessage ? "/api/query" : "/api/chat";
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        query: isFirstMessage ? firstInput : followupInput,
        conversationId: isFirstMessage ? newConversationId : conversationId,
      }),
      headers: { "Content-Type": "application/json" },
      signal: controller.current.signal,
    });

    const stream = response.body;
    if (!stream) return;

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    setLoading(false);

    let currentContent = "";
    let htmlContent = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const decodedValue = decoder.decode(value);
        currentContent += decodedValue;
        htmlContent = await convertMarkdownToHtml(currentContent);
        setChatHtml(htmlContent);
      }
    } catch (error) {
      console.error({ error });
    } finally {
      reader.releaseLock();
      setPreviousMessages((previousMessages) => [
        ...previousMessages,
        { htmlContent, isUser: false },
      ]);
      setGeneratingMessage(false);
      setChatHtml("");
      setShowFollowupInput(true);
    }
  };

  const handleStop = () => {
    controller.current.abort();
    controller.current = new AbortController();
    setLoading(false);
    setGeneratingMessage(false);
  };

  const getChatContent = () => {
    if (loading) {
      return (
        <div className="flex items-center w-full max-w-3xl p-5 sm:px-7 gap-4 border-t-2 border-tertiary bg-tertiary">
          <AiIcon className="w-10 h-10 self-start fill-primary bg-secondaryDark" />
          <span className="animate-pulse-full bg-white w-1 h-5"></span>
        </div>
      );
    }
    if (chatHtml) {
      return (
        <div className="flex items-center w-full max-w-3xl p-5 sm:px-7 gap-4 border-t-2 border-tertiary bg-tertiary">
          <AiIcon className="w-10 h-10 self-start fill-primary bg-secondaryDark" />
          <SanitizeHTML
            className="flex-1 overflow-hidden leading-6 ai-answer"
            html={chatHtml}
          />
        </div>
      );
    }
    if (!previousMessages.length && !chatHtml) {
      return (
        <div className="grow flex items-center text-primary">
          <h1 className="text-2xl">QA Storefront-UI v0.13.6</h1>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <main className="mx-auto bg-primaryLight min-h-screen h-full flex flex-col items-center  py-8 md:py-12">
        <TextArea
          handleStop={handleStop}
          generatingMessage={generatingMessage}
          isFirstMessage={true}
          onSubmit={handleSubmit}
          input={firstInput}
          placeholder="Start a new conversation"
          onChangeInput={onChangeFirstInput}
        />

        {previousMessages.map(({ htmlContent, isUser }) => (
          <div
            key={generateRandomString()}
            className={`flex items-center w-full max-w-3xl p-5 sm:px-7 gap-4 border-t-2 border-tertiary  ${
              isUser ? "bg-primaryLight" : "bg-tertiary"
            }`}
          >
            {isUser ? (
              <IconUser className="w-10 h-10 self-start fill-primary bg-secondaryDark" />
            ) : (
              <AiIcon className="w-10 h-10 self-start fill-primary bg-secondaryDark" />
            )}
            <SanitizeHTML
              className="flex-1 overflow-hidden leading-6 ai-answer"
              html={htmlContent}
            />
          </div>
        ))}
        {getChatContent()}

        {showFollupInput && (
          <TextArea
            handleStop={handleStop}
            generatingMessage={generatingMessage}
            isFirstMessage={false}
            input={followupInput}
            onChangeInput={onChangeFollowupInput}
            onSubmit={handleSubmit}
            placeholder="Send a follow-up question"
            className="mt-8 md:mt-14 mb-0"
          />
        )}
      </main>
    </Layout>
  );
}
