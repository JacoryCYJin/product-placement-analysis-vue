// 导入请求工具
import request from '@/utils/request.js';

/**
 * 上传视频文件到服务器进行分析
 * @param {File} file 视频文件对象
 * @param {Function} progressCallback 进度回调函数
 * @returns {Promise} 返回包含task_id的Promise
 */
export const uploadVideoService = (file, progressCallback) => {
  // 创建 FormData 并添加视频文件
  const formData = new FormData();
  formData.append('file', file);  // 注意：后端API要求参数名为'file'

  // 使用 POST 请求上传视频
  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // 添加上传进度处理
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (progressCallback) {
        progressCallback(percentCompleted);
      }
      console.log('上传进度：', percentCompleted);
    }
  });
};

/**
 * 获取任务状态和结果
 * @param {String} taskId 任务ID
 * @returns {Promise} 返回任务状态和结果的Promise
 */
export const getTaskStatus = (taskId) => {
  return request.get(`/task/${taskId}`);
};

/**
 * 获取所有任务列表
 * @returns {Promise} 返回所有任务列表的Promise
 */
export const getAllTasks = () => {
  return request.get('/tasks');
};

/**
 * 获取场景图片URL
 * @param {String} taskId 任务ID
 * @param {String} filename 图片文件名
 * @returns {String} 图片URL
 */
export const getSceneImageUrl = (taskId, filename) => {
  return `${request.defaults.baseURL}/scene_image/${taskId}/${filename}`;
};

/**
 * 获取广告评估图片URL
 * @param {String} taskId 任务ID
 * @param {String} filename 图片文件名
 * @returns {String} 图片URL
 */
export const getAdImageUrl = (taskId, filename) => {
  return `${request.defaults.baseURL}/ad_image/${taskId}/${filename}`;
};
