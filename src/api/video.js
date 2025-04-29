// 导入请求工具
import request from '@/utils/request.js';

// 创建视频上传函数
export const uploadVideoService = (file) => {
  // 创建 FormData 并添加视频文件
  const formData = new FormData();
  formData.append('video', file);

  // 使用 POST 请求上传视频
  return request.post('/file/uploadVideo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // 添加上传进度处理
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('上传进度：', percentCompleted);
    }
  });
}
