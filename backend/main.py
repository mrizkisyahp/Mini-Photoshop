import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.enhancement import router as router_enhancement
from routers.restoration import router as router_restoration
from routers.geometric import router as router_geometric
from routers.edge import router as router_edge
from routers.color import router as router_color
from routers.segmentation import router as router_segmentation
from routers.histogram import router as router_histogram
from routers.cnn import router as router_cnn
from routers.compression import router as router_compression
from routers.chatbot import router as router_chatbot

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router_enhancement)
app.include_router(router_restoration)
app.include_router(router_geometric)
app.include_router(router_edge)
app.include_router(router_color)
app.include_router(router_segmentation)
app.include_router(router_histogram)
app.include_router(router_cnn)
app.include_router(router_compression)
app.include_router(router_chatbot)
