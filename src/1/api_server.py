from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import json
from werkzeug.utils import secure_filename
import threading

# 导入视频分析类
from video_analysis import VideoAnalyzer

app = Flask(__name__)
CORS(app)  # 启用跨域请求支持

# 配置上传文件目录
UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# 初始化视频分析器(全局单例)
analyzer = VideoAnalyzer()

# 存储任务状态
tasks = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传视频文件接口"""
    if 'file' not in request.files:
        return jsonify({'error': '没有文件部分'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        # 生成唯一任务ID
        task_id = str(uuid.uuid4())
        
        # 安全地保存文件名
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{filename}")
        file.save(file_path)
        
        # 初始化任务状态
        tasks[task_id] = {
            'status': 'pending',
            'filename': filename,
            'file_path': file_path,
            'progress': 0,
            'result': None,
            'ad_region': None,  # 添加广告区域字段
            'ad_type': None     # 添加广告类型字段
        }
        
        return jsonify({
            'task_id': task_id,
            'message': '文件上传成功，请选择广告区域'
        })
    
    return jsonify({'error': '不支持的文件类型'}), 400

@app.route('/api/set_ad_region/<task_id>', methods=['POST'])
def set_ad_region(task_id):
    """设置广告区域接口"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    # 获取请求数据
    data = request.json
    if not data or 'ad_region' not in data:
        return jsonify({'error': '请求数据不完整'}), 400
    
    # 更新任务状态
    tasks[task_id]['ad_region'] = data['ad_region']
    tasks[task_id]['ad_type'] = data.get('ad_type', '未指定')
    
    # 启动后台分析线程
    thread = threading.Thread(target=process_video, args=(task_id, tasks[task_id]['file_path']))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'status': 'success',
        'message': '广告区域设置成功，开始分析'
    })

def process_video(task_id, video_path):
    """后台处理视频的函数"""
    try:
        tasks[task_id]['status'] = 'processing'
        
        # 创建任务结果目录
        task_result_dir = os.path.join(RESULT_FOLDER, task_id)
        os.makedirs(task_result_dir, exist_ok=True)
        
        # 分析视频
        ad_region = tasks[task_id].get('ad_region')
        
        result = analyzer.analyze_video_for_api(
            video_path=video_path,
            frame_interval=30,
            save_all_frames=False,
            task_id=task_id,
            result_dir=task_result_dir,
            progress_callback=lambda p: update_progress(task_id, p),
            ad_region=ad_region  # 传递广告区域
        )
        
        # 保存结果
        result_file = os.path.join(task_result_dir, 'result.json')
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 更新任务状态
        tasks[task_id]['status'] = 'completed'
        tasks[task_id]['result'] = result
        tasks[task_id]['result_path'] = result_file
        tasks[task_id]['scene_images'] = [f for f in os.listdir(os.path.join('scene_results', os.path.splitext(os.path.basename(video_path))[0])) 
                                         if f.endswith('.jpg')]
        tasks[task_id]['ad_images'] = [f for f in os.listdir(os.path.join('ad_results', os.path.splitext(os.path.basename(video_path))[0])) 
                                      if f.endswith('.jpg')]
        
    except Exception as e:
        tasks[task_id]['status'] = 'failed'
        tasks[task_id]['error'] = str(e)
        print(f"处理视频失败: {str(e)}")

def update_progress(task_id, progress):
    """更新任务进度"""
    if task_id in tasks:
        tasks[task_id]['progress'] = progress

@app.route('/api/task/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """获取任务状态接口"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    task = tasks[task_id]
    response = {
        'task_id': task_id,
        'status': task['status'],
        'progress': task['progress'],
        'filename': task['filename']
    }
    
    # 如果任务完成，添加结果信息
    if task['status'] == 'completed' and task['result']:
        response['result_summary'] = {
            'scene': task['result']['scene'],
            'scores': {
                'FA1': task['result']['FA1'],
                'FA2': task['result']['FA2'],
                'FA3': task['result']['FA3'],
                'final_score': task['result']['final_score']
            }
        }
        
        # 返回格式化的图像路径
        scene_images = task.get('scene_images', [])
        ad_images = task.get('ad_images', [])
        
        # 将图像路径格式化为所需格式
        formatted_scene_images = [f"scene_results/1/{img}" for img in scene_images]
        formatted_ad_images = [f"ad_results/1/{img}" for img in ad_images]
        
        response['scene_images'] = formatted_scene_images
        response['ad_images'] = formatted_ad_images
    
    # 如果任务失败，添加错误信息
    if task['status'] == 'failed':
        response['error'] = task.get('error', '未知错误')
    
    return jsonify(response)

@app.route('/api/scene_image/<task_id>/<filename>', methods=['GET'])
def get_scene_image(task_id, filename):
    """获取场景识别结果图片"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    basename = os.path.splitext(os.path.basename(tasks[task_id]['file_path']))[0]
    image_path = os.path.join('scene_results', basename, filename)
    
    if not os.path.exists(image_path):
        return jsonify({'error': '图片不存在'}), 404
    
    return send_file(image_path, mimetype='image/jpeg')

@app.route('/api/ad_image/<task_id>/<filename>', methods=['GET'])
def get_ad_image(task_id, filename):
    """获取广告评估结果图片"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    basename = os.path.splitext(os.path.basename(tasks[task_id]['file_path']))[0]
    image_path = os.path.join('ad_results', basename, filename)
    
    if not os.path.exists(image_path):
        return jsonify({'error': '图片不存在'}), 404
    
    return send_file(image_path, mimetype='image/jpeg')

@app.route('/api/tasks', methods=['GET'])
def get_all_tasks():
    """获取所有任务列表"""
    task_list = []
    for task_id, task in tasks.items():
        task_info = {
            'task_id': task_id,
            'status': task['status'],
            'filename': task['filename'],
            'progress': task['progress']
        }
        task_list.append(task_info)
    
    return jsonify(task_list)

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'ok', 'message': '服务运行正常'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 