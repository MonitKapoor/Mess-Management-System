from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Response, Request, Cookie
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os, json, sqlite3, urllib.parse, hashlib, secrets

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173"
    ],  # Allow both localhost and 127.0.0.1, and 4173 for Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "img"))
os.makedirs(IMG_FOLDER, exist_ok=True)
app.mount("/img", StaticFiles(directory=IMG_FOLDER), name="img")

DB_PATH = "mess_orders.db"
MENU_JSON_PATH = "mess_menu.json"
MESS_PASS_LIST = {"PASS123", "PASS456", "PASS789"}  # Example valid passes

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT,
    name TEXT,
    mess_pass TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()

class Order(BaseModel):
    items: str
    name: str
    mess_pass: str
    preorder: bool = False  # New field
    category: str = None    # For preorders, to store meal type

def load_menu():
    # Load all items from menu.json and segregate by category
    if os.path.exists(MENU_JSON_PATH):
        with open(MENU_JSON_PATH, encoding="utf-8") as f:
            flat = json.load(f)
        veg_keywords = ["chicken", "egg", "fish", "mutton", "seekh", "kebab", "non-veg", "omelette"]
        def is_veg(item):
            text = (item["name"] + " " + item.get("extras", "")).lower()
            return not any(k in text for k in veg_keywords)
        veg_menu = [item for item in flat if is_veg(item)]
        # Segregate by category
        categories = ["breakfast", "lunch", "snacks", "dinner"]
        segregated = []
        for cat in categories:
            items = [item for item in veg_menu if item.get("category", "").lower() == cat]
            if items:
                segregated.append({"subcategory": cat.capitalize(), "items": items})
        return segregated
    return [{"subcategory": "Veg Menu", "items": []}]

@app.get("/menu")
def get_menu(request: Request, session_id: str = Cookie(None)):
    print(f"/menu called, session_id from cookie: {session_id}, SESSIONS: {list(SESSIONS.keys())}")
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return load_menu()

@app.post("/order")
def place_order(order: Order):
    # If pay_at_counter is set, allow order without mess_pass
    if hasattr(order, 'pay_at_counter') and getattr(order, 'pay_at_counter', False):
        cur.execute(
            "INSERT INTO orders (items, name, mess_pass) VALUES (?, ?, ?)",
            (order.items, order.name, None)
        )
        conn.commit()
        return {"status": "success", "msg": "Order placed, pay at the counter."}
    # Check mess_pass against students table
    cur.execute("SELECT 1 FROM students WHERE mess_pass = ?", (order.mess_pass,))
    if not cur.fetchone():
        raise HTTPException(status_code=403, detail="Invalid Mess Pass")
    if getattr(order, 'preorder', False):
        # Insert as pre-order (pending approval)
        # Try to get enrollment from students table
        cur.execute("SELECT email FROM students WHERE mess_pass = ?", (order.mess_pass,))
        row = cur.fetchone()
        enrollment = row[0] if row else ""
        category = order.category or "Unknown"
        cur.execute(
            "INSERT INTO preorders (name, enrollment, category, items, status) VALUES (?, ?, ?, ?, ?)",
            (order.name, enrollment, category, order.items, "pending")
        )
        conn.commit()
        return {"status": "pending", "msg": "Pre-order sent for admin approval."}
    else:
        cur.execute(
            "INSERT INTO orders (items, name, mess_pass) VALUES (?, ?, ?)",
            (order.items, order.name, order.mess_pass)
        )
        conn.commit()
        return {"status": "success"}

import json as pyjson

