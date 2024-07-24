import React, {useEffect, useState} from 'react';
import '@chatui/core/dist/index.css';
import '@chatui/core/es/styles/index.less';
import './chatui-theme.css';
// 引入组件
import Chat, { Bubble, useMessages, Toolbar, Button } from '@chatui/core';
import { Input, message, Modal, Steps } from 'antd';
import botAvatar from './bot.png'; // 引入本地图片

const { TextArea } = Input;

const defaultMessages = [
    {
        type: 'text',
        content: { text: 'hello，我是CT智能诊断助理，你的贴心小助手~' },
        user: { avatar: botAvatar },
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
];

function ChatBot({storedMessages, handleUpdateConversation}) {
    const [file, setFile] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [entity, setEntity] = useState('');
    const [report, setReport] = useState('');
    const [disease, setDisease] = useState('');
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    let updatedMessages = storedMessages || defaultMessages;
    let { messages,resetList, appendMsg, setTyping } = useMessages(storedMessages || defaultMessages);

    useEffect(() => {
        if (storedMessages) {
            resetList(storedMessages);
        }
    }, [storedMessages]);

    const handleNextStep = async () => {
        if (currentStep === 0) {
            // 发送question给后端
            message.success('正在解析，请耐心等候');
            try {
                const response = await fetch('http://localhost:8080/get_entities', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ context: question }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setEntity(data.entities);
            } catch (error) {
                console.error('Error:', error);
                message.error('发生错误，请稍后再试。');
                return;
            }
        }
        if (currentStep === 1) {
            try {
                message.success('正在解析，请耐心等候');
                const response = await fetch('http://localhost:8080/get_disease_descriptions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ entity_str: entity }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json(); // 等待响应的 JSON 数据
                const res = data.descriptions.join('\n');

                console.log(res);
                setDisease(res);
            } catch (error) {
                console.error('Error:', error);
                message.error('发生错误，请稍后再试。');
            }
        }
        if (currentStep === 2) {
            try {
                message.success('正在解析，请耐心等候');
                const response = await fetch('http://localhost:8080/get_report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ context: disease, question: question }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json(); // 等待响应的 JSON 数据
                const res = data.report;

                console.log(res);
                setReport(res);
                appendMsg({
                    type: 'text',
                    content: { text: res },
                    user: { avatar: botAvatar },
                });
                updatedMessages = [...updatedMessages, {
                    type: 'text',
                    content: { text: res },
                    user: { avatar: botAvatar },
                }];
            } catch (error) {
                console.error('Error:', error);
                updatedMessages = [...updatedMessages, {
                    type: 'text',
                    content: { text: '发生错误，请稍后再试。' },
                    user: { avatar: botAvatar },
                }];
                appendMsg({
                    type: 'text',
                    content: { text: '发生错误，请稍后再试。' },
                    user: { avatar: botAvatar },
                });
            }
        }
        handleUpdateConversation(messages);
        setCurrentStep(currentStep + 1);
    };

    const handlePreviousStep = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        setCurrentStep(0);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setCurrentStep(0);
    };

    const steps = [
        {
            title: '输入CT影像所见',
            content: (
                <div>
                    <TextArea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="请输入CT影像所见"
                        autoSize={{
                            minRows: 3,
                        }}
                    />
                    <Button onClick={handleNextStep} type="primary">
                        下一步
                    </Button>
                </div>
            ),
        },
        {
            title: '实体解析',
            content: (
                <div>
                    <div style={{ marginTop: '16px' }}>
                        <div>
                            <h3>解析得到的实体:</h3>
                            <TextArea
                                value={entity}
                                onChange={(e) => setEntity(e.target.value)}
                                placeholder="请补充实体"
                                autoSize={{
                                    minRows: 3,
                                }}
                            />
                        </div>
                        <Button onClick={handlePreviousStep} style={{ marginRight: '8px' }}>
                            上一步
                        </Button>
                        <Button onClick={handleNextStep} type="primary">
                            下一步
                        </Button>
                    </div>
                </div>
            ),
        },
        {
            title: '症状相关疾病',
            content: (
                <div>
                    <h3>症状相关疾病:</h3>
                    <TextArea
                        value={disease}
                        onChange={(e) => setEntity(e.target.value)}
                        placeholder="请补充相关的疾病"
                        autoSize={{
                            minRows: 3,
                        }}
                    />
                    <div>
                        <Button onClick={handlePreviousStep} style={{ marginRight: '8px' }}>
                            上一步
                        </Button>
                        <Button onClick={handleNextStep} type="primary">
                            下一步
                        </Button>
                    </div>
                </div>
            ),
        },
        {
            title: '报告',
            content: (
                <div>
                    <h3>报告:</h3>
                    <TextArea
                        value={report}
                        onChange={(e) => setEntity(e.target.value)}
                        placeholder="请完善报告"
                        autoSize={{
                            minRows: 3,
                        }}
                    />
                    <div>
                        <Button onClick={handlePreviousStep} style={{ marginRight: '8px' }}>
                            上一步
                        </Button>
                        <Button onClick={handleOk} type="primary">
                            完成
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    // 发送回调
    async function handleSend(type, val) {
        if (type === 'text' && val.trim()) {
            appendMsg({
                type: 'text',
                content: { text: val },
                position: 'right',
            });
            updatedMessages.push({
                type: 'text',
                content: { text: val },
                position: 'right',
            });
            setTyping(true);

            if (val === "CT报告诊断") {
                setIsModalVisible(true);
            }
        }
        console.log(updatedMessages);
        handleUpdateConversation(updatedMessages);
    }

    function handleQuickReplyClick(item) {
        handleSend('text', item.name);
    }

    async function retryEntities() {
        console.log(question);
        handleSend('text', question);
    }

    function handleToolBarClick(item) {
        if (item.type === 'image') {
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
                            picUrl: URL.createObjectURL(file),
                        },
                        position: 'right',
                    });
                    updatedMessages.push({
                        type: 'image',
                        content: {
                            picUrl: URL.createObjectURL(file),
                        },
                        position: 'right',
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

        switch (type) {
            case 'text':
                return <Bubble content={content.text}></Bubble>;
            case 'image':
                return (
                    <Bubble type="image">
                        <img src={content.picUrl} alt="" />
                    </Bubble>
                );
            case 'file':
                return (
                    <Bubble>
                        <a href={content.url} download={content.name}>
                            {content.name}
                        </a>
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
            updatedMessages = [...updatedMessages, {
                type: 'file',
                content: { url: fileURL, name: uploadedFile.name },
                position: 'right',
            }];
        }
    }

    function handleConversationClick(conversation) {
        setCurrentConversation(conversation);
        // setMessages(conversation.messages);
        localStorage.setItem('messages', JSON.stringify(conversation.messages));
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
            messages: defaultMessages,
        };
        setConversations([...conversations, newConversation]);
        handleConversationClick(newConversation);
    }


    return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                <Modal
                    title="CT报告诊断"
                    visible={isModalVisible}
                    footer={null}
                    width="50vw"
                >
                    <Steps current={currentStep}>
                        {steps.map((item, index) => (
                            <Steps.Step key={index} title={item.title} />
                        ))}
                    </Steps>
                    <div className="steps-content" style={{ marginTop: '16px' }}>{steps[currentStep].content}</div>
                </Modal>
            </div>
    );
}

export default ChatBot;
