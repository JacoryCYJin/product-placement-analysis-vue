# 视频广告评估系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **支持格式**: JSON
- **认证方式**: 无 (可根据需要添加)

## API 端点

### 1. 上传视频

将视频文件上传到服务器进行分析。

- **URL**: `/upload`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `file`: 视频文件 (支持格式: mp4, avi, mov, mkv)

**请求示例**:
```javascript
const formData = new FormData();
formData.append('file', videoFile);

fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

**成功响应** (200 OK):
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "文件上传成功，开始分析"
}
```

**失败响应** (400 Bad Request):
```json
{
  "error": "不支持的文件类型"
}
```

### 2. 获取任务状态

查询视频分析任务的状态和结果。

- **URL**: `/task/<task_id>`
- **方法**: `GET`
- **URL参数**:
  - `task_id`: 任务ID (从上传接口返回)

**请求示例**:
```javascript
fetch('http://localhost:5000/api/task/550e8400-e29b-41d4-a716-446655440000')
.then(response => response.json())
.then(data => console.log(data));
```

**成功响应** (任务进行中):
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45,
  "filename": "myvideo.mp4"
}
```

**成功响应** (任务完成):
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "filename": "myvideo.mp4",
  "result_summary": {
    "scene": "office",
    "scores": {
      "FA1": 75.2,
      "FA2": 62.8,
      "FA3": 88.5,
      "final_score": 76.3
    }
  },
  "scene_images": ["frame_30.jpg", "frame_60.jpg", "frame_90.jpg"],
  "ad_images": ["frame_30_evaluation.jpg", "frame_60_evaluation.jpg", "frame_90_evaluation.jpg"]
}
```

**失败响应** (404 Not Found):
```json
{
  "error": "任务不存在"
}
```

### 3. 获取场景识别结果图片

获取场景识别生成的图像。

- **URL**: `/scene_image/<task_id>/<filename>`
- **方法**: `GET`
- **URL参数**:
  - `task_id`: 任务ID
  - `filename`: 图像文件名 (从任务状态接口返回的scene_images中获取)

**请求示例**:
```javascript
// 获取并显示图像
const img = document.getElementById('sceneImage');
img.src = `http://localhost:5000/api/scene_image/550e8400-e29b-41d4-a716-446655440000/frame_30.jpg`;
```

**成功响应**: 图像文件 (JPEG)

**失败响应** (404 Not Found):
```json
{
  "error": "图片不存在"
}
```

### 4. 获取广告评估结果图片

获取广告评估生成的图像。

- **URL**: `/ad_image/<task_id>/<filename>`
- **方法**: `GET`
- **URL参数**:
  - `task_id`: 任务ID
  - `filename`: 图像文件名 (从任务状态接口返回的ad_images中获取)

**请求示例**:
```javascript
// 获取并显示图像
const img = document.getElementById('adImage');
img.src = `http://localhost:5000/api/ad_image/550e8400-e29b-41d4-a716-446655440000/frame_30_evaluation.jpg`;
```

**成功响应**: 图像文件 (JPEG)

**失败响应** (404 Not Found):
```json
{
  "error": "图片不存在"
}
```

### 5. 获取所有任务列表

获取所有分析任务的列表。

- **URL**: `/tasks`
- **方法**: `GET`

**请求示例**:
```javascript
fetch('http://localhost:5000/api/tasks')
.then(response => response.json())
.then(data => console.log(data));
```

**成功响应**:
```json
[
  {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "filename": "video1.mp4",
    "progress": 100
  },
  {
    "task_id": "7397e8fa-b0c3-4b5e-af6e-5d1c6e9c0c0b",
    "status": "processing",
    "filename": "video2.mp4",
    "progress": 35
  }
]
```

### 6. 健康检查

检查API服务是否正常运行。

- **URL**: `/health`
- **方法**: `GET`

**请求示例**:
```javascript
fetch('http://localhost:5000/api/health')
.then(response => response.json())
.then(data => console.log(data));
```

**成功响应**:
```json
{
  "status": "ok",
  "message": "服务运行正常"
}
```

## 错误处理

所有API端点在发生错误时返回适当的HTTP状态码和错误消息。常见错误:

- **400 Bad Request**: 请求参数错误或不支持的文件类型
- **404 Not Found**: 请求的资源不存在
- **500 Internal Server Error**: 服务器内部错误

## 集成示例

### 视频上传与分析流程

```javascript
// 1. 上传视频
const videoFile = document.getElementById('videoInput').files[0];
const formData = new FormData();
formData.append('file', videoFile);

fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  const taskId = data.task_id;
  
  // 2. 定期检查任务状态
  const checkStatus = () => {
    fetch(`http://localhost:5000/api/task/${taskId}`)
    .then(response => response.json())
    .then(data => {
      // 更新进度条
      updateProgressBar(data.progress);
      
      if (data.status === 'completed') {
        // 3. 显示结果
        displayResults(data);
      } else if (data.status === 'failed') {
        // 处理错误
        displayError(data.error);
      } else {
        // 继续轮询
        setTimeout(checkStatus, 1000);
      }
    });
  };
  
  // 开始轮询
  checkStatus();
});

// 显示结果函数
function displayResults(data) {
  // 显示评分
  document.getElementById('finalScore').textContent = data.result_summary.scores.final_score.toFixed(2);
  document.getElementById('fa1Score').textContent = data.result_summary.scores.FA1.toFixed(2);
  document.getElementById('fa2Score').textContent = data.result_summary.scores.FA2.toFixed(2);
  document.getElementById('fa3Score').textContent = data.result_summary.scores.FA3.toFixed(2);
  
  // 显示场景类型
  document.getElementById('sceneType').textContent = data.result_summary.scene;
  
  // 加载最后一帧的图像
  const lastSceneImage = data.scene_images[data.scene_images.length - 1];
  const lastAdImage = data.ad_images[data.ad_images.length - 1];
  
  document.getElementById('sceneImage').src = `http://localhost:5000/api/scene_image/${data.task_id}/${lastSceneImage}`;
  document.getElementById('adImage').src = `http://localhost:5000/api/ad_image/${data.task_id}/${lastAdImage}`;
}
``` 