export default function AppStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      /* Custom Scrollbar for sidebars */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #27272a; 
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #3f3f46; 
      }

      /* Checkerboard Canvas Background */
      .checkerboard {
        background-color: #09090b;
        background-image: 
          linear-gradient(45deg, #121214 25%, transparent 25%), 
          linear-gradient(-45deg, #121214 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #121214 75%), 
          linear-gradient(-45deg, transparent 75%, #121214 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      }

      /* Histogram panel slide-in animations */
      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .animate-slide-in-left  { animation: slide-in-left  0.4s cubic-bezier(0.22,1,0.36,1) both; }
      .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.22,1,0.36,1) both; }

      /* Override ReactCrop styles to match dark theme */
      .react-crop__crop-selection {
        border: 1px solid #22d3ee !important;
        background-color: rgba(34, 211, 238, 0.05) !important;
      }
      .react-crop__drag-handle {
        background-color: #fff !important;
        border: 1px solid #22d3ee !important;
        width: 8px !important;
        height: 8px !important;
      }
    `}} />
  );
}
