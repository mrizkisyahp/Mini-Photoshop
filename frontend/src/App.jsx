import { useMemo, useState } from 'react';
import { sendImageRequest } from './api/api';
import { Toolbar } from './components/Toolbar';
import { ImagePanel } from './components/ImagePanel';
import { useDropzone } from 'react-dropzone';

const toolGroups = [
  {
    name: 'Enhancement',
    tools: [
      { id: 'brightness', label: 'Brightness / Contrast', subtitle: 'Linear scaling dan gamma correction' },
      { id: 'sharpen', label: 'Sharpen', subtitle: 'Tingkatkan detail tepi' },
      { id: 'blur', label: 'Gaussian Blur', subtitle: 'Kurangi noise dan haluskan foto' },
      { id: 'clahe', label: 'Histogram Equalization', subtitle: 'Contrast enhancement adaptif' },
    ],
  },
  {
    name: 'Geometric',
    tools: [
      { id: 'rotate', label: 'Rotate', subtitle: 'Putar gambar 0–360°' },
      { id: 'flip', label: 'Flip', subtitle: 'Flip horizontal / vertikal' },
      { id: 'resize', label: 'Resize', subtitle: 'Ubah ukuran gambar' },
      { id: 'crop', label: 'Crop', subtitle: 'Pangkas area target' },
    ],
  },
  {
    name: 'Color & Histogram',
    tools: [
      { id: 'grayscale', label: 'Grayscale', subtitle: 'Konversi ke skala abu-abu' },
      { id: 'hsv', label: 'Hue/Saturation', subtitle: 'Sesuaikan warna HSV' },
      { id: 'histogram', label: 'Histogram', subtitle: 'Generate grafik histogram' },
    ],
  },
  {
    name: 'Edge & Morphology',
    tools: [
      { id: 'canny', label: 'Canny Edge', subtitle: 'Deteksi tepi canggih' },
      { id: 'sobel', label: 'Sobel Edge', subtitle: 'Deteksi gradien tepi' },
      { id: 'erosion', label: 'Erosion', subtitle: 'Pengikisan morfologi' },
      { id: 'dilation', label: 'Dilation', subtitle: 'Perluasan morfologi' },
    ],
  },
  {
    name: 'Compression',
    tools: [
      { id: 'jpeg', label: 'JPEG Quality', subtitle: 'Kontrol tingkat kompresi JPEG' },
      { id: 'rle', label: 'RLE Simulation', subtitle: 'Demo run-length encoding' },
    ],
  },
];

const defaultParams = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  rotate: 0,
  flipMode: 'horizontal',
  resizeWidth: 800,
  resizeHeight: 600,
  cropX: 0,
  cropY: 0,
  cropWidth: 200,
  cropHeight: 200,
  hsvHue: 0,
  hsvSaturation: 0,
  jpegQuality: 80,
};

