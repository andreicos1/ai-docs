import IconSend from "public/icon-send.svg";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { remark } from "remark";
import html from "remark-html";
import SanitizeHTML from "../components/SanitizeHtml";
import generateRandomString from "../utils/generateRandomString";

const convertMarkdownToHtml = async (data: string) => {
  const processedContent = await remark().use(html).process(data);
  return processedContent.toString();
};

type Message = {
  htmlContent: string;
  isUser: boolean;
};

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [chatHtml, setChatHtml] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [followupInput, setFollowupInput] = useState<string>("");
  const [showFollupInput, setShowFollowupInput] = useState<boolean>(false);
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);

  const onChangeUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const onChangeFollowupInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFollowupInput(e.target.value);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    route?: string
  ) => {
    if (e.key === "Enter") {
      handleSubmit(route);
    }
  };

  const handleSubmit = async (route = "query") => {
    setLoading(true);
    setUserInput("");
    setPreviousMessages((previousMessages) => [
      ...previousMessages,
      { htmlContent: userInput || followupInput, isUser: true },
    ]);
    let newConversationId;
    if (!conversationId) {
      newConversationId = generateRandomString();
      setConversationId(newConversationId);
    }

    const response = await fetch(`/api/${route}`, {
      method: "POST",
      body: JSON.stringify({
        query: userInput || followupInput,
        conversationId: conversationId || newConversationId,
      }),
      headers: { "Content-Type": "application/json" },
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
        console.log({ done });
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
      setChatHtml("");
      setShowFollowupInput(true);
    }
  };

  const getChatContent = () => {
    if (loading) {
      return (
        <p className="w-full max-w-3xl py-3 sm:py-5 leading-6">
          <Skeleton baseColor="#a3a3a3" highlightColor="#c3c3c3" count={3} />
        </p>
      );
    }
    if (chatHtml) {
      return (
        <SanitizeHTML
          className="flex-grow-1 px-0 sm:px-16 py-3 sm:py-5 leading-6 ai-answer md:py-8"
          html={chatHtml}
        />
      );
    }
    if (!previousMessages.length && !chatHtml) {
      return (
        <div className="grow flex items-center text-primary">
          <h1 className="text-2xl">Storefront-UI v0.13.6 Query</h1>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="mx-auto min-h-screen h-full max-w-7xl flex flex-col items-center px-6 sm:px-16 py-16 md:py-30">
      <div className="w-full max-w-3xl relative">
        <input
          className="w-full rounded-md h-10 px-3 py-2 pr-9 bg-secondary focus:outline-none"
          type="text"
          placeholder="Ask me anything about UI Storefront"
          value={userInput}
          onKeyDown={handleKeyDown}
          onChange={onChangeUserInput}
        />
        <button
          className="absolute top-3 right-3"
          onClick={() => handleSubmit()}
        >
          <IconSend className="fill-primary" />
        </button>
      </div>

      {previousMessages.map(({ htmlContent, isUser }) => (
        <div
          key={generateRandomString()}
          className={`w-full ${isUser ? "bg-transparent" : "bg-tertiary"}`}
        >
          <SanitizeHTML
            className="flex-grow-1 px-0 sm:px-16 py-3 sm:py-5 leading-6 ai-answer md:py-8"
            html={htmlContent}
          />
          <span className="inline-block w-full h-0.5 bg-black my-4"></span>
        </div>
      ))}
      {getChatContent()}

      {showFollupInput && (
        <div className="w-full max-w-3xl relative mt-10 sm:mb-12 mb-10 sm:mb-16">
          <input
            className="w-full rounded-md h-10 px-3 py-2 pr-9 bg-secondary focus:outline-none"
            type="text"
            placeholder="Follow up question"
            value={followupInput}
            onKeyDown={(e) => handleKeyDown(e, "chat")}
            onChange={onChangeFollowupInput}
          />
          <button
            className="absolute top-3 right-3"
            onClick={() => handleSubmit("chat")}
          >
            <IconSend className="fill-primary" />
          </button>
        </div>
      )}
    </main>
  );
}
