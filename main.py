import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, Response, Cookie
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

app = FastAPI(title="ELmart Online Shop")

BASE_DIR = Path(__file__).resolve().parent

(BASE_DIR / "static" / "images").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "templates").mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/images", StaticFiles(directory=BASE_DIR / "static" / "images"), name="images")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

PRODUCTS_DB = {
    "1": {
        "name": "Apple iPhone 15 128GB",
        "price": 41999,
        "oldPrice": 45999,
        "sale": "yes",
        "discount": "-9%",
        "category": "phones",
        "img": "images/iphone-15-black.png",
        "description": "Потужний смартфон Apple з дисплеєм Super Retina XDR.",
        "stock": 7,
        "rating": 5
    },
    "2": {
        "name": "Samsung Galaxy S25",
        "price": 36999,
        "oldPrice": 39999,
        "sale": "yes",
        "discount": "-8%",
        "category": "phones",
        "img": "images/s25.png",
        "description": "Новий флагман Samsung.",
        "stock": 5,
        "rating": 4.9
    },
    "3": {
        "name": "Xiaomi 15",
        "price": 24999,
        "oldPrice": None,
        "sale": "no",
        "discount": "",
        "category": "phones",
        "img": "images/ximi15.png",
        "description": "Сучасний смартфон Xiaomi.",
        "stock": 12,
        "rating": 4.7
        },
    "4": {
        "name": "Lenovo IdeaPad Slim 5",
        "price": 31999,
        "oldPrice": 34999,
        "sale": "yes",
        "discount": "-9%",
        "category": "laptops",
        "img": "images/lenovoslim5.png",
        "description": "Ноутбук для навчання та роботи.",
        "stock": 6,
        "rating": 4.8
    },
    "5": {
        "name": "PlayStation 5 Slim",
        "price": 23999,
        "oldPrice": 25999,
        "sale": "yes",
        "discount": "-7%",
        "category": "gaming",
        "img": "images/PS5slim.png",
        "description": "Ігрова консоль Sony.",
        "stock": 5,
        "rating": 5
    },
    "6": {
        "name": "Sony WH-1000XM6",
        "price": 14999,
        "oldPrice": None,
        "sale": "no",
        "discount": "",
        "category": "audio",
        "img": "images/WH1000.webp",
        "description": "Бездротові навушники Sony.",
        "stock": 9,
        "rating": 4.9
    }
}



class ProductCreate(BaseModel):
    name: str
    price: int
    oldPrice: int | None = None
    sale: str = "no"
    discount: str = ""
    category: str
    img: str = "images/1.png"
    description: str
    stock: int
    rating: float = 5.0

class LoginData(BaseModel):
    password: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.get("/product.html", response_class=HTMLResponse)
async def read_product_page(request: Request):
    return templates.TemplateResponse(request, "product.html")

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request, admin_auth: str = Cookie(None)):
    if admin_auth != "true":
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse(request, "admin.html")

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html")

@app.post("/api/login")
async def login_post(data: LoginData, response: Response):
    if data.password == "8787":
        response.set_cookie(key="admin_auth", value="true", httponly=True)
        return {"status": "success"}
    raise HTTPException(status_code=403, detail="Невірний пароль")

@app.get("/api/products")
async def get_products():
    return JSONResponse(content=PRODUCTS_DB)

@app.post("/api/products")
async def add_product(product: ProductCreate, admin_auth: str = Cookie(None)):
    if admin_auth != "true":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    new_id = str(max([int(k) for k in PRODUCTS_DB.keys()] + [0]) + 1)
    PRODUCTS_DB[new_id] = product.model_dump()
    return {"status": "success", "id": new_id, "message": "Товар успішно додано!"}

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, admin_auth: str = Cookie(None)):
    if admin_auth != "true":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    if product_id not in PRODUCTS_DB:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    del PRODUCTS_DB[product_id]
    return {"status": "success", "message": "Товар видалено!"}