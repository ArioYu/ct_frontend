import React, { useState } from 'react';
import '@chatui/core/dist/index.css';
import '@chatui/core/es/styles/index.less';
import './chatui-theme.css';
// 引入组件
import Chat, { Bubble, useMessages, Toolbar, Button } from '@chatui/core';
import botAvatar from './bot.png'; // 引入本地图片
import ChatBot from './chat'

function App() {

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState('');

  function handleConversationClick(conversation) {
    setCurrentConversation(conversation);
    setMessages(conversation.messages)
    console.log(conversation.messages)
    localStorage.setItem('messages', JSON.stringify(conversation.messages));
  }

  function handleUpdateConversation(updatedMessages){
    if (currentConversation) {
      const updatedConversations = conversations.map((conv) =>
          conv.id === currentConversation.id ? { ...conv, messages: updatedMessages } : conv
      );
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  }

  function handleNewConversation() {
    // Save current messages to the current conversation
    if (currentConversation) {
      const updatedConversations = conversations.map((conv) =>
          conv.id === currentConversation.id ? { ...conv, messages } : conv
      );
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }

    // Create a new conversation
    const newConversation = {
      id: Date.now(),
      name: `对话${conversations.length + 1}`,
      messages: [
        {
          type: 'text',
          content: { text: '对话'+(conversations.length +1)+'，我是CT智能诊断助理，你的贴心小助手~' },
          user: { avatar: botAvatar },
        }
      ],
    };
    setConversations([...conversations, newConversation]);
    handleConversationClick(newConversation);
  }


  return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ width: '250px', background: '#f4f4f4', padding: '16px', overflowY: 'auto' }}>
          <h3>聊天对话</h3>
          <Button onClick={handleNewConversation} type="primary" block>
            新建对话
          </Button>
          <div style={{ marginTop: '16px' }}>
            {conversations.map((conversation) => (
                <div
                    key={conversation.id}
                    style={{
                      padding: '8px',
                      background: currentConversation?.id === conversation.id ? '#e6f7ff' : '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleConversationClick(conversation)}
                >
                  {conversation.name}
                </div>
            ))}
          </div>
        </div>
        <ChatBot storedMessages={messages} handleUpdateConversation={handleUpdateConversation}/>
      </div>
  );
}

export default App;
