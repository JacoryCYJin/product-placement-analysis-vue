import axios from 'axios';
import {ElMessage} from 'element-plus';

// 定义请求的基本配置
const baseURL = '/api';  // 设置公共的前缀

const instance = axios.create({baseURL});
export default instance;