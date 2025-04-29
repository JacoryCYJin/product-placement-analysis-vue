import { ref, reactive } from 'vue'
import { ElMessage } from "element-plus";
import { uploadVideo, getTaskStatus, getSceneImageUrl, getAdImageUrl, submitAdRegion } from "@/api/video.js";

// 预设的广告类型选项
export const adTypeOptions = [
  { value: '产品', label: '产品广告' },
  { value: '服务', label: '服务广告' },
  { value: '品牌', label: '品牌广告' },
  { value: '零售', label: '零售广告' },
  { value: '教育', label: '教育广告' },
  { value: '医疗健康', label: '医疗健康广告' },
  { value: '科技', label: '科技广告' }
];

// 视频结果映射，每个视频名称对应多个可能的结果
const videoResultsMap = {
  "1.mp4": [
    {
      resultImage: "/src/assets/results/result1_1.jpg",
      scene: "办公室场景",
      description: "视频中出现办公室场景，产品展示效果良好。",
      score: 0.89
    },
    {
      resultImage: "/src/assets/results/result1_2.jpg",
      scene: "办公室场景",
      description: "办公室环境中产品摆放位置显眼，但品牌曝光时间略短。",
      score: 0.76
    },
    {
      resultImage: "/src/assets/results/result1_3.jpg",
      scene: "办公室场景",
      description: "办公室环境氛围真实，产品和场景融合自然，品牌露出时间充足。",
      score: 0.92
    }
  ],
  "6.mp4": [
    {
      resultImage: "/src/assets/results/result6_1.jpg",
      scene: "走廊场景",
      description: "走廊环境光线明亮，产品摆放位置适中，吸引过往人员注意。",
      score: 0.88
    },
    {
      resultImage: "/src/assets/results/result6_2.jpg",
      scene: "走廊场景",
      description: "通道展示区域视觉效果突出，但人流速度较快，观看时间有限。",
      score: 0.75
    },
    {
      resultImage: "/src/assets/results/result6_3.jpg",
      scene: "走廊场景",
      description: "走廊转角处产品布置合理，形成自然停留点，提高品牌曝光效果。",
      score: 0.91
    },
    {
      resultImage: "/src/assets/results/result6_4.jpg",
      scene: "走廊场景",
      description: "办公区走廊人流量大，产品展示层次分明，但与环境色调对比不足。",
      score: 0.82
    },
    {
      resultImage: "/src/assets/results/result6_5.jpg",
      scene: "走廊场景",
      description: "走廊壁挂广告位置适中，但尺寸偏小，从远处识别度较低。",
      score: 0.71
    },
    {
      resultImage: "/src/assets/results/result6_6.jpg",
      scene: "走廊场景",
      description: "连接区走廊灯光设计突出产品特性，营造专业氛围，提升品牌形象。",
      score: 0.87
    },
    {
      resultImage: "/src/assets/results/result6_7.jpg",
      scene: "走廊场景",
      description: "走廊展示点与休息区结合，增加用户停留时间，品牌信息传递更充分。",
      score: 0.89
    },
    {
      resultImage: "/src/assets/results/result6_8.jpg",
      scene: "走廊场景",
      description: "商业建筑主通道产品展示与导向标识结合，自然引导视线，效果显著。",
      score: 0.93
    },
    {
      resultImage: "/src/assets/results/result6_9.jpg",
      scene: "走廊场景",
      description: "走廊互动装置吸引用户参与，但产品信息传递不够直接，认知度有限。",
      score: 0.68
    },
    {
      resultImage: "/src/assets/results/result6_10.jpg",
      scene: "走廊场景",
      description: "办公走廊数字屏展示内容丰富，产品信息与环境信息交替呈现，平衡性好。",
      score: 0.84
    }
  ],
  "default": [
    {
      resultImage: "/src/assets/results/default_1.jpg",
      scene: "未识别场景",
      description: "视频中展示了产品使用场景，但场景类别不明确，建议优化场景选择。",
      score: 0.65
    },
    {
      resultImage: "/src/assets/results/default_2.jpg",
      scene: "混合场景",
      description: "多个场景快速切换，产品展示有连贯性，但单一场景曝光时间不足。",
      score: 0.71
    }
  ]
};

