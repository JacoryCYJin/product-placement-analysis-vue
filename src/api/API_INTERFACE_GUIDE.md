# 视频广告评估系统API接口说明

## 基础信息

- **API基础URL**: `http://localhost:5001/api`
- **支持格式**: JSON
- **视频格式**: mp4, avi, mov, mkv

## 主要接口

### 1. 上传视频

**请求**:
- **URL**: `/upload`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**: 
  - `file`: 视频文件

**响应**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "文件上传成功，开始分析"
}
```

### 2. 获取任务状态和结果

**请求**:
- **URL**: `/task/{task_id}`
- **方法**: `GET`
- **参数**: 无

**处理中的响应**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45,
  "filename": "myvideo.mp4"
}
```

**完成的响应**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "filename": "myvideo.mp4",
  "result_summary": {
    "scene": "office",            // 场景识别结果
    "scores": {
      "FA1": 75.2,                // 显著性评分
      "FA2": 62.8,                // 色彩差异评分
      "FA3": 88.5,                // 位置面积评分
      "final_score": 76.3         // 总评分
    }
  },
  "scene_images": [               // 场景识别结果图片路径
    "scene_results/1/frame_30.jpg", 
    "scene_results/1/frame_60.jpg"
  ],
  "ad_images": [                  // 广告评估结果图片路径
    "ad_results/1/frame_30_evaluation.jpg", 
    "ad_results/1/frame_60_evaluation.jpg"
  ]
}
```

### 3. 获取场景识别图片

**请求**:
- **URL**: `/scene_image/{task_id}/{filename}`
- **方法**: `GET`
- **参数**: 无

**响应**:
- 图片文件 (JPEG格式)

### 4. 获取广告评估图片

**请求**:
- **URL**: `/ad_image/{task_id}/{filename}`
- **方法**: `GET`
- **参数**: 无

**响应**:
- 图片文件 (JPEG格式)

## 使用流程

1. 调用上传接口发送视频文件
2. 获取返回的task_id
3. 定期调用任务状态接口查询进度
4. 当状态变为completed时，从响应中获取:
   - 场景识别结果 (`result_summary.scene`)
   - 各项评分和总评分 (`result_summary.scores`)
   - 场景图片和广告评估图片路径
5. 使用图片路径调用图片获取接口显示结果图

## 错误处理

所有接口在出错时会返回相应的HTTP状态码和错误信息：

```json
{
  "error": "错误描述信息"
}
```

常见HTTP状态码:
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

## 示例代码

```javascript
// 上传视频
const formData = new FormData();
formData.append('file', videoFile);

fetch('http://localhost:5001/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  const taskId = data.task_id;
  checkTaskStatus(taskId);
});

// 查询任务状态
function checkTaskStatus(taskId) {
  fetch(`http://localhost:5001/api/task/${taskId}`)
  .then(response => response.json())
  .then(data => {
    if (data.status === 'completed') {
      // 处理结果
      console.log("场景:", data.result_summary.scene);
      console.log("总评分:", data.result_summary.scores.final_score);
      
      // 显示图片
      const sceneImage = document.getElementById('sceneImage');
      const adImage = document.getElementById('adImage');
      
      if (data.scene_images.length > 0) {
        const sceneImagePath = data.scene_images[0];
        const parts = sceneImagePath.split('/');
        const filename = parts[parts.length - 1];
        sceneImage.src = `http://localhost:5001/api/scene_image/${taskId}/${filename}`;
      }
      
      if (data.ad_images.length > 0) {
        const adImagePath = data.ad_images[0];
        const parts = adImagePath.split('/');
        const filename = parts[parts.length - 1];
        adImage.src = `http://localhost:5001/api/ad_image/${taskId}/${filename}`;
      }
    } else if (data.status === 'processing') {
      // 更新进度
      console.log("进度:", data.progress, "%");
      // 继续轮询
      setTimeout(() => checkTaskStatus(taskId), 1000);
    } else {
      // 处理错误
      console.error("任务失败:", data.error);
    }
  });
}
```