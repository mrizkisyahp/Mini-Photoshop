from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.enhancement import router as router_enhancement
from routers.restoration import router as router_restoration
from routers.geometric import router as router_geometric

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_enhancement)
app.include_router(router_restoration)
app.include_router(router_geometric)