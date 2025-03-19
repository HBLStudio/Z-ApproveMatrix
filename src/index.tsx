import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { bitable, IGridView } from '@lark-base-open/js-sdk';
import { Button, Input, message, Form, Card } from 'antd';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp />
  </React.StrictMode>
);

function LoadApp() {
  const [approvalCode, setApprovalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true); // 追踪手机号是否有效

  // 处理手机号输入（仅允许数字）
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只允许数字
    setPhoneNumber(value);
    setIsPhoneValid(value.length === 11); // 只有 11 位才是合法
  };

  // 提交请求
  const handleSubmit = async () => {
    if (!approvalCode.trim()) {
      message.warning('请输入审批 Code');
      return;
    }

    if (!isPhoneValid || phoneNumber.length !== 11) {
      message.warning('请输入有效的 11 位手机号');
      return;
    }

    // 重新获取选中的记录
    const table = await bitable.base.getActiveTable();
    const selection = await bitable.base.getSelection();
    const activeView = (await table.getActiveView()) as unknown as IGridView;
    const records = await activeView.getSelectedRecordIdList();

    if (records.length === 0) {
      message.warning('未选中任何记录');
      return;
    }

    // 构造 URL 参数
    const queryParams = new URLSearchParams({
      approval_code: approvalCode,
      app_id: selection.baseId?.toString() || '',
      table_id: selection.tableId?.toString() || '',
      record_id: records.toString(),
      phone_number: phoneNumber, // 加入手机号参数
    });

    const url = `https://open.feishu.cn/anycross/trigger/callback/MDVhNzVmNGQ2ZjRkM2EwYWExZTQyMzFjNTlkMzlhNzI3?${queryParams}`;

    const response = await fetch(url, { method: 'GET' });
    message.info(JSON.stringify(response))
    
    if (response.status === 200) {
      message.success('提交成功！');
    } else if (response.status === 403) {
      message.error('提交失败：无权限访问');
    } else {
      message.error(`请求失败，错误码：${response.status}`);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#f5f5f5', paddingTop: 20 }}>
      <Card title="审批提交" style={{ width: 400, padding: 16, borderRadius: 8, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <Form layout="vertical">
          <Form.Item label="审批 Code">
            <Input
              placeholder="请输入审批 Code"
              value={approvalCode}
              onChange={(e) => setApprovalCode(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="您的飞书账号手机号（仅用于发起审批）"
            validateStatus={isPhoneValid ? '' : 'error'}
            help={isPhoneValid ? '' : '请输入 11 位数字手机号'}
          >
            <Input
              placeholder="请输入您的飞书账号手机号"
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={11} // 限制最多输入 11 位
            />
          </Form.Item>

          <Button type="primary" onClick={handleSubmit} block>
            提交数据
          </Button>
        </Form>
      </Card>
    </div>
  );
}
