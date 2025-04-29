// 导入请求工具
import request from '@/utils/request.js';

// // 创建视频上传函数
// export const uploadVideoService = (file) => {
//   // 创建 FormData 并添加视频文件
//   const formData = new FormData();
//   formData.append('video', file);

//   // 使用 POST 请求上传视频
//   return request.post('/file/uploadVideo', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     },
//     // 添加上传进度处理
//     onUploadProgress: (progressEvent) => {
//       const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//       console.log('上传进度：', percentCompleted);
//     }
//   });
// }

// 上传视频文件
export const uploadVideo = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000  // 增加到120秒
  });
};

// 获取任务状态和结果
export const getTaskStatus = (taskId) => {
  return request.get(`/task/${taskId}`);
};

// 获取场景识别图片URL
export const getSceneImageUrl = (taskId, filename) => {
  return `${request.defaults.baseURL}/scene_image/${taskId}/${filename}`;
};

// 获取广告评估图片URL
export const getAdImageUrl = (taskId, filename) => {
  return `${request.defaults.baseURL}/ad_image/${taskId}/${filename}`;
};

// 提交广告区域选择信息
export const submitAdRegion = (taskId, adRegion, adType) => {
  return request.post(`/set_ad_region/${taskId}`, {
    ad_region: adRegion,
    ad_type: adType
  });
};

