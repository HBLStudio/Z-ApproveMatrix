import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Button, Input, message, Form, Card, Select, Row, Col } from 'antd';
import { getApprovalListByID, submitApproval } from './feishu-api';
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
  const [approvalList, setApprovalList] = useState<any[]>([]); // 审批列表
  const [selectedApprovalCode, setSelectedApprovalCode] = useState<string>(''); // 存储选中的 approval code
  const [fieldMetaList, setFieldMetaList] = useState<any[]>([]); // 多维表格字段
  const [childrenFields, setChildrenFields] = useState<{ id: string; name: string }[]>([]); // 审批表单字段
  const [showFieldList, setShowFieldList] = useState(false); // 控制字段列表的显示
  const [tableUserId, setTableUserId] = useState<any>(null); // 新增状态，存储 tableUserId
  const [info,setInfo] = useState<any>(null);

  useEffect(() => {
    const fn = async () => {
      const table = await bitable.base.getActiveTable();
      const fieldMetaList = await table.getFieldMetaList();

      const bridge = bitable.bridge;
      const userId = await bridge.getUserId(); // 获取当前用户的 ID
      setTableUserId(userId); // 更新 tableUserId

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
      });
    };

    fn();
  }, []);

  const fetchApprovalList = async () => {
    if (!tableUserId) {
      message.warning('用户ID获取失败，请稍后重试');
      return;
    }
    setInfo("获取审批列表中，请稍后...")
    const approvalList = await getApprovalListByID(tableUserId);
    setApprovalList(approvalList);
    if(approvalList.length>0){
      setInfo("获取审批列表成功")
    }else{
      setInfo("获取审批列表失败，请重试或联系管理员")
    }
  };
  // 提交选中的审批
  const handleSubmit = async () => {
    const table = await bitable.base.getActiveTable();
    const selection = await bitable.base.getSelection();
    const activeView = (await table.getActiveView()) as unknown as IGridView;
    const records = await activeView.getSelectedRecordIdList();

    if (records.length === 0) {
      message.warning('未选中任何记录');
      return;
    }

    const params = new URLSearchParams({
      approval_code: selectedApprovalCode,
      app_id: selection.baseId?.toString() || '',
      table_id: selection.tableId?.toString() || '',
      record_id: records.toString(),
      table_user_id: tableUserId,
    });

    const resp = submitApproval(params);
  };

  // 处理选择审批
  const handleSelectChange = (code: string) => {
    setSelectedApprovalCode(code);
    extractChildrenFields(code);
  };

  // 提取选中的审批表单字段
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

  // 匹配字段
  const matchFields = (): { tableField: any; approvalField: any }[] => {
    const matchedFields: { tableField: any; approvalField: any }[] = [];
    const unmatchedFields: { tableField: any; approvalField: any }[] = [];

    fieldMetaList.forEach((field) => {
      let matched = false;
      const cleanedFieldName = field.name.replace('审批字段-', '').trim();

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

    return [...matchedFields, ...unmatchedFields];
  };

  // 获取匹配的字段列表
  const matchedFields = matchFields();

  // 跳转到指定网址
  const handleRedirect = () => {
    window.location.href = `https://gtech-gd.feishu.cn/share/base/form/shrcnUWQRowT63dfENiPOGhXKIh?prefill_多维表格USERID=${tableUserId}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#f5f5f5', paddingTop: 20 }}>
      <Card title="表单" style={{ width: 600, padding: 16, borderRadius: 8, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <Form layout="vertical">
          <Button type="primary" onClick={fetchApprovalList} block>
            查询审批
          </Button>

          {info && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {info}
            </div>
          )}

          {approvalList.length > 0 && (
            <Form.Item label="选择审批">
              <Select onChange={handleSelectChange} placeholder="请选择审批">
                {approvalList.map((approval) => (
                  <Select.Option key={approval.code} value={approval.code}>
                    {approval.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>)}

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


          <div style={{ textAlign: 'center', marginTop: 16 }}>
            首次使用请 <a onClick={handleRedirect} style={{ color: '#1890ff', cursor: 'pointer' }}>点击此处</a> 提交ID
          </div>
        </Form>
      </Card>
    </div>
  );
}
