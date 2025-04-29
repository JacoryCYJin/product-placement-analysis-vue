import axios from 'axios';
import {ElMessage} from 'element-plus';

// 定义请求的基本配置
const baseURL = 'http://localhost:5001/api';  // 根据API文档修改基础URL

const instance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器
instance.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const response = error.response;
    if (response) {
      switch (response.status) {
        case 400:
          ElMessage.error('请求参数错误');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(`请求失败: ${response.data?.error || error.message}`);
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络设置');
    }
    return Promise.reject(error);
  }
);

export default instance;