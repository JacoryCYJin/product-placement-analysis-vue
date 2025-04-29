<script setup>
import { 
  videoUrl, 
  handleFileChange, 
  triggerFileInput, 
  isUploading, 
  isProcessing,
  isSceneDetecting,  
  uploadProgress,
  showResultImage,
  showSceneResult,
  showScore,
  resultImage,
  sceneInfo,
  scoreValue,
  showAreaSelection,
  videoElement,
  canvasElement,
  startSelection,
  updateSelection,
  endSelection,
  resetSelection,
  submitSelection,
  adTypeOptions,
  currentAdType,
  customAdType,
  exitAreaSelection,
  taskStatus,
  resultImages
} from './home.js'
</script>

<template>
  <div class="container">
    <!-- 顶部区域：视频上传和预览 -->
    <el-row :gutter="20" class="top-section">
      <el-col :span="12">
        <div class="left">
          <h1>在线广告检测</h1>
          <span class="reminder">
            要开始在线广告检测，您不需要任何程序，只需单击下面的按钮即可。
          </span>
          <span class="reminder">
            为广告投放做准备。
          </span>
          <button class="cssbuttons-io-button" @click="triggerFileInput" 
                 :disabled="isUploading || isProcessing || isSceneDetecting || showAreaSelection">
            {{ isUploading ? '上传中...' : isProcessing ? '准备中...' : isSceneDetecting ? '检测中...' : '立即开始检测' }}
            <div class="icon">
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                  d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="right">
          <div class="videoUpload">
            <!-- 上传进度条 -->
            <el-progress 
              v-if="isUploading" 
              :percentage="uploadProgress" 
              :format="(p) => `上传进度：${p}%`"
              status="success"
            />
            
            <!-- 处理中状态 -->
            <div v-if="isProcessing" class="processing-status">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在准备视频分析，请稍候...</span>
            </div>
            
            <!-- 视频播放 -->
            <video 
              v-if="videoUrl" 
              ref="videoElement"
              controls 
              :src="videoUrl" 
              width="100%" 
              height="100%"
              :class="{ 'hide-controls': showAreaSelection }"
            ></video>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 区域选择界面 -->
    <div v-if="showAreaSelection" class="area-selection-overlay">
      <div class="area-selection-container">
        <div class="header">
          <h3>请框选广告区域并选择广告类型</h3>
          <button @click="exitAreaSelection" class="exit-button">×</button>
        </div>
        
        <div class="canvas-container">
          <video 
            ref="videoElement"
            :src="videoUrl" 
            style="position: absolute; width: 100%; height: 100%; object-fit: cover; opacity: 0; pointer-events: none;"
            autoplay
            loop
            muted
          ></video>
          <canvas 
            ref="canvasElement"
            @mousedown="startSelection"
            @mousemove="updateSelection"
            @mouseup="endSelection"
            @mouseleave="endSelection"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          ></canvas>
        </div>
        
        <div class="ad-type-selection">
          <div class="selection-row">
            <span class="label">广告类型：</span>
            <el-select v-model="currentAdType" placeholder="选择广告类型">
              <el-option
                v-for="item in adTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          
          <div class="selection-row">
            <span class="label">或自定义：</span>
            <el-input v-model="customAdType" placeholder="输入自定义广告类型"></el-input>
          </div>
        </div>
        
        <div class="action-buttons">
          <el-button @click="resetSelection">重新框选</el-button>
          <el-button type="primary" @click="submitSelection">确认并开始分析</el-button>
        </div>
      </div>
    </div>
    
    <!-- 结果区域 -->
    <el-row v-if="isSceneDetecting || showResultImage || showScore" class="result-row">
      <!-- 场景检测中状态 -->
      <el-col :span="24" v-if="isSceneDetecting">
        <div class="scene-detecting-container fade-in">
          <div class="detecting-animation">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div class="detecting-text">
            <h3>正在进行场景识别和内容分析</h3>
            <p>系统正在分析视频中的场景元素和广告内容，请稍候...</p>
            <p v-if="taskStatus.progress">处理进度: {{ taskStatus.progress }}%</p>
          </div>
        </div>
      </el-col>
      
      <!-- 检测结果图 -->
      <el-col :span="12" class="result-left" v-if="showResultImage">
        <div class="result-image-container" :class="{ 'fade-in': showResultImage }">
          <h3>检测结果图</h3>
          <img :src="resultImage" alt="检测结果" />
          
          <!-- 如果有多张结果图，添加缩略图查看 -->
          <div class="thumbnail-container" v-if="resultImages.length > 1">
            <div 
              v-for="(img, index) in resultImages" 
              :key="index"
              class="thumbnail"
              :class="{ 'active': img === resultImage }"
              @click="resultImage = img"
            >
              <img :src="img" alt="结果缩略图" />
            </div>
          </div>
        </div>
      </el-col>
      
      <!-- 右侧结果展示 -->
      <el-col :span="12" class="result-right" v-if="showSceneResult || showScore">
        <!-- 场景结果信息 -->
        <div class="scene-result-container" v-if="showSceneResult" :class="{ 'fade-in': showSceneResult }">
          <h3>场景识别结果</h3>
          <div class="scene-box">
            <div class="scene-type">{{ sceneInfo.scene }}</div>
            <div class="scene-description">{{ sceneInfo.description }}</div>
          </div>
        </div>
        
        <!-- 评分结果 -->
        <div class="score-container" v-if="showScore" :class="{ 'fade-in': showScore }">
          <h3>广告检测评分</h3>
          <div class="score-box">
            <div class="score-value">{{ (scoreValue * 100).toFixed(1) }}</div>
            <div class="score-label">分</div>
          </div>
          
          <!-- 添加详细评分 -->
          <div class="detailed-scores" v-if="taskStatus.result_summary && taskStatus.result_summary.scores">
            <div class="score-item">
              <span class="score-name">广告融合度 (FA1):</span>
              <span class="score-number">{{ taskStatus.result_summary.scores.FA1.toFixed(1) }}</span>
            </div>
            <div class="score-item">
              <span class="score-name">品牌露出度 (FA2):</span>
              <span class="score-number">{{ taskStatus.result_summary.scores.FA2.toFixed(1) }}</span>
            </div>
            <div class="score-item">
              <span class="score-name">场景适配度 (FA3):</span>
              <span class="score-number">{{ taskStatus.result_summary.scores.FA3.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
@import './home.scss';

// 区域选择相关样式
.area-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.area-selection-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }
    
    .exit-button {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: none;
      font-size: 24px;
      line-height: 1;
      color: #888;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover {
        color: #333;
        background: #f5f5f5;
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
  
  .canvas-container {
    position: relative;
    width: 100%;
    height: 450px;
    margin-bottom: 20px;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
  
  .ad-type-selection {
    margin-bottom: 20px;
    
    .selection-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      
      .label {
        width: 100px;
        color: #555;
      }
      
      .el-select, .el-input {
        flex: 1;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
}

.hide-controls::-webkit-media-controls {
  display: none !important;
}

.hide-controls {
  pointer-events: none;
}

// 添加缩略图样式
.thumbnail-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  
  .thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &.active {
      border-color: #2356f6;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

// 添加详细评分样式
.detailed-scores {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  
  .score-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    
    .score-name {
      color: #ddd;
    }
    
    .score-number {
      font-weight: 500;
      color: #fff;
    }
  }
}

.score-box {
  display: flex;
  align-items: baseline;
  
  .score-value {
    font-size: 64px;
    font-weight: bold;
    color: #fff;
    line-height: 1;
  }
  
  .score-label {
    margin-left: 5px;
    font-size: 20px;
    color: #ddd;
  }
}
</style>