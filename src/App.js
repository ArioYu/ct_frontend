import React, { useState } from 'react';
import '@chatui/core/dist/index.css';
import '@chatui/core/es/styles/index.less';
import './chatui-theme.css';
// 引入组件
import {DeleteOutlined, EditOutlined, InboxOutlined, MoreOutlined} from '@ant-design/icons';
import botAvatar from './bot.png'; // 引入本地图片
import ChatBot from './chat'
import {Form, Input, Modal, Select, Button, Popconfirm, message, Dropdown, Menu} from "antd";
import Dragger from "antd/es/upload/Dragger";
const { Option } = Select;
function App() {

  const [form] = Form.useForm();

  const [conversations, setConversations] = useState(JSON.parse(localStorage.getItem('conversations')) || []);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]); // Track the uploaded files

  const props = {
    name: 'file',
    multiple: false,
    action: 'https://file.io', // Public upload URL 假装上传
    headers: {
      authorization: 'authorization-text',
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return true;
    },
    onChange(info) {
      const { status } = info.file;
      setFileList(info.fileList.slice(-1));
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        setTimeout(() => {
          message.success(`${info.file.name} 文件上传成功，知识图谱建立成功`);
          handleNewConversation();
          setFileList([]);
        }, 30000);
      } else if (status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
    onRemove: () => {
      setFileList([]);
    },
    onDrop(e) {
      setTimeout(() => {
        message.success(`文件上传成功，知识图谱建立成功`);
      }, 30000);
    },
    fileList,
  };

  function handleConversationClick(conversation) {
    setCurrentConversation(conversation);
    setMessages(conversation.messages)
    console.log(conversation.messages)
  }

  function handleUpdateConversation(updatedMessages){
    if (currentConversation) {
      const updatedConversations = conversations.map((conv) =>
          conv.id === currentConversation.id ? { ...conv, messages: updatedMessages } : conv
      );
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
    else {
      const newConversation = {
        id: Date.now(),
        name: `对话${conversations.length + 1}`,
        messages: updatedMessages
      };
      const updatedConversations= [...conversations, newConversation]
      setConversations(updatedConversations);
      setCurrentConversation(newConversation)
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  }

  function handleNewConversation() {
    // Save current messages to the current conversation
    form.resetFields();
    setIsModalVisible(false)
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
    const updatedConversations= [...conversations, newConversation]
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    handleConversationClick(newConversation);
  }

  const handleRenameConversation = (conversationId) => {
    // 实现重命名功能
    const newName = prompt('请输入新的对话名称');
    if (newName) {
      const updatedConversations = conversations.map(conversation =>
          conversation.id === conversationId ? { ...conversation, name: newName } : conversation
      )
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      message.success('对话已重命名');
    }
  };

  const handleDeleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(conversation => conversation.id !== conversationId)
    setConversations(updatedConversations);
    setCurrentConversation([]);
    setMessages([
      {
        type: 'text',
        content: { text: '我是CT智能诊断助理，你的贴心小助手~' },
        user: { avatar: botAvatar },
      }
    ]);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    message.success('对话已删除');
  };

  const menu = (conversation) => (
      <Menu>
        <Menu.Item key="rename" icon={<EditOutlined />} onClick={(e) => {
          handleRenameConversation(conversation.id);
        }}>
          重命名
        </Menu.Item>
        <Menu.Item key="delete" icon={<DeleteOutlined />}>
          <Popconfirm
              title="确定删除这个对话吗？"
              onConfirm={(e) => {
                e.stopPropagation();
                handleDeleteConversation(conversation.id);
              }}
              okText="是"
              cancelText="否"
              onCancel={(e) => e.stopPropagation()}
          >
            删除
          </Popconfirm>
        </Menu.Item>
      </Menu>
  );

  return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ width: '250px', background: '#f4f4f4', padding: '16px', overflowY: 'auto' }}>
          <h3>聊天对话</h3>
          <Button onClick={() => {setIsModalVisible(true);}} type="primary" block>
            新建对话
          </Button>
          <div style={{ marginTop: '16px' }}>
            {conversations.map((conversation) => (
                <div
                    key={conversation.id}
                    style={{
                      position: 'relative', // 为了定位删除图标
                      padding: '8px',
                      background: currentConversation?.id === conversation.id ? '#e6f7ff' : '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => handleConversationClick(conversation)}
                >
                  {conversation.name}
                  <Dropdown overlay={menu(conversation)} trigger={['click']} onClick={(e) => e.stopPropagation()}>
                    <Button
                        shape="circle"
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()} // 阻止点击事件传递给父元素
                    />
                  </Dropdown>
                </div>
            ))}
          </div>
        </div>
        <Modal
            title="创建新对话"
            open={isModalVisible}
            footer={null}
            onCancel={() => {
              form.resetFields();
              setIsModalVisible(false);
            }}

        >
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或者拖拽文件进行上传，创建知识图谱</p>
          </Dragger>
        </Modal>
        <ChatBot storedMessages={messages} handleUpdateConversation={handleUpdateConversation}/>
      </div>
  );
}

export default App;
