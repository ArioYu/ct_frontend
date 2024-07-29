import React, { useState } from 'react';
import '@chatui/core/dist/index.css';
import '@chatui/core/es/styles/index.less';
import './chatui-theme.css';
// 引入组件
import {DeleteOutlined, EditOutlined, MoreOutlined} from '@ant-design/icons';
import botAvatar from './bot.png'; // 引入本地图片
import ChatBot from './chat'
import {Form, Input, Modal, Select, Button, Popconfirm, message, Dropdown, Menu} from "antd";
const { Option } = Select;
function App() {

  const [form] = Form.useForm();

  const [conversations, setConversations] = useState(JSON.parse(localStorage.getItem('conversations')) || []);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
          <Form
              form={form}
              layout="vertical"
              onFinish={handleNewConversation}
          >
            <Form.Item
                name="database"
                label="数据库名称"
                rules={[{ required: true, message: '请选择数据库名称' }]}
            >
              <Select placeholder="选择数据库">
                <Option value="neo4j">Neo4j</Option>
                <Option value="qdrant">Qdrant</Option>
              </Select>
            </Form.Item>
            <Form.Item
                name="uri"
                label="URI"
                rules={[{ required: true, message: '请输入URI' }]}
            >
              <Input placeholder="输入URI" />
            </Form.Item>
            <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="输入用户名" />
            </Form.Item>
            <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ margin: '0 auto', display: 'block' }}>
                提交
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <ChatBot storedMessages={messages} handleUpdateConversation={handleUpdateConversation}/>
      </div>
  );
}

export default App;