const toolEndpointMap = {
  brightness: '/test-endpoint',
  sharpen: '/enhancement/sharpen',
  blur: '/enhancement/blur',
  clahe: '/enhancement/histogram-equalization',
  rotate: '/geometric/rotate',
  flip: '/geometric/flip',
  resize: '/geometric/resize',
  crop: '/geometric/crop',
  grayscale: '/color/grayscale',
  hsv: '/color/hsv',
  histogram: '/histogram/grayscale',
  canny: '/edge/canny',
  sobel: '/edge/sobel',
  erosion: '/morphology/erosion',
  dilation: '/morphology/dilation',
  jpeg: '/compression/jpeg',
  rle: '/compression/rle',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ToolPanel({ selectedTool, params, setParams }) {
  if (!selectedTool) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-500">Pilih alat untuk menampilkan kontrol.</div>;
  }

  const field = (label, element) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-300">{label}</div>
      {element}
    </div>
  );

  switch (selectedTool) {
    case 'brightness':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Brightness',
            <input
              type="range"
              min="-100"
              max="100"
              value={params.brightness}
              onChange={(e) => setParams((prev) => ({ ...prev, brightness: Number(e.target.value) }))}
              className="w-full"
            />
          )}
          {field(
            'Contrast',
            <input
              type="range"
              min="-100"
              max="100"
              value={params.contrast}
              onChange={(e) => setParams((prev) => ({ ...prev, contrast: Number(e.target.value) }))}
              className="w-full"
            />
          )}
          {field(
            'Gamma',
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={params.gamma}
              onChange={(e) => setParams((prev) => ({ ...prev, gamma: Number(e.target.value) }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            />
          )}
        </div>
      );

    case 'rotate':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Rotate Angle',
            <input
              type="range"
              min="0"
              max="360"
              value={params.rotate}
              onChange={(e) => setParams((prev) => ({ ...prev, rotate: Number(e.target.value) }))}
              className="w-full"
            />
          )}
          <div className="text-sm text-slate-400">Nilai saat ini: {params.rotate}°</div>
        </div>
      );

    case 'flip':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Flip Mode',
            <select
              value={params.flipMode}
              onChange={(e) => setParams((prev) => ({ ...prev, flipMode: e.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="both">Horizontal + Vertikal</option>
            </select>
          )}
        </div>
      );

    case 'resize':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Lebar (px)',
            <input
              type="number"
              min="16"
              value={params.resizeWidth}
              onChange={(e) => setParams((prev) => ({ ...prev, resizeWidth: clamp(Number(e.target.value), 16, 8192) }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            />
          )}
          {field(
            'Tinggi (px)',
            <input
              type="number"
              min="16"
              value={params.resizeHeight}
              onChange={(e) => setParams((prev) => ({ ...prev, resizeHeight: clamp(Number(e.target.value), 16, 8192) }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            />
          )}
        </div>
      );

    case 'crop':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              'X',
              <input
                type="number"
                min="0"
                value={params.cropX}
                onChange={(e) => setParams((prev) => ({ ...prev, cropX: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
              />
            )}
            {field(
              'Y',
              <input
                type="number"
                min="0"
                value={params.cropY}
                onChange={(e) => setParams((prev) => ({ ...prev, cropY: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
              />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              'Width',
              <input
                type="number"
                min="16"
                value={params.cropWidth}
                onChange={(e) => setParams((prev) => ({ ...prev, cropWidth: clamp(Number(e.target.value), 16, 8192) }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
              />
            )}
            {field(
              'Height',
              <input
                type="number"
                min="16"
                value={params.cropHeight}
                onChange={(e) => setParams((prev) => ({ ...prev, cropHeight: clamp(Number(e.target.value), 16, 8192) }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
              />
            )}
          </div>
        </div>
      );

    case 'hsv':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Hue Shift',
            <input
              type="range"
              min="-180"
              max="180"
              value={params.hsvHue}
              onChange={(e) => setParams((prev) => ({ ...prev, hsvHue: Number(e.target.value) }))}
              className="w-full"
            />
          )}
          {field(
            'Saturation',
            <input
              type="range"
              min="-100"
              max="100"
              value={params.hsvSaturation}
              onChange={(e) => setParams((prev) => ({ ...prev, hsvSaturation: Number(e.target.value) }))}
              className="w-full"
            />
          )}
        </div>
      );

    case 'jpeg':
      return (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {field(
            'Quality',
            <input
              type="range"
              min="10"
              max="95"
              value={params.jpegQuality}
              onChange={(e) => setParams((prev) => ({ ...prev, jpegQuality: Number(e.target.value) }))}
              className="w-full"
            />
          )}
          <div className="text-sm text-slate-400">Kualitas jpeg saat ini: {params.jpegQuality}</div>
        </div>
      );

    default:
      return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-500">Parameter alat ini tidak tersedia di UI saat ini.</div>;
  }
}

function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [processedPreview, setProcessedPreview] = useState('');
  const [selectedTool, setSelectedTool] = useState('brightness');
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Pilih gambar dan pilih alat untuk mulai proses.');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setProcessedPreview('');
      setMessage('Gambar berhasil diunggah. Pilih operasi untuk mulai memproses.');
    },
  });

  const selectedToolConfig = useMemo(
    () => ({
      label: toolGroups.flatMap((group) => group.tools).find((tool) => tool.id === selectedTool)?.label || 'Alat',
      endpoint: toolEndpointMap[selectedTool],
    }),
    [selectedTool]
  );

  const handleApply = async () => {
    if (!originalFile) {
      setMessage('Silakan unggah gambar terlebih dahulu.');
      return;
    }

    if (!selectedToolConfig.endpoint) {
      setMessage('Endpoint untuk alat ini belum dikonfigurasi.');
      return;
    }

    setLoading(true);
    setMessage('Memproses gambar...');

    try {
      const paramsToSend = { ...params };
      const blob = await sendImageRequest(selectedToolConfig.endpoint, originalFile, paramsToSend);
      const url = URL.createObjectURL(blob);
      setProcessedPreview(url);
      setMessage(`Hasil ${selectedToolConfig.label} berhasil dihasilkan.`);
    } catch (error) {
      setMessage('Terjadi kesalahan saat memproses gambar. Periksa backend atau endpoint API.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <header className="rounded-[2.5rem] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Mini Photoshop</p>
              <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Frontend Image Editor</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Upload gambar, pilih alat pengolahan citra, lalu terapkan transformasi. UI ini siap dipasangkan ke backend FastAPI untuk pemrosesan citra.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/80 p-5 text-center">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Before</div>
                <div className="mt-3 text-3xl font-semibold text-cyan-300">Preview</div>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5 text-center">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">After</div>
                <div className="mt-3 text-3xl font-semibold text-emerald-300">Processed</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Upload Gambar</p>
                  <p className="mt-1 text-sm text-slate-500">Drag dan drop atau pilih file JPG / PNG.</p>
                </div>
              </div>
              <div
                {...getRootProps()}
                className={`group relative flex min-h-[220px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed px-6 text-center transition ${isDragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 bg-slate-950/80 hover:border-slate-500'}`}
              >
                <input {...getInputProps()} />
                <p className="max-w-[260px] text-sm leading-6 text-slate-400">
                  Tarik file gambar ke area ini, atau klik untuk memilih file dari komputer.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">PNG, JPG, BMP</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Kontrol Alat</h2>
                  <p className="mt-1 text-sm text-slate-500">Pilih operasi untuk menyesuaikan parameter dan kirim ke backend.</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">{selectedToolConfig.label}</span>
              </div>

              <ToolPanel selectedTool={selectedTool} params={params} setParams={setParams} />

              <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="mt-6 w-full rounded-3xl bg-cyan-500 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {loading ? 'Memproses...' : 'Terapkan Operasi'}
              </button>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-3 text-slate-200">{message}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Preview Before / After</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <ImagePanel title="Before" src={originalPreview} />
                <ImagePanel title="After" src={processedPreview} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Alat Tersedia</p>
              <Toolbar toolGroups={toolGroups} selectedTool={selectedTool} onSelect={setSelectedTool} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
