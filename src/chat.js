import React, {useEffect, useState} from 'react';
import '@chatui/core/dist/index.css';
import '@chatui/core/es/styles/index.less';
import './chatui-theme.css';
import './chat.css'
// 引入组件
import Chat, { Bubble, useMessages, Toolbar, Button } from '@chatui/core';
import {Input, message, Modal, Rate, Steps} from 'antd';
import CytoscapeComponent from 'react-cytoscapejs';
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
    const [question, setQuestion] = useState(''); // 输入的问题
    const [entity, setEntity] = useState(''); // 第一步输出的实体
    const [report, setReport] = useState(''); // 第三步生成的报告
    const [disease, setDisease] = useState(''); // 第二步输出的疾病
    const [nodes, setNodes] = useState([]);
    const [elements, setElements] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [rate, setRate] = useState(2.5);
    let updatedMessages = storedMessages || defaultMessages;
    let { messages,resetList, appendMsg, setTyping } = useMessages(storedMessages || defaultMessages);

    useEffect(() => {
        if (storedMessages) {
            resetList(storedMessages);
        }
    }, [storedMessages]);


    const renderDiseaseInReport = () => {
        const diseaseEntries = disease.split('\n\n').filter(Boolean);

        return diseaseEntries.map((entry, index) => {
            const [diseaseName, diseaseDescription] = entry.split('\n');
            return (
                <div key={index} style={{ marginBottom: '16px' }}>
                    <strong>{diseaseName}</strong>
                    <p>{diseaseDescription}</p>
                </div>
            );
        });
    };

    const handleReportChange = (e) => {
        const updatedReport = e.target.value;
        const diseaseEntries = disease.split('\n\n').filter(Boolean);

        let formattedReport = updatedReport;

        diseaseEntries.forEach(entry => {
            const [diseaseName, diseaseDescription] = entry.split('\n');
            const regex = new RegExp(`(${diseaseName})`, 'g');
            formattedReport = formattedReport.replace(regex, `<strong>${diseaseName}</strong><div>${diseaseDescription}</div>`);
        });

        setReport(formattedReport);
    };

    const handleNextStep = async () => {
        if (currentStep === 0) {
            // 发送question给后端
            message.success('正在解析，请耐心等候');
            appendMsg({
                type: 'text',
                content: { text: question },
                position: 'right',
            });
            updatedMessages.push({
                type: 'text',
                content: { text: question },
                position: 'right',
            });
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
            await handleRate(question, entity);
            await handleGetDiseases();

        }
        if (currentStep === 2) {
            await handleRate(entity, disease);
            await handleUpdateWeight();
            await handleGetDiseases();
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
        handleUpdateConversation(updatedMessages);
        setCurrentStep(currentStep + 1);
        setRate(2.5);
    };

    const handlePreviousStep = () => {
        setCurrentStep(currentStep - 1);
        setRate(2.5);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        setCurrentStep(0);
        handleRate(disease, report).then(r => console.log(r));
        setRate(2.5);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setCurrentStep(0);
        setRate(2.5);
    };

    const formatReport = (report) => {
        const diseaseEntries = disease.split('\n\n').filter(Boolean);

        let formattedReport = report;

        diseaseEntries.forEach(entry => {
            const [diseaseName, diseaseDescription] = entry.split('\n');
            const regex = new RegExp(`(${diseaseName})`, 'g');
            formattedReport = formattedReport.replace(regex, `<div class="disease-entry"><strong class="disease-name">${diseaseName}</strong><div class="disease-description">${diseaseDescription}</div></div>`);
        });


        return formattedReport;
    };

    const handleDownload = () => {
        // 下载 PDF 文件的逻辑
        fetch('http://localhost:8080/get_report_pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report }),
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'report.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Error downloading PDF:', error));
    };

    const handleUpdateWeight = async() =>{
        if (rate === 0) return;
        try {
            message.success('正在修改权重！');
            const response = await fetch('http://localhost:8080/change_weight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({nodes: nodes, score_change: rate}),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json(); // 等待响应的 JSON 数据
            if(data.status === 'success') {
                message.success('反馈结果记录成功！');
            }
        } catch (error) {
            message.error('发生错误，请稍后再试。');
        }
    }

    const handleGetDiseases = async() => {
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

            setDisease(res);

            const nodes = data.nodes;
            const edges = data.relations;

            setNodes(nodes);
            setElements([...nodes, ...edges]);

            console.log(elements)
        } catch (error) {
            console.error('Error:', error);
            message.error('发生错误，请稍后再试。');
        }
    }

    const handleRate = async (q, a) => {
        try {
            message.success('正在记录反馈结果！');
            const response = await fetch('http://localhost:8080/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({question: q, answer: a, rate: rate}),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json(); // 等待响应的 JSON 数据
            message.success('反馈结果记录成功！');
        } catch (error) {
            message.error('发生错误，请稍后再试。');
        }

    }

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
                    <Button onClick={handleNextStep} type="primary" style={{ marginTop: '16px' }}>
                        下一步
                    </Button>
                </div>
            ),
        },
        {
            title: 'CT影像解析',
            content: (
                <div>
                    <div>
                        <h3>解析结果:</h3>
                        <TextArea
                            value={entity}
                            onChange={(e) => setEntity(e.target.value)}
                            placeholder="请补充"
                            autoSize={{
                                minRows: 3,
                            }}
                        />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <h3>请对CT影像解析进行评价:</h3>
                        <Rate allowHalf value={rate} onChange={setRate}/>
                    </div>
                    <Button onClick={handlePreviousStep} style={{ marginRight: '8px', marginTop: '16px' }}>
                        上一步
                    </Button>
                    <Button onClick={handleNextStep} type="primary" style={{ marginTop: '16px' }}>
                        下一步
                    </Button>
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
                        onChange={(e) => setDisease(e.target.value)}
                        placeholder="请补充相关的疾病"
                        autoSize={{
                            minRows: 3,
                        }}
                    />
                    <h3>知识图谱子图:</h3>
                    <div style={{ marginTop: '16px', height: '400px' }}>
                        <CytoscapeComponent
                            elements={elements}
                            style={{ width: '100%', height: '400px' }}
                            layout={{
                                name: 'cose',
                                idealEdgeLength: 100,
                                nodeOverlap: 20,
                                refresh: 20,
                                fit: true,
                                padding: 30,
                                randomize: false,
                                componentSpacing: 100,
                                nodeRepulsion: 400000,
                                edgeElasticity: 100,
                                nestingFactor: 5,
                                gravity: 80,
                                numIter: 1000,
                                initialTemp: 200,
                                coolingFactor: 0.95,
                                minTemp: 1.0
                            }}
                            stylesheet={[
                                {
                                    selector: 'node',
                                    style: {
                                        label: 'data(label)',
                                        'text-wrap': 'wrap',
                                        'text-max-width': '80px',
                                        'text-valign': 'center',
                                        'text-halign': 'center',
                                        'background-color': '#6FA8DC',
                                        'font-size': '12px',
                                        'shape': 'round-rectangle',
                                        'width': 'label',
                                        'height': 'label',
                                        'padding': '10px'
                                    }
                                },
                                {
                                    selector: 'edge',
                                    style: {
                                        width: 2,
                                        'line-color': '#ccc',
                                        'target-arrow-color': '#ccc',
                                        'target-arrow-shape': 'triangle',
                                        'curve-style': 'bezier'
                                    }
                                }
                            ]}
                        />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <h3>请对查找到的相关疾病进行评价:</h3>
                        <Rate allowHalf value={rate} onChange={setRate}/>
                    </div>
                    <Button onClick={handlePreviousStep} style={{ marginRight: '8px', marginTop: '16px' }}>
                        上一步
                    </Button>
                    <Button onClick={handleNextStep} type="primary" style={{ marginTop: '16px' }}>
                        下一步
                    </Button>
                </div>
            ),
        },
        {
            title: '报告',
            content: (
                <div style={{ marginTop: '16px' }}>
                    <h3>更新后子图:</h3>
                    <div style={{ marginTop: '16px', height: '400px' }}>
                        <CytoscapeComponent
                            elements={elements}
                            style={{ width: '100%', height: '400px' }}
                            layout={{
                                name: 'cose',
                                idealEdgeLength: 100,
                                nodeOverlap: 20,
                                refresh: 20,
                                fit: true,
                                padding: 30,
                                randomize: false,
                                componentSpacing: 100,
                                nodeRepulsion: 400000,
                                edgeElasticity: 100,
                                nestingFactor: 5,
                                gravity: 80,
                                numIter: 1000,
                                initialTemp: 200,
                                coolingFactor: 0.95,
                                minTemp: 1.0
                            }}
                            stylesheet={[
                                {
                                    selector: 'node',
                                    style: {
                                        label: 'data(label)',
                                        'text-wrap': 'wrap',
                                        'text-max-width': '80px',
                                        'text-valign': 'center',
                                        'text-halign': 'center',
                                        'background-color': '#6FA8DC',
                                        'font-size': '12px',
                                        'shape': 'round-rectangle',
                                        'width': 'label',
                                        'height': 'label',
                                        'padding': '10px'
                                    }
                                },
                                {
                                    selector: 'edge',
                                    style: {
                                        width: 2,
                                        'line-color': '#ccc',
                                        'target-arrow-color': '#ccc',
                                        'target-arrow-shape': 'triangle',
                                        'curve-style': 'bezier'
                                    }
                                }
                            ]}
                        />
                    </div>
                    <h3>报告:</h3>
                    <div
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: formatReport(report) }}
                        onInput={handleReportChange}
                        style={{ border: '1px solid #d9d9d9', padding: '8px', minHeight: '100px', whiteSpace: 'pre-wrap' }}
                    />
                    <div style={{ marginTop: '16px' }}>
                        <h3>请对生成的报告进行评价:</h3>
                        <Rate allowHalf value={rate} onChange={setRate}/>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <Button onClick={handlePreviousStep} style={{ marginRight: '8px' }}>
                                    上一步
                                </Button>
                                <Button onClick={handleDownload} style={{ marginRight: '8px' }}>
                                    下载 PDF
                                </Button>
                            </div>
                            <Button onClick={() => handleOk()} type="primary">
                                完成
                            </Button>
                        </div>
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

        if (type === 'image') {
            setTyping(true);
            appendMsg({
                type: 'text',
                content: { text: '看起来是个不错的图片哦^_^' },
                position: 'left',
                user: { avatar: botAvatar },
            });
            updatedMessages.push({
                type: 'text',
                content: { text: '看起来是个不错的图片哦^_^' },
                position: 'left',
                user: { avatar: botAvatar },
            });


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
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64Image = e.target.result;

                        // Display the image
                        appendMsg({
                            type: 'image',
                            content: {
                                picUrl: base64Image,
                            },
                            position: 'right',
                        });
                        updatedMessages.push({
                            type: 'image',
                            content: {
                                picUrl: base64Image,
                            },
                            position: 'right',
                        });

                        handleSend('image', file);
                    };
                    reader.readAsDataURL(file);
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
                    onCancel={handleCancel}
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
