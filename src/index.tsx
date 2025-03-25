import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Button, Input, message, Form, Card, Select, Row, Col } from 'antd';
import { getApprovalListByPhoneNumber, submitApproval } from './feishu-api';
import { bitable, IGridView } from '@lark-base-open/js-sdk';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp />
  </React.StrictMode>
);
interface Field {
  id: string;
  name: string;
  matched: boolean;
}

function LoadApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true); // 追踪手机号是否有效
  const [approvalList, setApprovalList] = useState<any[]>([]); // 审批列表
  const [selectedApprovalCode, setSelectedApprovalCode] = useState<string>(''); // 存储选中的 approval code
  const [fieldMetaList, setFieldMetaList] = useState<any[]>([]); // 多维表格字段
  const [childrenFields, setChildrenFields] = useState<{ id: string; name: string }[]>([]); // 审批表单字段
  const [showFieldList, setShowFieldList] = useState(false); // 控制字段列表的显示

  useEffect(() => {
    const fn = async () => {
      const table = await bitable.base.getActiveTable();
      const fieldMetaList = await table.getFieldMetaList();
      // 筛选出 name 包含 "审批字段-" 的字段，并提取 id 和 name
      const filteredFields = fieldMetaList
        .filter(field => field.name.includes("审批字段-"))
        .map(field => ({ id: field.id, name: field.name }));
      setFieldMetaList(filteredFields);

      const off = table.onFieldModify((event) => {
        const fieldId = (event.data as { fieldId: string }).fieldId;
        table.getFieldMetaById(fieldId).then((fieldMeta) => {
          // 更新 fieldMetaList，修改对应的字段 name
          setFieldMetaList((prevList) =>
            prevList.map(field =>
              field.id === fieldId ? { ...field, name: fieldMeta.name } : field
            )
          );
        })
      })
    };

    fn();
  }, []);

  // 处理手机号输入（仅允许数字）
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只允许数字
    setPhoneNumber(value);
    setIsPhoneValid(value.length === 11); // 只有 11 位才是合法
  };

  // 提取选中审批的 children 字段
  const extractChildrenFields = (code: string) => {
    const selectedApproval = approvalList.find((item) => item.code === code);
    if (!selectedApproval || !selectedApproval.form) {
      setChildrenFields([]); // 如果找不到对应审批，清空
      setShowFieldList(false); // 隐藏字段列表
      return;
    }

    try {
      const formArray = JSON.parse(selectedApproval.form); // 解析 form JSON
      const filteredChildren = formArray.flatMap((field: any) => 
        field.children && Array.isArray(field.children) 
          ? field.children.map((child: any) => ({ id: child.id, name: child.name })) 
          : []
      );
      setChildrenFields(filteredChildren);
      setShowFieldList(true); // 显示字段列表
    } catch (error) {
      console.error(`解析失败: ${error}`);
      setChildrenFields([]);
      setShowFieldList(false); // 隐藏字段列表
    }
  };

  // 提交请求
  const handleQuery = async () => {
    if (!isPhoneValid || phoneNumber.length !== 11) {
      message.warning('请输入有效的 11 位手机号');
      return;
    }

    // 获取审批列表
    const approvalList = await getApprovalListByPhoneNumber(phoneNumber);

    setApprovalList(approvalList);
    message.info('查询成功')
  };

  const handleSubmit = async () => {
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
    const params = new URLSearchParams({
      approval_code: selectedApprovalCode,
      app_id: selection.baseId?.toString() || '',
      table_id: selection.tableId?.toString() || '',
      record_id: records.toString(),
      phone_number: phoneNumber, // 加入手机号参数
    });

    const resp = submitApproval(params);
  };

  // 选择下拉项时的处理
  const handleSelectChange = (code: string) => {
    setSelectedApprovalCode(code);
    extractChildrenFields(code);
  };

  // 匹配字段
  const matchFields = (): { tableField: any; approvalField: any }[] => {
    const matchedFields: { tableField: any; approvalField: any }[] = [];
    const unmatchedFields: { tableField: any; approvalField: any }[] = [];

    fieldMetaList.forEach((field) => {
      let matched = false;
      // 去除“审批字段-”前缀后再进行匹配
      const cleanedFieldName = field.name.replace('审批字段-', '').trim();

      // 尝试与每个审批字段匹配
      childrenFields.forEach((child) => {
        if (cleanedFieldName === child.name) {
          matchedFields.push({ tableField: field, approvalField: child });
          matched = true;
        }
      });

      if (!matched) {
        unmatchedFields.push({ tableField: field, approvalField: {} });
      }
    });

    // 按照匹配的字段排序，匹配的字段排在前面
    return [...matchedFields, ...unmatchedFields];
  };

  // 获取匹配的字段列表
  const matchedFields = matchFields();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#f5f5f5', paddingTop: 20 }}>
      <Card title="表单" style={{ width: 600, padding: 16, borderRadius: 8, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <Form layout="vertical">
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

          <Button type="primary" onClick={handleQuery} block>
            查询审批列表
          </Button>

          <Form.Item label="选择审批">
            <Select onChange={handleSelectChange} placeholder="请选择审批">
              {approvalList.map((approval) => (
                <Select.Option key={approval.code} value={approval.code}>
                  {approval.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {showFieldList && (
            <Form.Item label="字段匹配">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {matchedFields.map(({ tableField, approvalField }) => (
                    <div key={tableField.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>{tableField.name}</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {approvalField.name ? (
                          <span style={{ color: 'green' }}>✔️</span> // 已匹配
                        ) : (
                          <span style={{ color: 'red' }}>❌</span> // 未匹配
                        )}
                      </div>
                      <div style={{ flex: 1 }}>{approvalField.name || '无匹配字段'}</div>
                    </div>
                  ))}
                </Col>
              </Row>
            </Form.Item>
          )}

          {selectedApprovalCode && (
            <Button type="primary" onClick={handleSubmit} block>
              提交审批
            </Button>
          )}
        </Form>
      </Card>
    </div>
  );
}