export const videoUrl = ref('');
export const isUploading = ref(false);
export const isProcessing = ref(false);
export const isSceneDetecting = ref(false);
export const uploadProgress = ref(0);
export const showResultImage = ref(false);
export const showSceneResult = ref(false);
export const showScore = ref(false);
export const resultImage = ref('');
export const sceneInfo = ref({
  scene: '',
  description: ''
});
export const scoreValue = ref(0);
export const scoresDetails = ref({
  FA1: 0,
  FA2: 0,
  FA3: 0
});
export const showScoreDetails = ref(false);

// 新增状态：框选相关
export const showAreaSelection = ref(false);
export const videoElement = ref(null);
export const canvasElement = ref(null);
export const selectionArea = reactive({
  startX: 0,
  startY: 0,
  width: 0,
  height: 0,
  isSelecting: false,
  completed: false
});
export const currentAdType = ref('');
export const customAdType = ref('');

// 任务相关状态
export const currentTaskId = ref('');
export const taskCompleted = ref(false);

// 添加在状态变量部分（大约在第116行左右，与其他状态变量放在一起）
export const adResultImage = ref('');
export const showAdResultImage = ref(false);

// 文件选择后的处理函数
export const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type.startsWith('video/')) {
    // 重置所有状态
    resetAllStates();
    
    // 创建视频URL用于预览
    videoUrl.value = URL.createObjectURL(file);
    ElMessage.success('视频选择成功！');
    
    // 开始上传
    isUploading.value = true;
    uploadProgress.value = 0;
    
    try {
      // 实际上传视频
      const response = await uploadVideo(file);
      
      if (response.data && response.data.task_id) {
        currentTaskId.value = response.data.task_id;
        ElMessage.success('上传成功！');
        isUploading.value = false;
        
        // 显示区域选择界面
        showAreaSelection.value = true;
        
        // 需要等待视频加载
        setTimeout(() => {
          // 初始化画布
          initCanvas();
        }, 500);
      }
    } catch (error) {
      resetAllStates();
      ElMessage.error('上传失败，请重试');
      console.error(error);
    }
  } else {
    ElMessage.error('请选择一个有效的视频文件');
  }
};

// 修改 initCanvas 函数，确保视频帧撑满画布
const initCanvas = () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  
  if (!video || !canvas) return;
  
  // 获取视频元素的显示尺寸
  const containerWidth = canvas.clientWidth;
  const containerHeight = canvas.clientHeight;
  
  // 设置画布的CSS尺寸和实际像素尺寸
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  
  // 绘制视频当前帧到画布
  const ctx = canvas.getContext('2d');
  
  // 设置定时器，每隔一段时间更新画布内容
  const updateCanvas = () => {
    if (showAreaSelection.value && video.readyState >= 2) {  // 确保视频已加载
      // 计算如何绘制视频以填满画布
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (videoAspect > canvasAspect) {
        // 视频更宽，以高度为基准
        drawHeight = canvas.height;
        drawWidth = video.videoWidth * (drawHeight / video.videoHeight);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // 视频更高，以宽度为基准
        drawWidth = canvas.width;
        drawHeight = video.videoHeight * (drawWidth / video.videoWidth);
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制视频帧，填满画布
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      
      // 如果有框选区域，重绘它
      if (selectionArea.width !== 0 && selectionArea.height !== 0) {
        drawSelectionOverlay();
      }
      
      requestAnimationFrame(updateCanvas);
    }
  };
  
  // 启动画布更新
  updateCanvas();
};

// 修改开始选择函数，修正鼠标位置计算
export const startSelection = (event) => {
  const canvas = canvasElement.value;
  if (!canvas || selectionArea.completed) return;
  
  const rect = canvas.getBoundingClientRect();
  
  // 计算鼠标在Canvas上的精确位置
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  selectionArea.startX = (event.clientX - rect.left) * scaleX;
  selectionArea.startY = (event.clientY - rect.top) * scaleY;
  selectionArea.width = 0;
  selectionArea.height = 0;
  selectionArea.isSelecting = true;
};

