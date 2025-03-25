import axios from 'axios';

interface getApprovalListByPhoneNumberResponse {
    code: number,
    approvalList: any,
}

export async function getApprovalListByPhoneNumber(phoneNumber: string): Promise<any[]> {
    try {
        const queryParams = new URLSearchParams({
            key: 'getApprovalListByPhoneNumber',
            phoneNumber: phoneNumber, // 加入手机号参数
        });
        const response = await axios.get<getApprovalListByPhoneNumberResponse>(
            `/feishu/anycross/trigger/callback/MDJmYWJhYTcwYjc1YzA3Njk4MmUwZDIxODk0MGMyNjQ1?${queryParams}`
        );
        const approvalList = response.data.approvalList;
        return approvalList;
    } catch (error) {
        console.log(error);
        return [];
    }
}
export async function submitApproval(params: URLSearchParams): Promise<void> {
  try {
    const response = await axios.post(
      `/feishu/anycross/trigger/callback/MDVhNzVmNGQ2ZjRkM2EwYWExZTQyMzFjNTlkMzlhNzI3?${params}`
    );
    console.log('提交成功:', response.data);
  } catch (error) {
    console.error('提交失败:', error);
    throw error;
  }
}
