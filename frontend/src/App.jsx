import { useEffect, useRef, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import 'react-image-crop/dist/ReactCrop.css';
import { sendImageRequest } from './api/api';
import AppStyles from './components/AppStyles';
import CanvasArea from './components/CanvasArea';
import CategorySidebar from './components/CategorySidebar';
import Header from './components/Header';
import PropertiesPanel from './components/PropertiesPanel';
import ToolSidebar from './components/ToolSidebar';
import { buildBackendParams } from './utils/imageProcessing';
import { defaultParams, toolEndpointMap, toolGroups } from './utils/toolConfig';

const HISTORY_LIMIT = 25;
const ZOOM_STEP = 10;
const MIN_ZOOM = 25;
const MAX_ZOOM = 300;

function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [processedPreview, setProcessedPreview] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(toolGroups[0].id);
  const [selectedTool, setSelectedTool] = useState(toolGroups[0].tools[0].id);

  const [params, setParams] = useState(defaultParams);

  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const canvasRef = useRef(null);

  // Histogram compare state
  const [processedBlob, setProcessedBlob] = useState(null);
  const [originalHistogramUrl, setOriginalHistogramUrl] = useState('');
  const [processedHistogramUrl, setProcessedHistogramUrl] = useState('');
  const [histogramLoading, setHistogramLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: !!originalPreview,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setProcessedPreview('');
      setParams(defaultParams);
      setUndoStack([]);
      setRedoStack([]);
      setZoom(100);
    },
  });

  // Category change logic
  useEffect(() => {
    const category = toolGroups.find(g => g.id === selectedCategory);
    if (category && !category.tools.find(t => t.id === selectedTool)) {
      setSelectedTool(category.tools[0].id);
    }
  }, [selectedCategory]);

  const activeCategory = toolGroups.find(g => g.id === selectedCategory);
  const activeTool = activeCategory?.tools.find(t => t.id === selectedTool);

  const createHistorySnapshot = () => ({
    processedPreview,
    processedBlob,
    params,
    selectedCategory,
    selectedTool,
    showCompare,
  });

  const restoreHistorySnapshot = (snapshot) => {
    setProcessedPreview(snapshot.processedPreview);
    setProcessedBlob(snapshot.processedBlob);
    setParams(snapshot.params);
    setSelectedCategory(snapshot.selectedCategory);
    setSelectedTool(snapshot.selectedTool);
    setShowCompare(snapshot.showCompare);
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');
  };

  const pushHistorySnapshot = (snapshot) => {
    setUndoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), snapshot]);
    setRedoStack([]);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setOriginalFile(null);
    setOriginalPreview('');
    setProcessedPreview('');
    setProcessedBlob(null);
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');
    setShowCompare(false);
    setUndoStack([]);
    setRedoStack([]);
    setZoom(100);
  };

  const handleReset = () => {
    pushHistorySnapshot(createHistorySnapshot());
    setProcessedPreview('');
    setProcessedBlob(null);
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');
    setShowCompare(false);
    setParams(defaultParams);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), createHistorySnapshot()]);
    setUndoStack(stack => stack.slice(0, -1));
    restoreHistorySnapshot(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(stack => [...stack.slice(-(HISTORY_LIMIT - 1)), createHistorySnapshot()]);
    setRedoStack(stack => stack.slice(0, -1));
    restoreHistorySnapshot(next);
  };

  const handleZoomOut = () => {
    setZoom(value => Math.max(MIN_ZOOM, value - ZOOM_STEP));
  };

  const handleZoomIn = () => {
    setZoom(value => Math.min(MAX_ZOOM, value + ZOOM_STEP));
  };

  const handleExport = (format) => {
    const src = processedPreview || originalPreview;
    if (!src) return;
    setShowExportMenu(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // BMP/JPG need white background (no alpha)
      if (format === 'bmp' || format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/bmp' };
      const extMap  = { png: 'png', jpeg: 'jpg', bmp: 'bmp' };
      const dataUrl = canvas.toDataURL(mimeMap[format], format === 'jpeg' ? 0.92 : undefined);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `mini-photoshop-export.${extMap[format]}`;
      a.click();
    };
    img.src = src;
  };

  // MANUAL APPLY LOGIC
  const handleApply = async () => {
    if (!originalFile || !activeTool) return;
    const endpoint = toolEndpointMap[activeTool.id];
    if (!endpoint) return;

    setLoading(true);
    try {
      const backendParams = buildBackendParams(activeTool.id, params);
      const blob = await sendImageRequest(endpoint, originalFile, backendParams);
      pushHistorySnapshot(createHistorySnapshot());
      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Filter apply error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Canvas Mode detection
  const isCropMode = selectedTool === 'crop';
  const isHistogramMode = selectedCategory === 'histogram';

  // Auto-fetch histograms when switching to Histogram category
  useEffect(() => {
    if (!isHistogramMode || !originalFile) return;
    let isMounted = true;
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');

    const fetchHistograms = async () => {
      setHistogramLoading(true);
      const endpoint = toolEndpointMap[selectedTool];
      if (!endpoint) { setHistogramLoading(false); return; }

      try {
        // Before: histogram of original
        const origBlob = await sendImageRequest(endpoint, originalFile, params);
        if (isMounted) setOriginalHistogramUrl(URL.createObjectURL(origBlob));

        // After: histogram of processed image (if one exists)
        if (processedBlob) {
          const procFile = new File([processedBlob], 'processed.jpg', { type: 'image/jpeg' });
          const procHistBlob = await sendImageRequest(endpoint, procFile, params);
          if (isMounted) setProcessedHistogramUrl(URL.createObjectURL(procHistBlob));
        }
      } catch (err) {
        console.error('Histogram fetch error:', err);
      } finally {
        if (isMounted) setHistogramLoading(false);
      }
    };

    fetchHistograms();
    return () => { isMounted = false; };
  }, [isHistogramMode, selectedTool, originalFile, processedBlob]);

  const cropState = {
    unit: 'px',
    x: params.cropX,
    y: params.cropY,
    width: params.cropWidth,
    height: params.cropHeight
  };

  // The base image we are looking at (processed if available, else original)
  const currentImageSrc = processedPreview || originalPreview;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-cyan-500/30">
      <Header
        originalFile={originalFile}
        originalPreview={originalPreview}
        processedPreview={processedPreview}
        loading={loading}
        isHistogramMode={isHistogramMode}
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
      />

      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          toolGroups={toolGroups}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <ToolSidebar
          activeCategory={activeCategory}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />

        <CanvasArea
          isHistogramMode={isHistogramMode}
          originalFile={originalFile}
          histogramLoading={histogramLoading}
          originalHistogramUrl={originalHistogramUrl}
          processedHistogramUrl={processedHistogramUrl}
          showCompare={showCompare}
          processedPreview={processedPreview}
          originalPreview={originalPreview}
          loading={loading}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          canvasRef={canvasRef}
          isCropMode={isCropMode}
          cropState={cropState}
          setParams={setParams}
          currentImageSrc={currentImageSrc}
          params={params}
          onRemoveImage={handleRemoveImage}
          zoom={zoom}
        />

        <aside className="w-64 border-l border-zinc-800 bg-[#121214] shrink-0 flex flex-col z-20 shadow-2xl relative">
          <div className="h-12 border-b border-zinc-800/50 flex items-center px-4 shrink-0 bg-zinc-900/30">
            <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <FiSettings size={14} className="text-zinc-500" /> Properties
            </h2>
          </div>

          {activeTool ? (
            <PropertiesPanel
              tool={activeTool}
              params={params}
              setParams={setParams}
              canvasRef={canvasRef}
              onApply={handleApply}
              loading={loading}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs italic">
              Select a tool to edit properties
            </div>
          )}
        </aside>
      </div>

      <AppStyles />
    </div>
  );
}

export default App;