// 修改更新选择函数，修正鼠标位置计算
export const updateSelection = (event) => {
  if (!selectionArea.isSelecting) return;
  
  const canvas = canvasElement.value;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  
  // 计算鼠标在Canvas上的精确位置
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const currentX = (event.clientX - rect.left) * scaleX;
  const currentY = (event.clientY - rect.top) * scaleY;
  
  selectionArea.width = currentX - selectionArea.startX;
  selectionArea.height = currentY - selectionArea.startY;
};

// 完成框选
export const endSelection = () => {
  if (!selectionArea.isSelecting) return;
  
  selectionArea.isSelecting = false;
  
  // 确保选择区域有效
  if (Math.abs(selectionArea.width) > 20 && Math.abs(selectionArea.height) > 20) {
    selectionArea.completed = true;
    ElMessage.success('广告区域框选完成！请确保选择区域比广告实际范围稍大一些');
  }
};

// 绘制选择框
const drawSelectionOverlay = () => {
  const canvas = canvasElement.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // 绘制半透明的选择区域
  ctx.fillStyle = 'rgba(75, 135, 255, 0.3)';
  ctx.fillRect(
    selectionArea.startX, 
    selectionArea.startY, 
    selectionArea.width, 
    selectionArea.height
  );
  
  // 绘制边框
  ctx.strokeStyle = '#2356f6';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    selectionArea.startX, 
    selectionArea.startY, 
    selectionArea.width, 
    selectionArea.height
  );
};

// 重置选择
export const resetSelection = () => {
  selectionArea.startX = 0;
  selectionArea.startY = 0;
  selectionArea.width = 0;
  selectionArea.height = 0;
  selectionArea.isSelecting = false;
  selectionArea.completed = false;
  
  const canvas = canvasElement.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  ElMessage.info('已重置选择');
};

// 修改 submitSelection 函数，移除多余的处理中状态
export const submitSelection = async () => {
  // 验证是否完成了框选
  if (!selectionArea.completed) {
    ElMessage.warning('请先框选广告区域');
    return;
  }
  
  // 验证是否选择了广告类型
  const adType = currentAdType.value || customAdType.value;
  if (!adType) {
    ElMessage.warning('请选择或输入广告类型');
    return;
  }
  
  // 隐藏选择界面
  showAreaSelection.value = false;
  
  // 开始轮询任务状态
  isSceneDetecting.value = true;
  
  try {
    // 提取选择区域信息
    // 确保边界值正确（如果用户从右到左或从下到上拖动）
    let x = selectionArea.startX;
    let y = selectionArea.startY;
    let width = selectionArea.width;
    let height = selectionArea.height;
    
    // 处理负宽度和负高度的情况
    if (width < 0) {
      x = x + width;
      width = Math.abs(width);
    }
    
    if (height < 0) {
      y = y + height;
      height = Math.abs(height);
    }
    
    // 处理画布和视频的尺寸适配
    const canvas = canvasElement.value;
    const video = videoElement.value;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 将广告区域从画布坐标转换为视频坐标的比例
    const scaleX = video.videoWidth / canvasWidth;
    const scaleY = video.videoHeight / canvasHeight;
    
    // 转换后的广告区域坐标
    const adRegion = {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
      original_video_width: video.videoWidth,
      original_video_height: video.videoHeight
    };
    
    console.log('广告区域信息:', adRegion);
    console.log('广告类型:', adType);
    
    // 发送广告区域信息到后端
    await submitAdRegion(currentTaskId.value, adRegion, adType);
    ElMessage.success('区域设置已提交，开始分析');
  } catch (error) {
    console.error('提交广告区域信息失败:', error);
    ElMessage.error('提交广告区域信息失败，但仍将继续分析');
  }
  
  // 开始轮询检查任务状态
  pollTaskStatus();
};

