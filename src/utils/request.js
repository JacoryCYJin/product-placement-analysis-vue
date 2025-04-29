import axios from 'axios';
import {ElMessage} from 'element-plus';

// 定义请求的基本配置
const baseURL = 'http://localhost:5000/api';  // 设置公共的前缀，根据API文档修改

const instance = axios.create({baseURL});

// 添加响应拦截器处理错误
instance.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API请求错误:', error);
    ElMessage.error(error.response?.data?.error || '服务器请求失败');
    return Promise.reject(error);
  }
);

export default instance;