@app.get("/orders")
def get_orders(mess_pass: str = None):
    # If mess_pass is provided, only show their orders and approved preorders
    cur = conn.cursor()
    menu = {}
    if os.path.exists(MENU_JSON_PATH):
        with open(MENU_JSON_PATH, encoding="utf-8") as f:
            for item in pyjson.load(f):
                menu[item["id"]] = item["name"]
    result = []
    if mess_pass:
        # Normal orders
        cur.execute("SELECT id, items, name, mess_pass, created_at FROM orders WHERE mess_pass=? ORDER BY id DESC", (mess_pass,))
        rows = cur.fetchall()
        for r in rows:
            try:
                items_list = pyjson.loads(r[1])
                items_str = ", ".join([f"{x['quantity']}x {menu.get(x['menu_item_id'], 'Unknown')}" for x in items_list])
            except Exception:
                items_str = r[1]
            result.append({
                "id": r[0],
                "items": items_str,
                "name": r[2],
                "mess_pass": r[3],
                "created_at": r[4],
                "type": "order"
            })
        # Approved preorders
        cur.execute("SELECT id, items, name, enrollment, created_at FROM preorders WHERE status='approved' AND enrollment=(SELECT email FROM students WHERE mess_pass=?) ORDER BY id DESC", (mess_pass,))
        preorders = cur.fetchall()
        for r in preorders:
            try:
                items_list = pyjson.loads(r[1])
                items_str = ", ".join([f"{x['quantity']}x {menu.get(x['menu_item_id'], 'Unknown')}" for x in items_list])
            except Exception:
                items_str = r[1]
            result.append({
                "id": r[0],
                "items": items_str,
                "name": r[2],
                "mess_pass": mess_pass,
                "created_at": r[4],
                "type": "preorder"
            })
        return result
    else:
        # Admin view: show all orders
        cur.execute("SELECT id, items, name, mess_pass, created_at FROM orders ORDER BY id DESC")
        rows = cur.fetchall()
        for r in rows:
            try:
                items_list = pyjson.loads(r[1])
                items_str = ", ".join([f"{x['quantity']}x {menu.get(x['menu_item_id'], 'Unknown')}" for x in items_list])
            except Exception:
                items_str = r[1]
            result.append({
                "id": r[0],
                "items": items_str,
                "name": r[2],
                "mess_pass": r[3],
                "created_at": r[4],
                "type": "order"
            })
        return result

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    img_folder = IMG_FOLDER
    os.makedirs(img_folder, exist_ok=True)
    filename = file.filename
    file_path = os.path.join(img_folder, filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    url = f"http://localhost:8000/img/{urllib.parse.quote(filename)}"
    return {"url": url}

# --- Student Mess Pass Registration/Login ---
cur.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    mess_pass TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class StudentRegister(BaseModel):
    name: str
    enrollment: str
    password: str

class StudentLogin(BaseModel):
    enrollment: str
    password: str

SESSIONS = {}  # session_id -> mess_pass
SESSION_COOKIE_NAME = "session_id"

@app.post("/register")
def register_student(data: StudentRegister):
    mess_pass = "PASS" + str(abs(hash(data.enrollment)))[-6:]
    try:
        cur.execute(
            "INSERT INTO students (name, email, password, mess_pass) VALUES (?, ?, ?, ?)",
            (data.name, data.enrollment, hash_password(data.password), mess_pass)
        )
        conn.commit()
        return {"status": "success", "mess_pass": mess_pass}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Enrollment number already registered")

@app.post("/login")
def login_student(data: StudentLogin, response: Response):
    print(f"Login attempt: enrollment={data.enrollment}, password={data.password}")
    cur.execute(
        "SELECT mess_pass FROM students WHERE email=? AND password=?",
        (data.enrollment, hash_password(data.password))
    )
    row = cur.fetchone()
    print(f"Login DB result: {row}")
    if row:
        session_id = secrets.token_hex(16)
        SESSIONS[session_id] = row[0]
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            httponly=True,
            samesite="lax",
        )
        return {"status": "success", "mess_pass": row[0]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/logout")
def logout(response: Response, session_id: str = Cookie(None)):
    if session_id in SESSIONS:
        del SESSIONS[session_id]
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"status": "logged out"}

security = HTTPBasic()

@app.get("/students")
def get_students(credentials: HTTPBasicCredentials = Depends(security)):
    # Simple admin auth (username: admin, password: admin123)
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Unauthorized")
    cur = conn.cursor()
    # Fetch students and their latest subscription info
    cur.execute("""
        SELECT s.id, s.name, s.email, s.mess_pass, s.created_at,
            (SELECT duration FROM subscriptions WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as subscription_duration,
            (SELECT status FROM subscriptions WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as subscription_status
        FROM students s
        ORDER BY s.id DESC
    """)
    return [
        {
            "id": r[0],
            "name": r[1],
            "email": r[2],
            "mess_pass": r[3],
            "created_at": r[4],
            "subscription_duration": r[5],
            "subscription_status": r[6]
        }
        for r in cur.fetchall()
    ]

# --- Admin Menu Edit (basic) ---
class MenuItem(BaseModel):
    id: int
    name: str
    category: str
    price: int
    image: str