// 轮询任务状态
const pollTaskStatus = async () => {
  if (!currentTaskId.value) {
    ElMessage.error('任务ID缺失');
    isSceneDetecting.value = false;
    return;
  }
  
  try {
    const response = await getTaskStatus(currentTaskId.value);
    const taskData = response.data;
    
    if (taskData.status === 'processing') {
      // 更新进度
      uploadProgress.value = taskData.progress || 0;
      
      // 继续轮询
      setTimeout(pollTaskStatus, 1000);
    } else if (taskData.status === 'completed') {
      // 任务完成，处理结果
      handleTaskCompleted(taskData);
    } else {
      // 任务失败
      ElMessage.error('分析任务失败');
      isSceneDetecting.value = false;
    }
  } catch (error) {
    console.error('获取任务状态失败:', error);
    ElMessage.error('获取任务状态失败');
    isSceneDetecting.value = false;
  }
};

// 处理任务完成
const handleTaskCompleted = (taskData) => {
  isSceneDetecting.value = false;
  
  console.log('任务完成，数据:', taskData);  // 添加日志帮助调试
  
  // 获取场景识别结果
  if (taskData.result_summary) {
    const scene = taskData.result_summary.scene;
    sceneInfo.value = {
      scene: getSceneDisplayName(scene),
      description: `${currentAdType.value || customAdType.value}广告：场景类型为${getSceneDisplayName(scene)}，广告内容与环境融合度良好。`
    };
    
    // 设置评分信息 - 只使用总评分
    if (taskData.result_summary.scores) {
      scoreValue.value = taskData.result_summary.scores.final_score / 100; // 转换为0-1范围
      
      // 设置详细评分
      scoresDetails.value = {
        FA1: taskData.result_summary.scores.FA1,
        FA2: taskData.result_summary.scores.FA2,
        FA3: taskData.result_summary.scores.FA3
      };
    }
    
    // 设置场景图片
    if (taskData.scene_images && taskData.scene_images.length > 0) {
      const sceneImagePath = taskData.scene_images[0];
      const filename = sceneImagePath.split('/').pop();
      resultImage.value = getSceneImageUrl(currentTaskId.value, filename);
      console.log('场景图片URL:', resultImage.value);
    }
    
    // 设置广告评估图片
    if (taskData.ad_images && taskData.ad_images.length > 0) {
      // 获取广告评估图片
      const adFilename = taskData.ad_images[0].split('/').pop();
      adResultImage.value = getAdImageUrl(currentTaskId.value, adFilename);
      showAdResultImage.value = true;
      console.log('广告评估图片URL:', adResultImage.value);
    }
    
    // 显示结果
    showResultImage.value = true;
    showSceneResult.value = true;
    
    // 300-500ms后显示评分
    setTimeout(() => {
      showScore.value = true;
      ElMessage.success('分析评分完成！');
    }, 300 + Math.random() * 200);
  } else {
    ElMessage.error('分析结果数据不完整');
  }
};

// 场景类型显示名称转换
const getSceneDisplayName = (sceneType) => {
  const sceneMap = {
    'office': '办公室场景',
    'classroom': '教室场景',
    'hospital': '医院场景',
    'corridor': '走廊场景',
    'restaurant': '餐厅场景',
    'home': '家庭场景',
    'outdoor': '户外场景',
    'shopping': '商场场景'
  };
  
  return sceneMap[sceneType] || sceneType;
};

// 重置所有状态的辅助函数
const resetAllStates = () => {
  isUploading.value = false;
  isProcessing.value = false;
  isSceneDetecting.value = false;
  showResultImage.value = false;
  showSceneResult.value = false;
  showScore.value = false;
  showAreaSelection.value = false;
  currentAdType.value = '';
  customAdType.value = '';
  currentTaskId.value = '';
  taskCompleted.value = false;
  adResultImage.value = '';
  showAdResultImage.value = false;
  showScoreDetails.value = false;
  resetSelection();
};

// 触发文件选择
export const triggerFileInput = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.onchange = handleFileChange;
  input.click();
};

// 在现有代码中添加一个新函数用于退出框选界面
export const exitAreaSelection = () => {
  showAreaSelection.value = false;
  resetSelection();
  ElMessage.info('已退出广告区域选择');
};