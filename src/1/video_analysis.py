import cv2
import torch
from torchvision import transforms
from torchvision.models import resnet50
from PIL import Image
import os
import requests
import numpy as np
import matplotlib.pyplot as plt
from sklearn.svm import SVR
import argparse
import json
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端，避免在后台线程中使用GUI

# 指定视频路径 - 直接在这里修改视频文件路径进行测试
VIDEO_PATH = '/Users/euygnehcnij/Study/School/项目/2024年大学生创新训练计划/小作坊/1.mp4'

class VideoAnalyzer:
    def __init__(self):
        print("初始化视频分析器...")
        # 设置设备
        self.device = torch.device('mps' if torch.backends.mps.is_available() else 
                                'cuda' if torch.cuda.is_available() else 'cpu')
        print(f"使用 {self.device} 进行推理")
        
        # 下载并加载模型和标签
        self.download_resources()
        
        # 读取类别标签
        with open('categories_places365.txt') as f:
            self.classes = [line.strip().split(' ')[0][3:] for line in f]
        
        # 加载场景识别模型
        self.scene_model = resnet50(num_classes=365)
        checkpoint = torch.load('resnet50_places365.pth.tar', map_location=self.device, weights_only=True)
        state_dict = {k.replace('module.', ''): v for k, v in checkpoint['state_dict'].items()}
        self.scene_model.load_state_dict(state_dict)
        self.scene_model.to(self.device)
        self.scene_model.eval()
        
        # 加载显著性预测模型
        self.saliency_model = resnet50(weights='IMAGENET1K_V1')
        self.saliency_model.to(self.device)
        self.saliency_model.eval()
        
        # 定义图像预处理步骤
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    
    def download_resources(self):
        """下载Places365类别标签文件和模型"""
        def download_file(url, filename):
            if not os.path.exists(filename):
                print(f"下载 {filename}...")
                response = requests.get(url)
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"{filename} 下载完成")
        
        download_file('https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt',
                     'categories_places365.txt')
        download_file("http://places2.csail.mit.edu/models_places365/resnet50_places365.pth.tar", 
                     'resnet50_places365.pth.tar')
    
    def analyze_video(self, video_path=None, frame_interval=30, save_all_frames=False):
        """分析视频，进行场景识别和广告评估"""
        if video_path is None:
            video_path = VIDEO_PATH
            
        print(f"开始分析视频: {video_path}")
        
        # 检查视频文件是否存在
        if not os.path.exists(video_path):
            print(f"视频文件不存在: {video_path}")
            return
        
        video = cv2.VideoCapture(video_path)
        frame_count = 0
        all_results = []
        
        # 创建输出目录
        basename = os.path.splitext(os.path.basename(video_path))[0]
        scene_output_dir = os.path.join('scene_results', basename)
        ad_output_dir = os.path.join('ad_results', basename)
        os.makedirs(scene_output_dir, exist_ok=True)
        os.makedirs(ad_output_dir, exist_ok=True)
        
        while video.isOpened():
            ret, frame = video.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 每隔一定帧数处理一次
            if frame_count % frame_interval == 0:
                print(f"\n处理第 {frame_count} 帧...")
                
                # 1. 场景识别
                img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                input_tensor = self.preprocess(img_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    output = self.scene_model(input_tensor)
                
                _, predicted = torch.max(output, 1)
                scene_label = self.classes[predicted.item()]
                
                # 保存带场景标签的帧
                labeled_frame = frame.copy()
                cv2.putText(labeled_frame, scene_label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
                scene_output_path = os.path.join(scene_output_dir, f'frame_{frame_count}.jpg')
                cv2.imwrite(scene_output_path, labeled_frame)
                print(f"场景识别结果: {scene_label}")
                
                # 2. 广告评估分析
                print("执行广告区域评估...")
                
                # 生成显著性图
                feature_maps = []
                def hook_fn(module, input, output):
                    feature_maps.append(output)
                
                hook = self.saliency_model.layer4.register_forward_hook(hook_fn)
                with torch.no_grad():
                    _ = self.saliency_model(input_tensor)
                hook.remove()
                
                feature_map = feature_maps[0].squeeze().sum(dim=0).cpu().numpy()
                feature_map = (feature_map - feature_map.min()) / (feature_map.max() - feature_map.min())
                saliency_map = cv2.resize(feature_map, (frame.shape[1], frame.shape[0]))
                
                # 提取广告区域
                ad_region, ad_coords, ad_mask = self.extract_ad_region(frame, saliency_map)
                
                if ad_coords:
                    # 计算评估指标
                    FA1, FA1_score = self.calculate_FA1(saliency_map, ad_coords)
                    FA2, FA2_score = self.calculate_FA2(frame, ad_region)
                    FA3, FA3_score = self.calculate_FA3(frame, ad_coords)
                    
                    # 计算总分
                    weights = {"b": 20, "w1": 0.3, "w2": 0.3, "w3": 0.4}
                    b = weights["b"]
                    w1 = weights["w1"]
                    w2 = weights["w2"]
                    w3 = weights["w3"]
                    final_score = b + w1 * FA1_score + w2 * FA2_score + w3 * FA3_score
                    
                    # 可视化结果
                    self.visualize_ad_results(frame, saliency_map, ad_mask, ad_coords, 
                                            FA1_score, FA2_score, FA3_score, final_score, 
                                            scene_label, frame_count, ad_output_dir)
                    
                    frame_result = {
                        "frame": frame_count,
                        "scene": scene_label,
                        "FA1": FA1_score,
                        "FA2": FA2_score,
                        "FA3": FA3_score,
                        "score": final_score
                    }
                    all_results.append(frame_result)
                    print(f"广告评估完成，总评分: {final_score:.2f}")
                else:
                    print("未检测到显著广告区域")
                
                # 如果不保存所有帧，只保留最后的结果
                if not save_all_frames and len(all_results) > 1:
                    all_results = [all_results[-1]]
        
        # 释放视频对象
        video.release()
        cv2.destroyAllWindows()
        
        print("\n===== 分析总结 =====")
        if all_results:
            # 打印最后一帧的结果
            last_result = all_results[-1]
            print(f"视频场景: {last_result['scene']}")
            print(f"FA1 (广告区域显著性比值): {last_result['FA1']:.2f}")
            print(f"FA2 (色彩差异): {last_result['FA2']:.2f}")
            print(f"FA3 (广告位置与面积): {last_result['FA3']:.2f}")
            print(f"总评分: {last_result['score']:.2f}")
            print(f"\n详细结果可在以下目录查看:")
            print(f"场景识别结果: {scene_output_dir}")
            print(f"广告评估结果: {ad_output_dir}")
        else:
            print("未能完成分析，请检查视频内容或调整参数")
    
    def extract_ad_region(self, image, saliency_map, threshold=0.7, manual_region=None):
        """提取广告区域（用户指定区域）"""
        # 如果用户提供了手动选择的区域，直接使用它
        if manual_region is not None:
            x = manual_region['x']
            y = manual_region['y']
            w = manual_region['width']
            h = manual_region['height']
            
            # 确保坐标在图像范围内
            x = max(0, min(x, image.shape[1] - 1))
            y = max(0, min(y, image.shape[0] - 1))
            w = max(1, min(w, image.shape[1] - x))
            h = max(1, min(h, image.shape[0] - y))
            
            ad_region = image[y:y+h, x:x+w]
            ad_mask = np.zeros_like(image)
            ad_mask[y:y+h, x:x+w] = image[y:y+h, x:x+w]
            
            print(f"使用用户指定的广告区域: x={x}, y={y}, w={w}, h={h}")
            return ad_region, (x, y, w, h), ad_mask
        
        # 如果没有指定区域，使用图像中心区域作为默认
        # 这仅作为后备方案，通常不会使用到
        height, width = image.shape[:2]
        center_x = width // 2
        center_y = height // 2
        w = width // 3
        h = height // 3
        x = center_x - w // 2
        y = center_y - h // 2
        
        ad_region = image[y:y+h, x:x+w]
        ad_mask = np.zeros_like(image)
        ad_mask[y:y+h, x:x+w] = image[y:y+h, x:x+w]
        
        print(f"使用默认中心区域: x={x}, y={y}, w={w}, h={h}")
        return ad_region, (x, y, w, h), ad_mask
    
    def calculate_FA1(self, saliency_map, ad_coords):
        """计算FA1（广告区域显著性比值）"""
        x, y, w, h = ad_coords
        ad_region_saliency = saliency_map[y:y+h, x:x+w]
        N_ad = np.sum(ad_region_saliency > 0.5)  # 广告区域显著像素数
        N_img = np.sum(saliency_map > 0.5)  # 整个图像显著像素数
        
        if N_img == 0:
            return 0, 40
        
        FA1 = N_ad / N_img
        
        # 映射到40-100分
        FA1_score = 40 + FA1 * 60
        
        return FA1, FA1_score
    
    def calculate_FA2(self, image, ad_region):
        """计算FA2（色彩差异）"""
        # 提取低级颜色特征（RGB直方图）
        def extract_color_features(img):
            hist_r = cv2.calcHist([img], [0], None, [8], [0, 256])
            hist_g = cv2.calcHist([img], [1], None, [8], [0, 256])
            hist_b = cv2.calcHist([img], [2], None, [8], [0, 256])
            return np.concatenate([hist_r.flatten(), hist_g.flatten(), hist_b.flatten()])
        
        # 提取高级特征
        def extract_high_level_features(img):
            # 使用边缘检测作为高级特征示例
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if len(img.shape) == 3 else img
            edges = cv2.Canny(gray, 100, 200)
            hist_edges = cv2.calcHist([edges], [0], None, [8], [0, 256])
            return hist_edges.flatten()
        
        # 提取广告区域特征
        ad_low_features = extract_color_features(ad_region)
        ad_high_features = extract_high_level_features(ad_region)
        
        # 提取非广告区域特征
        non_ad_low_features = extract_color_features(image)
        non_ad_high_features = extract_high_level_features(image)
        
        # 计算欧氏距离
        f_ad = np.concatenate([ad_low_features, ad_high_features])
        f_non = np.concatenate([non_ad_low_features, non_ad_high_features])
        
        FA2 = np.linalg.norm(f_ad - f_non)
        
        # 标准化得到0-100的分数
        FA2_score = min(100, max(0, FA2 / 10 * 100))
        
        return FA2, FA2_score
    
    def calculate_FA3(self, image, ad_coords):
        """计算FA3（广告位置与面积）"""
        img_height, img_width = image.shape[:2]
        x, y, w, h = ad_coords
        
        # 计算广告中心
        ad_center_x = x + w // 2
        ad_center_y = y + h // 2
        
        # 计算图像中心
        img_center_x = img_width // 2
        img_center_y = img_height // 2
        
        # 计算中心距离 D_c
        D_c = np.sqrt((ad_center_x - img_center_x)**2 + (ad_center_y - img_center_y)**2)
        
        # 归一化距离
        D_c_norm = D_c / np.sqrt(img_width**2 + img_height**2)
        
        # 计算广告面积 A_ad
        A_ad = w * h
        
        # 归一化面积
        A_ad_norm = A_ad / (img_width * img_height)
        
        # 距离越小越好，面积适中越好
        FA3 = (1 - D_c_norm) * 0.5 + (A_ad_norm if A_ad_norm < 0.5 else (1 - A_ad_norm)) * 0.5
        
        # 转换为0-100分
        FA3_score = FA3 * 100
        
        return FA3, FA3_score
    
    def visualize_ad_results(self, image, saliency_map, ad_mask, ad_coords, 
                          FA1_score, FA2_score, FA3_score, final_score,
                          scene_label, frame_count, output_dir, is_manual_region=False):
        """可视化广告评估结果"""
        x, y, w, h = ad_coords
        
        # 在原图上标出广告区域
        marked_image = image.copy()
        color = (0, 0, 255)  # 红色标记用户选择区域
        cv2.rectangle(marked_image, (x, y), (x+w, y+h), color, 2)
        
        # 创建热力图
        heatmap = cv2.applyColorMap((saliency_map * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap_overlay = cv2.addWeighted(image, 0.7, heatmap, 0.3, 0)
        
        # 创建结果展示图
        plt.figure(figsize=(16, 12))
        
        plt.subplot(2, 2, 1)
        plt.title(f'原始图像与广告区域 (场景: {scene_label})')
        plt.imshow(cv2.cvtColor(marked_image, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        
        plt.subplot(2, 2, 2)
        plt.title('显著性热力图')
        plt.imshow(cv2.cvtColor(heatmap_overlay, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        
        plt.subplot(2, 2, 3)
        plt.title('提取的广告区域')
        plt.imshow(cv2.cvtColor(ad_mask, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        
        plt.subplot(2, 2, 4)
        plt.title('评分结果')
        plt.text(0.1, 0.8, f'FA1 (广告区域显著性比值): {FA1_score:.2f}', fontsize=12)
        plt.text(0.1, 0.6, f'FA2 (色彩差异): {FA2_score:.2f}', fontsize=12)
        plt.text(0.1, 0.4, f'FA3 (广告位置与面积): {FA3_score:.2f}', fontsize=12)
        plt.text(0.1, 0.2, f'总评分: {final_score:.2f}', fontsize=14, fontweight='bold')
        plt.axis('off')
        
        plt.tight_layout()
        
        # 保存结果
        output_path = os.path.join(output_dir, f'frame_{frame_count}_evaluation.jpg')
        plt.savefig(output_path)
        plt.close()  # 确保关闭图形

    def analyze_video_for_api(self, video_path, frame_interval=30, save_all_frames=False, 
                             task_id=None, result_dir=None, progress_callback=None, ad_region=None):
        """分析视频，进行场景识别和广告评估，返回API友好的结果格式"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"视频文件不存在: {video_path}")
            
        print(f"开始分析视频: {video_path}")
        if ad_region:
            print(f"使用用户提供的广告区域: {ad_region}")
        else:
            print("未提供广告区域，将使用默认区域")
        
        video = cv2.VideoCapture(video_path)
        if not video.isOpened():
            raise Exception("无法打开视频文件")
            
        # 获取视频总帧数
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = video.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        frame_count = 0
        all_results = []
        
        # 创建输出目录
        basename = os.path.splitext(os.path.basename(video_path))[0]
        scene_output_dir = os.path.join('scene_results', basename)
        ad_output_dir = os.path.join('ad_results', basename)
        os.makedirs(scene_output_dir, exist_ok=True)
        os.makedirs(ad_output_dir, exist_ok=True)
        
        while video.isOpened():
            ret, frame = video.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 更新进度
            if progress_callback and total_frames > 0:
                progress = min(100, int((frame_count / total_frames) * 100))
                progress_callback(progress)
            
            # 每隔一定帧数处理一次
            if frame_count % frame_interval == 0:
                print(f"\n处理第 {frame_count} 帧...")
                
                # 1. 场景识别
                img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                input_tensor = self.preprocess(img_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    output = self.scene_model(input_tensor)
                
                _, predicted = torch.max(output, 1)
                scene_label = self.classes[predicted.item()]
                
                # 保存带场景标签的帧
                labeled_frame = frame.copy()
                cv2.putText(labeled_frame, scene_label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
                scene_output_path = os.path.join(scene_output_dir, f'frame_{frame_count}.jpg')
                cv2.imwrite(scene_output_path, labeled_frame)
                print(f"场景识别结果: {scene_label}")
                
                # 2. 广告评估分析
                print("执行广告区域评估...")
                
                # 生成显著性图
                feature_maps = []
                def hook_fn(module, input, output):
                    feature_maps.append(output)
                
                hook = self.saliency_model.layer4.register_forward_hook(hook_fn)
                with torch.no_grad():
                    _ = self.saliency_model(input_tensor)
                hook.remove()
                
                feature_map = feature_maps[0].squeeze().sum(dim=0).cpu().numpy()
                feature_map = (feature_map - feature_map.min()) / (feature_map.max() - feature_map.min())
                saliency_map = cv2.resize(feature_map, (frame.shape[1], frame.shape[0]))
                
                # 使用用户选择的广告区域或默认区域
                manual_ad_region, manual_ad_coords, manual_ad_mask = self.extract_ad_region(
                    frame, saliency_map, manual_region=ad_region
                )
                
                # 初始化帧结果
                frame_result = {
                    "frame": frame_count,
                    "timestamp": frame_count / fps if fps > 0 else 0,
                    "scene": scene_label,
                    "scene_image": f"frame_{frame_count}.jpg"
                }
                
                # 处理用户指定的广告区域
                if manual_ad_coords:
                    # 计算评估指标
                    FA1, FA1_score = self.calculate_FA1(saliency_map, manual_ad_coords)
                    FA2, FA2_score = self.calculate_FA2(frame, manual_ad_region)
                    FA3, FA3_score = self.calculate_FA3(frame, manual_ad_coords)
                    
                    # 计算总分
                    weights = {"b": 20, "w1": 0.3, "w2": 0.3, "w3": 0.4}
                    b = weights["b"]
                    w1 = weights["w1"]
                    w2 = weights["w2"]
                    w3 = weights["w3"]
                    final_score = b + w1 * FA1_score + w2 * FA2_score + w3 * FA3_score
                    
                    # 可视化结果
                    self.visualize_ad_results(
                        frame, saliency_map, manual_ad_mask, manual_ad_coords, 
                        FA1_score, FA2_score, FA3_score, final_score, 
                        scene_label, frame_count, ad_output_dir
                    )
                    
                    # 更新帧结果
                    frame_result.update({
                        "ad_coords": {
                            "x": int(manual_ad_coords[0]), 
                            "y": int(manual_ad_coords[1]), 
                            "width": int(manual_ad_coords[2]), 
                            "height": int(manual_ad_coords[3])
                        },
                        "FA1": float(FA1_score),
                        "FA2": float(FA2_score),
                        "FA3": float(FA3_score),
                        "final_score": float(final_score),
                        "ad_image": f"frame_{frame_count}_evaluation.jpg"
                    })
                    all_results.append(frame_result)
                    print(f"广告评估完成，总评分: {final_score:.2f}")
                else:
                    # 没有检测到任何广告区域
                    frame_result["ad_detected"] = False
                    all_results.append(frame_result)
                    print("未能提取有效广告区域")
                
                # 如果不保存所有帧，只保留最后的结果
                if not save_all_frames and len(all_results) > 1 and not all_results[-1].get('ad_detected') is False:
                    all_results = [all_results[-1]]
        
        # 释放视频对象
        video.release()
        cv2.destroyAllWindows()
        
        if progress_callback:
            progress_callback(100)  # 完成
        
        # 如果没有结果，返回空结果
        if not all_results:
            return {
                "status": "no_results",
                "message": "未能分析视频，请检查视频内容",
                "video_info": {
                    "filename": os.path.basename(video_path),
                    "duration": duration,
                    "frame_count": total_frames,
                    "fps": fps
                }
            }
        
        # 取最后一个有广告的结果
        final_result = None
        for result in reversed(all_results):
            if 'ad_coords' in result:
                final_result = result
                break
        
        # 如果没有找到有广告的结果，使用最后一个结果
        if final_result is None and all_results:
            final_result = all_results[-1]
            final_result.update({
                "ad_detected": False,
                "FA1": 0,
                "FA2": 0,
                "FA3": 0,
                "final_score": 0
            })
        
        # 构建返回结果
        api_result = {
            "status": "success",
            "video_info": {
                "filename": os.path.basename(video_path),
                "duration": duration,
                "frame_count": total_frames,
                "fps": fps
            },
            "scene": final_result.get("scene", "unknown"),
            "ad_detected": 'ad_coords' in final_result,
            "FA1": final_result.get("FA1", 0),
            "FA2": final_result.get("FA2", 0),
            "FA3": final_result.get("FA3", 0),
            "final_score": final_result.get("final_score", 0),
            "analyzed_frames": len(all_results),
            "frame_details": all_results
        }
        
        # 如果指定了结果目录，保存结果JSON
        if result_dir:
            result_file = os.path.join(result_dir, 'analysis_result.json')
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(api_result, f, ensure_ascii=False, indent=2)
        
        return api_result

# 主函数
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='视频场景识别与广告评估')
    parser.add_argument('--video', type=str, default=VIDEO_PATH, help='输入视频路径')
    parser.add_argument('--interval', type=int, default=30, help='视频帧处理间隔')
    parser.add_argument('--save-all', action='store_true', help='保存所有处理帧的结果')
    args = parser.parse_args()
    
    analyzer = VideoAnalyzer()
    analyzer.analyze_video(args.video, args.interval, args.save_all) 