@app.get("/admin/menu")
def admin_get_menu(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return load_menu()

@app.post("/admin/menu")
def admin_update_menu(items: list[MenuItem], credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Overwrite menu JSON
    with open(MENU_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump([item.dict() for item in items], f, ensure_ascii=False, indent=2)
    return {"status": "success"}

# --- Pre-Order Management ---
class PreOrder(BaseModel):
    name: str
    enrollment: str
    category: str
    items: str
    status: str = "pending"  # pending, approved, rejected

cur.execute("""
CREATE TABLE IF NOT EXISTS preorders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    enrollment TEXT,
    category TEXT,
    items TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()

@app.post("/preorder")
def create_preorder(pre: PreOrder):
    cur.execute(
        "INSERT INTO preorders (name, enrollment, category, items, status) VALUES (?, ?, ?, ?, ?)",
        (pre.name, pre.enrollment, pre.category, pre.items, pre.status)
    )
    conn.commit()
    return {"status": "pending", "msg": "Pre-order sent for admin approval."}

@app.get("/admin/preorders")
def get_preorders(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Unauthorized")
    cur.execute("SELECT id, name, enrollment, category, items, status, created_at FROM preorders ORDER BY id DESC")
    return [
        {"id": r[0], "name": r[1], "enrollment": r[2], "category": r[3], "items": r[4], "status": r[5], "created_at": r[6]}
        for r in cur.fetchall()
    ]

@app.post("/admin/preorders/approve")
def approve_preorder(id: int, approve: bool, credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Unauthorized")
    if approve:
        # Move pre-order to orders table
        cur.execute("SELECT name, enrollment, category, items, created_at FROM preorders WHERE id=?", (id,))
        row = cur.fetchone()
        if row:
            name, enrollment, category, items, created_at = row
            # Find mess_pass for this enrollment
            cur.execute("SELECT mess_pass FROM students WHERE email=?", (enrollment,))
            mp_row = cur.fetchone()
            mess_pass = mp_row[0] if mp_row else ""
            cur.execute(
                "INSERT INTO orders (items, name, mess_pass, created_at) VALUES (?, ?, ?, ?)",
                (items, name, mess_pass, created_at)
            )
            # Remove from preorders
            cur.execute("DELETE FROM preorders WHERE id=?", (id,))
            conn.commit()
            return {"status": "approved-moved"}
    else:
        cur.execute("UPDATE preorders SET status=? WHERE id=?", ("rejected", id))
        conn.commit()
        return {"status": "rejected"}

# Ensure subscriptions table has status column
cur.execute("PRAGMA table_info(subscriptions)")
columns = [row[1] for row in cur.fetchall()]
if "status" not in columns:
    cur.execute("ALTER TABLE subscriptions ADD COLUMN status TEXT DEFAULT 'active'")
    conn.commit()

# Update subscriptions table to include status and duration
cur.execute("""
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    duration TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id)
)
""")
conn.commit()

class SubscriptionUpdate(BaseModel):
    duration: str

@app.get("/subscription-status")
def get_subscription_status(session_id: str = Cookie(None)):
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mess_pass = SESSIONS[session_id]
    
    # Get student ID first
    cur.execute(
        "SELECT id FROM students WHERE mess_pass = ?",
        (mess_pass,)
    )
    student = cur.fetchone()
    if not student:
        return {"subscription": None}
    
    # Get latest subscription
    cur.execute("""
        SELECT duration FROM subscriptions 
        WHERE student_id = ? 
        ORDER BY created_at DESC LIMIT 1
    """, (student[0],))
    
    row = cur.fetchone()
    return {"subscription": row[0] if row else None}

@app.post("/subscribe")
def update_subscription(data: SubscriptionUpdate, session_id: str = Cookie(None)):
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mess_pass = SESSIONS[session_id]
    
    # Get student ID
    cur.execute(
        "SELECT id FROM students WHERE mess_pass = ?",
        (mess_pass,)
    )
    student = cur.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Add new subscription
    cur.execute(
        "INSERT INTO subscriptions (student_id, duration) VALUES (?, ?)",
        (student[0], data.duration)
    )
    conn.commit()
    
    return {"status": "success", "duration": data.duration}

@app.post("/cancel-subscription")
def cancel_subscription(session_id: str = Cookie(None)):
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mess_pass = SESSIONS[session_id]
    # Get student ID
    cur.execute(
        "SELECT id FROM students WHERE mess_pass = ?",
        (mess_pass,)
    )
    student = cur.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # Cancel only the latest active subscription
    cur.execute("""
        UPDATE subscriptions
        SET status = 'cancelled'
        WHERE id = (
            SELECT id FROM subscriptions WHERE student_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1
        )
    """, (student[0],))
    conn.commit()
    return {"status": "success", "message": "Subscription cancelled"}

@app.get("/current-subscription")
def current_subscription(session_id: str = Cookie(None)):
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mess_pass = SESSIONS[session_id]
    cur = conn.cursor()
    cur.execute("SELECT id FROM students WHERE mess_pass = ?", (mess_pass,))
    student = cur.fetchone()
    if not student:
        return {"duration": None, "mess_pass": None}
    cur.execute(
        "SELECT duration, status FROM subscriptions WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
        (student[0],)
    )
    row = cur.fetchone()
    if row and row[1] == "active":
        return {"duration": row[0], "mess_pass": mess_pass}
    return {"duration": None, "mess_pass": None}

@app.get("/student/preorders")
def student_preorders(mess_pass: str):
    # Get all preorders for this student (by enrollment/email)
    cur.execute("SELECT email FROM students WHERE mess_pass=?", (mess_pass,))
    row = cur.fetchone()
    if not row:
        return []
    enrollment = row[0]
    cur.execute("SELECT id, items, status, created_at FROM preorders WHERE enrollment=? ORDER BY id DESC", (enrollment,))
    result = []
    for r in cur.fetchall():
        result.append({
            "id": r[0],
            "items": r[1],
            "status": r[2],
            "created_at": r[3]
        })
    return result
