import React, { useState } from 'react';
import '@chatui/core/es/styles/index.less';
// 引入组件
import Chat, {Bubble, useMessages, Toolbar, Button} from '@chatui/core';
// 引入样式
import '@chatui/core/dist/index.css';

const defaultMessages = [
  {
    type: 'text',
    content: { text: 'hello，我是CT智能诊断助理，你的贴心小助手~' },
    user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
  }
];


// 默认快捷短语，可选
const defaultQuickReplies = [
  {
    icon: 'message',
    name: 'CT报告诊断',
    isHighlight: true,
  },
];

const defaultToolBar = [
  {
    type: 'image',
    icon: 'image',
    title: '相册',
  },
]

function App() {

  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [entity, setEntity] = useState('');
  const storedMessages = JSON.parse(localStorage.getItem('messages'));
  const initialMessages = storedMessages && storedMessages.length > 0 ? storedMessages : defaultMessages;
  const { messages, appendMsg, setTyping } = useMessages(initialMessages);



  // 发送回调
  async function handleSend(type, val) {
    if (type === 'text' && val.trim()) {
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
      });

      setTyping(true);

      if (val === "CT报告诊断") {
        appendMsg({
          type: 'text',
          content: { text: '请输入CT影像所见或者上传一个文件~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        });
      } else {
        try {
          setQuestion(val)
          const response = await fetch('http://localhost:8080/get_entities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ context: val })
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json(); // 等待响应的 JSON 数据
          const res = data.entities;
          setEntity(res)
          console.log(res);
          appendMsg({
            type: 'text',
            content: { text: res },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          });
        } catch (error) {
          console.error('Error:', error);
          appendMsg({
            type: 'text',
            content: { text: '发生错误，请稍后再试。' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          });
        } finally {
          setTyping(false); // 停止打字状态
        }
      }
      localStorage.setItem("message", JSON.stringify(messages))
    }
  }


  function handleQuickReplyClick(item) {
    handleSend('text', item.name);
  }

  async function retryEntities(){
    console.log(question)
    handleSend('text', question);
  }

  async function getReport () {
    setTyping(true);
    let descriptions;
    try {
      const response = await fetch('http://localhost:8080/get_disease_descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({entity_str : entity })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json(); // 等待响应的 JSON 数据
      const res = data.descriptions.join('\n');

      descriptions = res
      console.log(descriptions);

      appendMsg({
        type: 'text',
        content: { text: "智能助理为您找了可能的相关疾病\n"+res },
        user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
      });
    } catch (error) {
      console.error('Error:', error);
      appendMsg({
        type: 'text',
        content: { text: '发生错误，请稍后再试。' },
        user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
      });
    } finally {
      setTyping(false); // 停止打字状态
    }

    setTyping(true);
    try {
      const response = await fetch('http://localhost:8080/get_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({context : descriptions, question: question })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json(); // 等待响应的 JSON 数据
      const res = data.report;

      console.log(res);
      appendMsg({
        type: 'text',
        content: { text: res },
        user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
      });
    } catch (error) {
      console.error('Error:', error);
      appendMsg({
        type: 'text',
        content: { text: '发生错误，请稍后再试。' },
        user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
      });
    } finally {
      setTyping(false); // 停止打字状态
    }
  }

  function handleToolBarClick(item) {
    if (item.type === "image") {
      // 创建一个隐藏的文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      // 监听文件选择事件
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          // 先展示图片
          appendMsg({
            type: 'image',
            content: {
              picUrl: URL.createObjectURL(file)
            },
            position: 'right'
          });
          handleSend('image', file);
        }
      });

      // 触发文件选择对话框
      fileInput.click();
    }
  }

  function renderMessageContent(msg) {
    const { type, content } = msg;

    if (type === 'text' && content.text.includes('部位') && content.text.includes('症状')) {
      return (
          <Bubble content={content.text} >
            <Button onClick={retryEntities} style={{ marginLeft: '10%', marginRight: '20%' }}>重新生成</Button>
            <Button color="primary" onClick={getReport}>确认</Button>
          </Bubble>
      );
    }


    switch (type) {
      case 'text':
        return (
            <Bubble content={content.text} >
            </Bubble>
        );
      case 'image':
        return (
            <Bubble type="image">
              <img src={content.picUrl} alt="" />
            </Bubble>
        );
      case 'file':
        return (
            <Bubble>
              <a href={content.url} download={content.name}>{content.name}</a>
            </Bubble>
        );
      default:
        return null;
    }
  }

  function handleFileChange(event) {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      const fileURL = URL.createObjectURL(uploadedFile);
      setFile(uploadedFile);

      appendMsg({
        type: 'file',
        content: { url: fileURL, name: uploadedFile.name },
        position: 'right',
      });
    }
  }

  return (
      <Chat
          navbar={{ title: 'CT智能诊断助理' }}
          messages={messages}
          renderMessageContent={renderMessageContent}
          quickReplies={defaultQuickReplies}
          onQuickReplyClick={handleQuickReplyClick}
          onSend={handleSend}
          toolbar={defaultToolBar}
          onToolbarClick={handleToolBarClick}
      />
  );
}

export default App;
