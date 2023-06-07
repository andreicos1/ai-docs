import { ChatGPTMessage } from "../utils/openai-stream"

interface Props {
  conversations: ChatGPTMessage[]
}

const History = ({ conversations }: Props) => {
  console.log({ conversations })
  return <div>History</div>
}

export default History
