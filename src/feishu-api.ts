import axios from 'axios';

const isDev = process.env.NODE_ENV === 'development'; // 兼容 Vite 环境变量

const apiClient = axios.create({
  baseURL: isDev ? '/feishu' : 'https://open.feishu.cn', // 本地用代理，生产用真实地址
});


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
        const response = await apiClient.get<getApprovalListByPhoneNumberResponse>(
            `/anycross/trigger/callback/MDJmYWJhYTcwYjc1YzA3Njk4MmUwZDIxODk0MGMyNjQ1?${queryParams}`
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
    const response = await apiClient.post(
      `/anycross/trigger/callback/MDVhNzVmNGQ2ZjRkM2EwYWExZTQyMzFjNTlkMzlhNzI3?${params}`
    );
    console.log('提交成功:', response.data);
  } catch (error) {
    console.error('提交失败:', error);
    throw error;
  }
}
