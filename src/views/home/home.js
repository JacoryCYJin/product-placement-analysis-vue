import { ref, reactive } from 'vue'
import { ElMessage } from "element-plus";

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

// 新增状态：框选相关
export const showAreaSelection = ref(false); // 是否显示区域选择界面
export const videoElement = ref(null); // 视频元素引用
export const canvasElement = ref(null); // 画布元素引用
export const selectionArea = reactive({ // 选择区域
  startX: 0,
  startY: 0,
  width: 0,
  height: 0,
  isSelecting: false,
  completed: false
});
export const currentAdType = ref(''); // 当前选择的广告类型
export const customAdType = ref(''); // 自定义的广告类型

// 添加新的状态变量来明确保存原始文件名
export const originalFileName = ref('');

// 文件选择后的处理函数
export const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type.startsWith('video/')) {
    // 重置所有状态
    resetAllStates();
    
    // 明确保存原始文件名
    originalFileName.value = file.name;
    console.log("保存的原始文件名:", originalFileName.value);
    
    // 创建视频URL用于预览
    videoUrl.value = URL.createObjectURL(file);
    ElMessage.success('视频选择成功！');
    
    // 模拟上传过程
    isUploading.value = true;
    uploadProgress.value = 0;
    
    try {
      // 模拟上传进度
      await simulateProgress(0, 100, 2000); // 2秒完成上传
      ElMessage.success('上传成功！');
      isUploading.value = false;
      
      // 显示区域选择界面
      showAreaSelection.value = true;
      
      // 需要等待视频加载
      setTimeout(() => {
        // 初始化画布
        initCanvas();
      }, 500);
      
    } catch (error) {
      resetAllStates();
      ElMessage.error('处理过程中出现错误，请重试');
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
    ElMessage.success('广告区域框选完成！');
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
  
  // 查找匹配的结果
  console.log("分析使用的原始文件名:", originalFileName.value);
  
  // 简单直接的匹配逻辑
  let matchedResults;
  
  // 查找包含特定数字的文件名
  if (originalFileName.value.includes("6")) {
    console.log("文件名包含'6'，使用走廊场景结果");
    matchedResults = videoResultsMap["6.mp4"];
  }
  else if (originalFileName.value.includes("1")) {
    console.log("文件名包含'1'，使用办公室场景结果");
    matchedResults = videoResultsMap["1.mp4"];
  }
  else {
    console.log("使用默认结果");
    matchedResults = videoResultsMap["default"] || [];
  }
  
  // 确保有结果可用
  if (!matchedResults || matchedResults.length === 0) {
    console.warn("没有找到匹配结果，使用备用结果");
    // 使用第一个可用的结果集作为备用
    const firstKey = Object.keys(videoResultsMap)[0];
    matchedResults = videoResultsMap[firstKey] || [];
  }
  
  const randomResult = getRandomResult(matchedResults);
  
  // 直接显示场景检测中状态，不显示准备中状态
  isSceneDetecting.value = true;
  
  // 5-10秒后显示检测结果图和场景识别
  const sceneDetectionDelay = 5000 + Math.random() * 5000; // 5-10秒随机延迟
  setTimeout(() => {
    isSceneDetecting.value = false; // 隐藏检测中状态
    
    // 显示检测结果和场景信息
    resultImage.value = randomResult.resultImage;
    sceneInfo.value = {
      scene: randomResult.scene,
      description: `${adType}广告：${randomResult.description}`
    };
    showResultImage.value = true;
    showSceneResult.value = true;
    
    // 300-500ms后显示广告监测评分
    const scoreDelay = 300 + Math.random() * 200; // 300-500ms随机延迟
    setTimeout(() => {
      scoreValue.value = randomResult.score;
      showScore.value = true;
      ElMessage.success('分析评分完成！');
    }, scoreDelay);
    
  }, sceneDetectionDelay);
};

// 从结果组中随机选择一个结果
const getRandomResult = (resultsArray) => {
  if (!resultsArray || resultsArray.length === 0) {
    return {
      resultImage: "/src/assets/results/default.jpg",
      scene: "未知场景",
      description: "无法分析视频内容，请尝试其他视频。",
      score: 0.5
    };
  }
  
  const randomIndex = Math.floor(Math.random() * resultsArray.length);
  return resultsArray[randomIndex];
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
  resetSelection();
};

// 模拟进度条
const simulateProgress = (start, end, duration) => {
  return new Promise((resolve) => {
    const interval = 100;
    const steps = duration / interval;
    const increment = (end - start) / steps;
    let current = start;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      uploadProgress.value = Math.min(Math.round(current), end);
      
      if (step >= steps) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
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