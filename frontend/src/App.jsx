import { useEffect, useRef, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import 'react-image-crop/dist/ReactCrop.css';
import { sendImageRequest, sendDataRequest } from './api/api';
import AppStyles from './components/AppStyles';
import CanvasArea from './components/CanvasArea';
import CategorySidebar from './components/CategorySidebar';
import Header from './components/Header';
import PropertiesPanel from './components/PropertiesPanel';
import ChatbotWidget from './components/ChatbotWidget';
import ToolSidebar from './components/ToolSidebar';
import FlowCanvas from './components/FlowCanvas';
import { buildBackendParams } from './utils/imageProcessing';
import { defaultParams, toolEndpointMap, toolGroups } from './utils/toolConfig';

const HISTORY_LIMIT = 25;
const ZOOM_STEP = 10;
const MIN_ZOOM = 25;
const MAX_ZOOM = 300;

export default function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');

  // Pipeline State
  const [filterPipeline, setFilterPipeline] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('origin');

  const [processedBlob, setProcessedBlob] = useState(null);
  const [processedPreview, setProcessedPreview] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(toolGroups[0].id);
  const [selectedTool, setSelectedTool] = useState(toolGroups[0].tools[0].id);

  const [originParams, setOriginParams] = useState(defaultParams);

  const [loading, setLoading] = useState(false);
  const [pipelineComputing, setPipelineComputing] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [zoom, setZoom] = useState(100);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const canvasRef = useRef(null);

  // Analysis / Extra states
  const [histogramData, setHistogramData] = useState(null);
  const [cnnResult, setCnnResult] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [autoIdentifyResult, setAutoIdentifyResult] = useState('');
  const [autoIdentifyEnabled, setAutoIdentifyEnabled] = useState(false);

  // FlowCanvas and Sidebar resizing
  const [flowCanvasHeight, setFlowCanvasHeight] = useState(160);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(224);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'application/octet-stream': ['.rle', '.huff'] },
    maxFiles: 1,
    noClick: !!originalPreview,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      let file = acceptedFiles[0];

      // If it's a custom binary format, intercept and decode first
      if (file.name.endsWith('.rle') || file.name.endsWith('.huff')) {
        setLoading(true);
        try {
          const { blob } = await sendImageRequest('/api/compression/decode', file, {});
          // Replace the file with the decoded PNG blob
          file = new File([blob], file.name.replace(/\.(rle|huff)$/, '.png'), { type: 'image/png' });
        } catch (e) {
          console.error("Failed to decode custom format", e);
          setLoading(false);
          return;
        }
        setLoading(false);
      }

      const imgUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = () => {
        // Calculate an appropriate initial zoom so large images fit the canvas automatically
        let initialZoom = 100;
        const estCanvasWidth = window.innerWidth - leftSidebarWidth - rightSidebarWidth - 100;
        const estCanvasHeight = window.innerHeight - flowCanvasHeight - 150;

        if (img.width > estCanvasWidth || img.height > estCanvasHeight) {
          const scaleX = estCanvasWidth / img.width;
          const scaleY = estCanvasHeight / img.height;
          // Scale down to fit, maintaining minimum zoom limit
          initialZoom = Math.max(MIN_ZOOM, Math.floor(Math.min(scaleX, scaleY) * 100));
        }

        setOriginParams({
          ...defaultParams,
          resizeWidth: img.width,
          resizeHeight: img.height,
        });
        setOriginalFile(file);
        setOriginalPreview(imgUrl);
        setProcessedPreview('');
        setProcessedBlob(null);
        setFilterPipeline([]);
        setSelectedNodeId('origin');
        setUndoStack([]);
        setRedoStack([]);
        setZoom(initialZoom);
        setHistogramData(null);
        setCnnResult(null);
        setAutoIdentifyResult('');
        if (autoIdentifyEnabled) {
          setAutoIdentifyResult('Identifying...');
          sendDataRequest('/api/chatbot/identify', file).then(res => {
            if (res && res.reply) setAutoIdentifyResult(res.reply);
            else setAutoIdentifyResult('');
          }).catch(err => {
            console.error("Auto identify failed", err);
            setAutoIdentifyResult('');
          });
        }
      };
      img.src = imgUrl;
    },
  });

  // Sidebar change -> select origin
  useEffect(() => {
    const category = toolGroups.find(g => g.id === selectedCategory);
    if (category && !category.tools.find(t => t.id === selectedTool)) {
      setSelectedTool(category.tools[0].id);
    }
    setSelectedNodeId('origin');
  }, [selectedCategory, selectedTool]);

  const activeCategory = toolGroups.find(g => g.id === selectedCategory);

  // Figure out what tool and params PropertiesPanel should show
  let currentActiveTool = null;
  let currentParams = defaultParams;

  if (selectedNodeId === 'origin') {
    currentActiveTool = activeCategory?.tools.find(t => t.id === selectedTool);
    currentParams = originParams;
  } else {
    const node = filterPipeline.find(n => n.id === selectedNodeId);
    if (node) {
      for (const group of toolGroups) {
        const found = group.tools.find(t => t.id === node.type);
        if (found) { currentActiveTool = found; break; }
      }
      currentParams = node.params;
    }
  }

  const handleParamsChange = (updater) => {
    if (selectedNodeId === 'origin') {
      setOriginParams(updater);
    } else {
      setFilterPipeline(prev => {
        const newPipeline = prev.map(n => {
          if (n.id === selectedNodeId) {
            const newParams = typeof updater === 'function' ? updater(n.params) : updater;
            return { ...n, params: newParams };
          }
          return n;
        });
        return newPipeline;
      });
    }
  };

  const createHistorySnapshot = (pipeline) => ({
    pipeline: JSON.parse(JSON.stringify(pipeline)),
    selectedNodeId
  });

  const pushHistorySnapshot = (pipeline) => {
    setUndoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), createHistorySnapshot(pipeline)]);
    setRedoStack([]);
  };

  useEffect(() => {
    setHistogramData(null);
    setCnnResult(null);
    setCompressionStats(null);
  }, [selectedNodeId, selectedTool]);

  // Pipeline Recomputation Logic
  const pipelineRef = useRef(filterPipeline);
  const recomputeTimeout = useRef(null);

  useEffect(() => {
    if (JSON.stringify(pipelineRef.current) === JSON.stringify(filterPipeline)) return;

    if (recomputeTimeout.current) clearTimeout(recomputeTimeout.current);

    recomputeTimeout.current = setTimeout(async () => {
      pipelineRef.current = filterPipeline;
      if (filterPipeline.length === 0) {
        setProcessedBlob(null);
        setProcessedPreview('');
        return;
      }

      setPipelineComputing(true);
      let currentBlob = originalFile;

      try {
        for (const node of filterPipeline) {
          const endpoint = toolEndpointMap[node.type];
          if (!endpoint) continue;

          const backendParams = buildBackendParams(node.type, node.params);
          const { blob, headers } = await sendImageRequest(endpoint, currentBlob, backendParams);
          currentBlob = blob;

          if (node.id === selectedNodeId && headers && headers['x-compression-stats']) {
            setCompressionStats(JSON.parse(headers['x-compression-stats']));
          }
        }
        setProcessedBlob(currentBlob);
        setProcessedPreview(URL.createObjectURL(currentBlob));
      } catch (err) {
        console.error("Pipeline recomputation failed", err);
      } finally {
        setPipelineComputing(false);
      }
    }, 400);

    return () => clearTimeout(recomputeTimeout.current);
  }, [filterPipeline, originalFile]);

  // Actions
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setOriginalFile(null);
    setOriginalPreview('');
    setProcessedPreview('');
    setProcessedBlob(null);
    setFilterPipeline([]);
    setSelectedNodeId('origin');
    setUndoStack([]);
    setRedoStack([]);
    setHistogramData(null);
    setCnnResult(null);
    setCompressionStats(null);
    setAutoIdentifyResult('');
    setZoom(100);
  };

  const handleReset = () => {
    pushHistorySnapshot(filterPipeline);
    setFilterPipeline([]);
    setSelectedNodeId('origin');
    setOriginParams(defaultParams);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), createHistorySnapshot(filterPipeline)]);
    setUndoStack(stack => stack.slice(0, -1));
    setFilterPipeline(previous.pipeline);
    setSelectedNodeId(previous.selectedNodeId);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), createHistorySnapshot(filterPipeline)]);
    setRedoStack(stack => stack.slice(0, -1));
    setFilterPipeline(next.pipeline);
    setSelectedNodeId(next.selectedNodeId);
  };

  const handleZoomOut = () => setZoom(value => Math.max(MIN_ZOOM, value - ZOOM_STEP));
  const handleZoomIn = () => setZoom(value => Math.min(MAX_ZOOM, value + ZOOM_STEP));

  const handleExport = (format) => {
    const targetBlob = processedBlob || originalFile;
    if (!targetBlob) return;
    setShowExportMenu(false);

    const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/bmp' };
    const extMap = { png: 'png', jpeg: 'jpg', bmp: 'bmp' };

    // Convert to target format using canvas so we get an exact Blob for download
    const src = processedPreview || originalPreview;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (format === 'bmp' || format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const quality = format === 'jpeg' ? (currentParams.jpegQuality || 92) / 100 : undefined;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mini-photoshop-export.${extMap[format]}`;
        a.click();
        URL.revokeObjectURL(url);
      }, mimeMap[format], quality);
    };
    img.src = src;
  };

  const handleAction = async () => {
    if (!originalFile || !currentActiveTool) return;
    const endpoint = toolEndpointMap[currentActiveTool.id];
    if (!endpoint) return;

    if (currentActiveTool.id.startsWith('histogram')) {
      setLoading(true);
      try {
        const fileToAnalyze = processedBlob ? new File([processedBlob], 'image.jpg') : originalFile;
        const data = await sendDataRequest(endpoint, fileToAnalyze, buildBackendParams(currentActiveTool.id, currentParams));
        setHistogramData(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
      return;
    }

    if (currentActiveTool.id.startsWith('cnn')) {
      setLoading(true);
      try {
        const fileToAnalyze = processedBlob ? new File([processedBlob], 'image.jpg') : originalFile;
        const backendParams = buildBackendParams(currentActiveTool.id, currentParams);
        const data = await sendDataRequest(endpoint, fileToAnalyze, backendParams);
        setCnnResult(data);
      } catch (e) { alert(e.response?.data?.detail || e.message); console.error(e); } finally { setLoading(false); }
      return;
    }

    const toolGroup = toolGroups.find(g => g.tools.some(t => t.id === currentActiveTool.id))?.id;

    if (toolGroup === 'compression') {
      setLoading(true);
      try {
        const fileToAnalyze = processedBlob ? new File([processedBlob], 'image.jpg') : originalFile;
        const backendParams = buildBackendParams(currentActiveTool.id, currentParams);
        const { headers } = await sendImageRequest(endpoint, fileToAnalyze, backendParams);
        if (headers && headers['x-compression-stats']) {
          setCompressionStats(JSON.parse(headers['x-compression-stats']));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
      return;
    }

    if (toolGroup === 'geometric') {
      setLoading(true);
      try {
        const fileToAnalyze = originalFile;
        const backendParams = buildBackendParams(currentActiveTool.id, currentParams);
        const { blob } = await sendImageRequest(endpoint, fileToAnalyze, backendParams);
        // Permanently apply geometric changes to the original file
        setOriginalFile(new File([blob], originalFile.name, { type: blob.type }));
        setOriginalPreview(URL.createObjectURL(blob));
        // Reset the pipeline because the original image changed dimensions/orientation
        setFilterPipeline([]);
        setSelectedNodeId('origin');
      } catch (e) { console.error(e); } finally { setLoading(false); }
      return;
    }

    // Everything else acts as a normal filter node in the pipeline
    if (selectedNodeId === 'origin') {
      pushHistorySnapshot(filterPipeline);
      const newNode = {
        id: Date.now().toString(),
        type: currentActiveTool.id,
        label: currentActiveTool.label,
        params: { ...currentParams },
        enabled: true,
      };

      setFilterPipeline(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    }
  };

  const handleRemoveNode = (id) => {
    pushHistorySnapshot(filterPipeline);
    setFilterPipeline(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId('origin');
  };

  const handleReorderNode = (fromIndex, toIndex) => {
    pushHistorySnapshot(filterPipeline);
    setFilterPipeline(prev => {
      const newPipeline = [...prev];
      const [movedItem] = newPipeline.splice(fromIndex, 1);
      newPipeline.splice(toIndex, 0, movedItem);
      return newPipeline;
    });
  };

  const startResizeFlowCanvas = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = flowCanvasHeight;

    const handleMouseMove = (e) => {
      const newHeight = Math.max(100, Math.min(startHeight - (e.clientY - startY), window.innerHeight * 0.6));
      setFlowCanvasHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResizeLeftSidebar = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftSidebarWidth;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(150, Math.min(startWidth + (e.clientX - startX), 400));
      setLeftSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResizeRightSidebar = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightSidebarWidth;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(200, Math.min(startWidth - (e.clientX - startX), 500));
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isCropMode = selectedTool === 'crop';
  const cropState = {
    unit: 'px',
    x: currentParams.cropX,
    y: currentParams.cropY,
    width: currentParams.cropWidth,
    height: currentParams.cropHeight
  };

  const currentImageSrc = processedPreview || originalPreview;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-cyan-500/30">
      <Header
        originalFile={originalFile}
        originalPreview={originalPreview}
        processedPreview={processedPreview}
        loading={loading || pipelineComputing}
        showCompare={showCompare}
        setShowCompare={setShowCompare}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        onReset={handleReset}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoom={zoom}
        onZoomOut={handleZoomOut}
        onZoomIn={handleZoomIn}
        canZoomOut={zoom > MIN_ZOOM}
        canZoomIn={zoom < MAX_ZOOM}
        autoIdentifyEnabled={autoIdentifyEnabled}
        setAutoIdentifyEnabled={setAutoIdentifyEnabled}
      />

      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          toolGroups={toolGroups}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="relative flex shrink-0" style={{ width: leftSidebarWidth }}>
          <ToolSidebar
            activeCategory={activeCategory}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            width={leftSidebarWidth}
          />
          <div
            className="w-1.5 h-full cursor-col-resize bg-zinc-800/50 hover:bg-cyan-500/50 transition-colors absolute -right-0.5 z-50"
            onMouseDown={startResizeLeftSidebar}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <CanvasArea
            originalFile={originalFile}
            showCompare={showCompare}
            processedPreview={processedPreview}
            originalPreview={originalPreview}
            loading={loading || pipelineComputing}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            canvasRef={canvasRef}
            isCropMode={isCropMode}
            cropState={cropState}
            setParams={handleParamsChange}
            currentImageSrc={currentImageSrc}
            params={currentParams}
            onRemoveImage={handleRemoveImage}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            autoIdentifyResult={autoIdentifyResult}
          />
          {originalFile && (
            <div className="relative shrink-0 flex flex-col">
              <div
                className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800 hover:bg-cyan-500/80 cursor-row-resize z-10 transition-colors"
                onMouseDown={startResizeFlowCanvas}
                title="Drag to resize history canvas"
              />
              <FlowCanvas
                pipeline={filterPipeline}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onRemoveNode={handleRemoveNode}
                onReorder={handleReorderNode}
                height={flowCanvasHeight}
              />
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border-l border-zinc-800 flex flex-col relative z-20 shrink-0" style={{ width: rightSidebarWidth }}>
          <div
            className="w-1.5 h-full cursor-col-resize bg-zinc-800/50 hover:bg-cyan-500/50 transition-colors absolute top-0 -left-0.5 z-50"
            onMouseDown={startResizeRightSidebar}
          />
          <div className="h-12 border-b border-zinc-800/50 flex items-center px-4 shrink-0 bg-zinc-900/30">
            <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <FiSettings size={14} className="text-zinc-500" /> Properties
            </h2>
          </div>

          {currentActiveTool ? (
            <PropertiesPanel
              tool={currentActiveTool}
              params={currentParams}
              setParams={handleParamsChange}
              canvasRef={canvasRef}
              onApply={handleAction}
              loading={loading || pipelineComputing}
              histogramData={histogramData}
              cnnResult={cnnResult}
              compressionStats={compressionStats}
              isEditingNode={selectedNodeId !== 'origin'}
              originalFile={originalFile}
              currentImageSrc={currentImageSrc}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs italic">
              Select a tool to edit properties
            </div>
          )}
        </div>
      </div>

      <ChatbotWidget currentImageFile={originalFile} />
      <AppStyles />
    </div>
  );
}
