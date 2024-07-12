// App.js
import React, {useEffect, useState} from 'react';
import { Form, Input, Button, Card, Layout, Spin, List, Modal, message } from 'antd';
import ReactQuill from 'react-quill'; // 富文本编辑器
import 'react-quill/dist/quill.snow.css'; // 编辑器样式
import moment from 'moment'

const { Header, Content, Footer, Sider } = Layout;

// 编辑器组件
const TextEditor = ({ value, onChange }) => (
    <div>
        <ReactQuill
            value={value}
            onChange={onChange}
            placeholder="请输入影像诊断结果..."
        />
    </div>
);

// 医疗表单组件
function MedicalForm({ onFormSubmit }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // 模拟异步提交
            setTimeout(() => {
                onFormSubmit(values);
                message.success('提交成功！');
            }, 500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="App-form"
        >
            <Form.Item
                label="CT影像所见文本"
                name="ctDescription"
                rules={[{ required: true, message: '请输入CT影像所见文本!' }]}
            >
                <Input.TextArea />
            </Form.Item>
            <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        提交
                    </Button>
                </div>
            </Form.Item>
        </Form>
    );
}

// 历史记录项组件
function HistoryItem({ time, description, diagnosis, onEdit, onRemove }) {
    console.log(diagnosis)

    let editorContent = diagnosis

    const handleEditorChange = (content) => {
        editorContent = content;
    };

    // 当用户点击编辑完成按钮时调用
    const handleEditComplete = () => {
        onEdit(description, editorContent); // 调用父组件传递的函数，传入新的诊断文本
        console.log(editorContent)
    };

    const handleRemove = () => {
        onRemove();
    }

    return (
        <List.Item>
            <Card
                title={`历史记录 ${time}`}
                style={{ width: '100%' }}
                extra={[
                    <Button type="link" onClick={handleEditComplete} key="edit">编辑完成</Button>,
                    <Button type="link" danger onClick={handleRemove} key="remove">删除</Button>
                ]}
            >
                <p><strong>影像所见：</strong>{description}</p>
                <TextEditor value={diagnosis} onChange={handleEditorChange} />
            </Card>
        </List.Item>
    );
}

// 主应用组件
function App() {
    const [diagnosisResult, setDiagnosisResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ description: '', diagnosis: '' });

    useEffect(() => {
        // 从 localStorage 获取数据并设置到 history 状态中
        const storedData = localStorage.getItem("ctData");
        if (storedData) {
            setHistory(JSON.parse(storedData));
        }
    }, []);

    const handleFormSubmit = async (values) => {
        try {
            const response = await fetch('http://localhost:8080/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: values.ctDescription })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const diagnosis = data.answer;

            console.log(diagnosis)

            let updateHistory = [
                ...history,
                {
                    description: values.ctDescription,
                    diagnosis: diagnosis,
                    time: moment().format('YYYY-MM-DD HH:mm:ss')
                }
            ];

            updateHistory.sort((a, b) => new Date(b.time) - new Date(a.time));
            setHistory(updateHistory);
            console.log(updateHistory);
        } catch (error) {
            console.error('Error:', error);
        }
    };


    const showModal = (content) => {
        setModalContent(content);
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        // 更新历史记录逻辑
        const updatedHistory = history.map(item => {
            if (item.description === modalContent.description) {
                return { ...item, diagnosis: modalContent.diagnosis };
            }
            return item;
        });
        setHistory(updatedHistory);
        setModalContent({ description: '', diagnosis: '' });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setModalContent({ description: '', diagnosis: '' });
    };

    const handleHistoryItemEdit = (description, newDiagnosis, index) => {
        const updatedHistory = [...history];
        updatedHistory[index].diagnosis = newDiagnosis; // 更新对应项的诊断文本

        setHistory(updatedHistory); // 更新状态
        localStorage.setItem("ctData", JSON.stringify(updatedHistory));
        console.log(newDiagnosis)
    };

    const handleHistoryItemRemove = (index) => {
        const updatedHistory = history.filter((item, i) => i !== index); // 过滤掉要删除的项
        setHistory(updatedHistory); // 更新状态
        localStorage.setItem("ctData", JSON.stringify(updatedHistory));
        console.log(updatedHistory)
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#fff', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h2>医疗影像诊断应用</h2>
            </Header>
            <Content style={{ padding: '24px 24px 0' }}>
                <MedicalForm onFormSubmit={handleFormSubmit} />
                <List
                    itemLayout="horizontal"
                    pagination={{
                        position: "bottom",
                        align: "center",
                        pageSize: "5"
                    }}
                    dataSource={history}
                    renderItem={(item, index) => (
                        <HistoryItem
                            key={index}
                            time={item.time}
                            description={item.description}
                            diagnosis={item.diagnosis}
                            onEdit={(description, updatedDiagnosis) => handleHistoryItemEdit(description, updatedDiagnosis, index)}
                            onRemove={() => handleHistoryItemRemove(index)}
                        />
                    )}
                />
            </Content>
            <Footer style={{ textAlign: 'center', padding: '24px 0' }}>
                ©2024 医疗影像诊断应用
            </Footer>

        </Layout>
    );
}

export default App;