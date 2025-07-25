import { useEffect, useState } from "react";
import "./App.css";
import moment from "moment-timezone";

const API_URL = "http://localhost:8000";

type MenuItem = {
  id: number;
  name: string;
  extras?: string;
  price?: number | null;
  image?: string;
  extraOptions?: { name: string; price: number }[];
  category?: string;
};
type CartItem = MenuItem & { quantity: number };

function isVegItem(item: MenuItem) {
  // All items are veg in campus mess
  return true;
}

function NavBar({ categories, selected, onSelect, onLogout }: { categories: string[], selected: string, onSelect: (cat: string) => void, onLogout: () => void }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">CAMPUS MESS</div>
      <div className="navbar-links">
        {categories.map(cat => (
          <button
            key={cat}
            className={selected === cat ? "nav-link active" : "nav-link"}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <button className="logout-btn" onClick={onLogout}>Logout</button>
    </nav>
  );
}

function FloatingCart({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div className="floating-cart" onClick={onClick} title="View Cart">
      <span role="img" aria-label="cart">🛒</span>
      {count > 0 && <span className="cart-badge-floating">{count}</span>}
    </div>
  );
}

function MenuPage({
  menuSections,
  addToCart,
  removeFromCart,
  cart,
  selectedCategory,
  onPreOrder
}: {
  menuSections: { subcategory: string; items: MenuItem[] }[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (item: MenuItem) => void;
  cart: CartItem[];
  selectedCategory: string;
  onPreOrder: (category: string) => void;
}) {
  const section = menuSections.find(s => s.subcategory === selectedCategory);
  const timings: Record<string, string> = {
    Breakfast: "7:00 AM - 11:00 AM",
    Lunch: "12:00 PM - 3:00 PM",
    Snacks: "4:00 PM - 6:00 PM",
    Dinner: "7:00 PM - 9:00 PM"
  };
  return (
    <div className="menu-app dark-bg">
      <main>
        <div className="menu-header-row">
          <h2 className="menu-title">{selectedCategory} Menu</h2>
          <div className="timing">{timings[selectedCategory]}</div>
          <button className="preorder-btn" onClick={() => onPreOrder(selectedCategory)}>Pre-Order</button>
        </div>
        <ul className="menu-list">
          {section?.items.map(item => (
            <li key={item.id} className="menu-item modern-card">
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="menu-item-img"
                  />
                )}
                <div className="item-info">
                  <span className="item-name">
                    {item.name}
                    <span className="dot veg-dot" title="Veg" />
                  </span>
                  {item.extras && <span className="item-extras">{item.extras}</span>}
                </div>
              </div>
              <div className="item-actions">
                <span className="price">
                  {item.price !== null && item.price !== undefined ? <>₹{item.price}</> : ""}
                </span>
                <button className="add-btn" onClick={() => addToCart(item)}>
                  Add
                </button>
                {cart.find(c => c.id === item.id) && (
                  <>
                    <span className="qty-badge">{cart.find(c => c.id === item.id)?.quantity}</span>
                    <button className="add-btn" style={{background: "#444", color: "#fff"}} onClick={() => removeFromCart(item)}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function CartPage({
  cart,
  removeFromCartByIndex,
  updateQty,
  name,
  setName,
  messPass,
  setMessPass,
  submitOrder,
  submitted,
  onBack,
  hasMessPass,
  currentSubscription
}: {
  cart: CartItem[];
  removeFromCartByIndex: (idx: number) => void;
  updateQty: (idx: number, qty: number) => void;
  name: string;
  setName: (v: string) => void;
  messPass: string;
  setMessPass: (v: string) => void;
  submitOrder: () => void;
  submitted: boolean;
  onBack: () => void;
  hasMessPass: boolean;
  currentSubscription: string | null;
}) {
  if (submitted)
    return (
      <div className="centered">
        <h2>Order placed!</h2>
        <p>Thank you for using <b>CAMPUS MESS</b>.</p>
        <button className="primary-btn" onClick={onBack}>Back to Menu</button>
      </div>
    );
  return (
    <div className="cart-page dark-bg">
      <header>
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <h1>Your Cart</h1>
      </header>
      <ul className="cart-list">
        {cart.map((item, idx) => (
          <li key={idx} className="cart-item modern-card">
            <span>{item.name}</span>
            <div className="cart-actions">
              <button onClick={() => updateQty(idx, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
              <span className="qty-badge">{item.quantity}</span>
              <button onClick={() => updateQty(idx, item.quantity + 1)}>+</button>
              <span className="price">₹{item.price && item.quantity ? item.price * item.quantity : ""}</span>
              <button onClick={() => removeFromCartByIndex(idx)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="order-form">
        <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        {/* If the student has a mess pass subscription, show mess pass number. If not, show 'Pay at the counter' */}
        {hasMessPass ? (
          <div style={{marginBottom: 8}}>
            <b>Mess Pass:</b> {messPass}
          </div>
        ) : (
          <div style={{marginBottom: 8, color: '#1976d2'}}>
            Pay at the counter
          </div>
        )}
        <button
          className="primary-btn"
          onClick={submitOrder}
          disabled={!cart.length || !name}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister, switchToLogin }: { onRegister: (enrollment: string, password: string, name: string) => void, switchToLogin: () => void }) {
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");  return (
    <div className="auth-container">
      <h1 className="system-title">AUB Mess Management System</h1>
      <div className="auth-card">
        <h2>Create Account</h2>
        <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Enrollment Number" value={enrollment} onChange={e => setEnrollment(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="primary-btn" onClick={() => {
          if (!enrollment || !password || !name) { setError("All fields required"); return; }
          setError("");
          onRegister(enrollment, password, name);
        }}>Register</button>
        {error && <div className="error-msg">{error}</div>}
        <p>Already have an account? <button className="link-btn" onClick={switchToLogin}>Login</button></p>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, switchToRegister }: { onLogin: (enrollment: string, password: string) => Promise<void>, switchToRegister: () => void }) {
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginClick = async () => {
    if (!enrollment || !password) {
      setError("All fields required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await onLogin(enrollment, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="auth-container">
      <h1 className="system-title">AUB Mess Management System</h1>
      <div className="auth-card">
        <h2>Welcome Back!</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          placeholder="Username/Enrollment"
          value={enrollment}
          onChange={e => setEnrollment(e.target.value)}
          disabled={isLoading}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="primary-btn"
          onClick={handleLoginClick}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <p>
          Don't have an account?{" "}
          <button className="link-btn" onClick={switchToRegister}>
            Register
          </button>
        </p>        <p style={{ marginTop: 16 }}>
          <button className="link-btn" onClick={() => window.location.href = "/admin"}>
            Go to Admin Login
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminLoginPage({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleLoginClick = async () => {
    if (!username || !password) {
      setError("All fields required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Overlay for darkening the background image, just like LoginPage */}
      <h1 className="system-title">AUB Mess Management System</h1>
      <div className="auth-card">
        <h2>Welcome Back!</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          placeholder="Admin Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={isLoading}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="primary-btn"
          onClick={handleLoginClick}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login as Admin'}
        </button>
        <p>
          <button className="link-btn" onClick={() => window.location.href = "/"}>
            Back to Student Login
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [selectedSection, setSelectedSection] = useState<"editMenu" | "approvePreOrders" | "viewMessPass">("editMenu");

  const renderSection = () => {
    switch (selectedSection) {
      case "editMenu":
        return <EditMenu />;
      case "approvePreOrders":
        return <ApprovePreOrders />;
      case "viewMessPass":
        return <ViewMessPass />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <button
          className={selectedSection === "editMenu" ? "active" : ""}
          onClick={() => setSelectedSection("editMenu")}
        >
          Edit Menu
        </button>
        <button
          className={selectedSection === "approvePreOrders" ? "active" : ""}
          onClick={() => setSelectedSection("approvePreOrders")}
        >
          Approve Pre-Orders
        </button>
        <button
          className={selectedSection === "viewMessPass" ? "active" : ""}
          onClick={() => setSelectedSection("viewMessPass")}
        >
          View Mess-Pass Applications
        </button>
      </nav>
      <div className="admin-content">{renderSection()}</div>
    </div>
  );
}

function EditMenu() {
  const [menuSections, setMenuSections] = useState<{ subcategory: string; items: MenuItem[] }[]>([]);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ name: "", price: null, category: "" });

  useEffect(() => {
    fetch(`${API_URL}/menu`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMenuSections(data);
        else setMenuSections([]);
      })
      .catch(() => setMenuSections([]));
  }, []);

  const handleEditItem = (subcategory: string, itemId: number, field: keyof MenuItem, value: any) => {
    setMenuSections((prev) =>
      prev.map((section) =>
        section.subcategory === subcategory
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : section
      )
    );
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      alert("Please fill in all required fields.");
      return;
    }
    setMenuSections((prev) =>
      prev.map((section) =>
        section.subcategory === newItem.category
          ? {
              ...section,
              items: [
                ...section.items,
                { id: Date.now(), ...newItem } as MenuItem,
              ],
            }
          : section
      )
    );
    setNewItem({ name: "", price: null, category: "" });
  };

  const handleDeleteItem = (subcategory: string, itemId: number) => {
    setMenuSections((prev) =>
      prev.map((section) =>
        section.subcategory === subcategory
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId),
            }
          : section
      )
    );
  };

  const handleSaveMenu = () => {
    fetch(`${API_URL}/menu`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuSections),
    })
      .then((res) => {
        if (res.ok) alert("Menu saved successfully!");
        else alert("Failed to save menu.");
      })
      .catch(() => alert("Failed to save menu."));
  };

  return (
    <div className="edit-menu">
      <h2>Edit Menu</h2>
      {menuSections.map((section) => (
        <div key={section.subcategory} className="menu-section">
          <h3>{section.subcategory}</h3>
          <table className="menu-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleEditItem(section.subcategory, item.id, "name", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price || ""}
                      onChange={(e) =>
                        handleEditItem(section.subcategory, item.id, "price", +e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => handleDeleteItem(section.subcategory, item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <h3>Add New Item</h3>
      <div className="add-item-form">
        <select
          value={newItem.category || ""}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
        >
          <option value="">Select Category</option>
          {menuSections.map((section) => (
            <option key={section.subcategory} value={section.subcategory}>
              {section.subcategory}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Name"
          value={newItem.name || ""}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price || ""}
          onChange={(e) => setNewItem({ ...newItem, price: +e.target.value })}
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <button className="save-menu-btn" onClick={handleSaveMenu}>
        Save Menu
      </button>
    </div>
  );
}

function ApprovePreOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/orders`, { 
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(data => setOrders(data))
    .catch(err => console.error('Failed to fetch orders:', err));
  }, []);

  return (
    <div className="orders-section">
      <h2>Recent Orders</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Student</th>
            <th>Items</th>
            <th>Mess Pass</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.student_name}</td>
              <td>
                {order.order_items?.map((item: any) => 
                  `${item.quantity}x ${item.menu_item_name}`
                ).join(', ')}
              </td>
              <td>{order.mess_pass_number}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViewMessPass() {
  return <div>View Mess-Pass Applications Section (To be implemented)</div>;
}

function SubscriptionPage({ currentSubscription, onSubscribe, setCurrentSubscription }: { currentSubscription: string | null, onSubscribe: (duration: string) => void, setCurrentSubscription: (v: string | null) => void }) {
  const [selectedDuration, setSelectedDuration] = useState("3");
  const [passGenerated, setPassGenerated] = useState(false);
  const costs = {
    "3": "₹4,500",
    "6": "₹8,000",
    "12": "₹15,000",
  };

  const generatePassImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#ff9800');
      gradient.addColorStop(1, '#ffb74d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Add campus logo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CAMPUS MESS', canvas.width/2, 80);

      // Add pass details
      ctx.font = 'bold 36px Arial';
      ctx.fillText('MESS PASS', canvas.width/2, 150);
      
      ctx.font = '24px Arial';
      ctx.fillText(`Duration: ${currentSubscription} Months`, canvas.width/2, 200);
      ctx.fillText(`Cost: ${costs[currentSubscription || "3"]}`, canvas.width/2, 240);
      
      // Add decorative elements
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Add validity
      const currentDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(currentSubscription || "3"));
      
      ctx.font = '20px Arial';
      ctx.fillText(`Valid from: ${currentDate.toLocaleDateString()}`, canvas.width/2, 300);
      ctx.fillText(`Valid until: ${expiryDate.toLocaleDateString()}`, canvas.width/2, 340);
    }
    return canvas.toDataURL('image/png');
  };

  const downloadPass = () => {
    const link = document.createElement('a');
    link.download = 'MessPass.png';
    link.href = generatePassImage();
    link.click();
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      fetch(`${API_URL}/cancel-subscription`, {
        method: 'POST',
        credentials: 'include',
      })
      .then(res => {
        if (res.ok) {
          setCurrentSubscription(null);
          alert('Subscription cancelled successfully');
        } else {
          alert('Failed to cancel subscription');
        }
      });
    }
  };

  // If already subscribed, show the pass
  if (currentSubscription) {
    return (
      <div className="subscription-page dark-bg">
        <h2>Your Active Mess-Pass</h2>
        <div className="pass-card">
          <h3>Mess-Pass Subscription</h3>
          <p>Duration: {currentSubscription} Months</p>
          <p>Cost: {costs[currentSubscription]}</p>
          <div className="pass-actions">
            <button className="primary-btn" onClick={downloadPass}>Download Pass</button>
            <button className="cancel-btn" onClick={handleCancelSubscription}>Cancel Subscription</button>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription options only if not subscribed
  return (
    <div className="subscription-page dark-bg">
      <h2>Mess-Pass Subscription</h2>
      <p>Select your subscription duration:</p>
      <div className="subscription-options">
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="3"
            checked={selectedDuration === "3"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>3 Months</h3>
            <p>Cost: ₹4,500</p>
          </div>
        </label>
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="6"
            checked={selectedDuration === "6"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>6 Months</h3>
            <p>Cost: ₹8,000</p>
          </div>
        </label>
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="12"
            checked={selectedDuration === "12"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>12 Months</h3>
            <p>Cost: ₹15,000</p>
          </div>
        </label>
      </div>
      <button className="primary-btn" onClick={() => {
        onSubscribe(selectedDuration);
        setPassGenerated(true);
      }}>Subscribe</button>
    </div>
  );
}

// Helper to convert UTC/ISO date string to IST and format as dd/mm/yyyy and hh:mm am/pm
function formatISTDateTime(dateString: string) {
  if (!dateString) return { date: '', time: '' };
  const m = moment.tz(dateString, "Asia/Kolkata");
  return {
    date: m.format("DD/MM/YYYY"),
    time: m.format("hh:mm a")
  };
}

export default function App() {
  console.log('App component initializing');
  const [auth, setAuth] = useState<'checking'|'login'|'register'|'ok'|'admin'>('login');
  const [menuSections, setMenuSections] = useState<{ subcategory: string; items: MenuItem[] }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [messPass, setMessPass] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [page, setPage] = useState<"menu" | "cart">("menu");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Breakfast");
  const [showCart, setShowCart] = useState(false);
  const [preOrderMsg, setPreOrderMsg] = useState("");
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'menu'|'orders'|'subscription'>('menu');

  useEffect(() => {
    console.log('Current auth state:', auth);
  }, [auth]);

  // Enable and fix the auth check effect
  useEffect(() => {
    console.log('Checking initial auth state...');
    fetch(`${API_URL}/menu`, { credentials: 'include' })
      .then(res => {
        console.log('Initial auth check response:', res.status);
        if (res.status === 401) {
          setAuth('login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load menu');
        setAuth('ok');
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (Array.isArray(data)) {
          setMenuSections(data);
          setSelectedCategory(data[0]?.subcategory || "Breakfast");
        }
      })
      .catch((err) => {
        console.error('Auth check error:', err);
        setAuth('login');
      });
  }, []);

  // Fetch current subscription info for the logged-in student
  const fetchCurrentSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/current-subscription`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSubscription(data?.duration || null);
        setMessPass(data?.mess_pass || ""); // <-- store mess pass number if present
      } else {
        setCurrentSubscription(null);
        setMessPass("");
      }
    } catch {
      setCurrentSubscription(null);
      setMessPass("");
    }
  };

  // Helper for fetch with timeout
  const fetchWithTimeout = (url: string, options: any, timeout = 7000): Promise<Response> => {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), timeout))
    ]) as Promise<Response>;
  };

  const handleLogin = async (enrollment: string, password: string) => {
    console.log('Login attempt:', { enrollment });

    try {
      // Admin login
      if (enrollment === 'admin' && password === 'admin123') {
        const res = await fetchWithTimeout(`${API_URL}/admin/menu`, {
          headers: {
            'Authorization': 'Basic ' + btoa(`${enrollment}:${password}`)
          },
          credentials: 'include'
        });
        console.log('Admin login response status:', res.status);
        if (res.ok) {
          setAuth('admin');
          return;
        } else {
          let msg = 'Invalid admin credentials';
          try { msg = (await res.json()).detail || msg; } catch {}
          throw new Error(msg);
        }
      }

      // Student login
      const res = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ enrollment, password })
      });

      console.log('Student login response status:', res.status);

      let data: any = null;
      try {
        data = await res.json();
        console.log('Student login response data:', data);
      } catch (jsonErr) {
        console.error('Failed to parse JSON:', jsonErr);
        throw new Error('Server error: Invalid response');
      }

      if (res.ok) {
        setAuth('ok');
        await fetchMenu();
        await fetchCurrentSubscription();
      } else {
        throw new Error(data?.detail || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      throw new Error(err.message || 'Login failed. Please try again.');
    }
  };

  const handleRegister = async (enrollment: string, password: string, name: string) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment, password, name })
      });
      if (res.ok) {
        setAuth('login');
      } else {
        setRegisterError("Registration failed");
      }
    } catch (err) {
      setRegisterError("Registration failed");
      console.error('Register error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      setAuth('login');
      setCart([]);
      setMenuSections([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchMenu = async () => {
    console.log('Fetching menu after login...');
    try {
      const res = await fetch(`${API_URL}/menu`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch menu');
      }

      const data = await res.json();
      console.log('Menu data:', data);
      
      if (Array.isArray(data)) {
        setMenuSections(data);
        setSelectedCategory(data[0]?.subcategory || "Breakfast");
      }
    } catch (err) {
      console.error('Menu fetch error:', err);
      setAuth('login');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i);
      }
      return [...prev, {...item, quantity: 1}];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => prev.filter(i => i.id !== item.id));
  };

  const removeFromCartByIndex = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map((item, i) => i === idx ? {...item, quantity: qty} : item));
  };

  const getCategoryStartTime = (category: string) => {
    // Returns a Date object for today at the start time of the category
    const now = new Date();
    let hour = 0, minute = 0;
    switch (category) {
      case "Breakfast": hour = 7; minute = 0; break;
      case "Lunch": hour = 12; minute = 0; break;
      case "Snacks": hour = 16; minute = 0; break;
      case "Dinner": hour = 19; minute = 0; break;
      default: hour = 0; minute = 0;
    }
    const start = new Date(now);
    start.setHours(hour, minute, 0, 0);
    return start;
  };

  const isPreOrder = () => {
    // If any cart item is from a category whose window hasn't started, it's a pre-order
    const now = new Date();
    for (const item of cart) {
      const section = menuSections.find(s => s.items.some(i => i.id === item.id));
      if (section) {
        const start = getCategoryStartTime(section.subcategory);
        if (now < start) return true;
      }
    }
    return false;
  };

  const fetchOrders = async () => {
    if (!messPass) return;
    try {
      const res = await fetch(`${API_URL}/orders?mess_pass=${encodeURIComponent(messPass)}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const fetchPreOrders = async () => {
    if (!messPass) return;
    try {
      const res = await fetch(`${API_URL}/student/preorders?mess_pass=${encodeURIComponent(messPass)}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setPreOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch pre-orders:', err);
    }
  };

  useEffect(() => {
    if (auth === 'ok' && messPass) {
      fetchOrders();
      fetchPreOrders();
    }
    // eslint-disable-next-line
  }, [auth, messPass]);

  const submitOrder = async () => {
    const preorder = isPreOrder();
    let category: string | undefined = undefined;
    if (preorder && cart.length > 0) {
      const section = menuSections.find(s => s.items.some(i => i.id === cart[0].id));
      category = section?.subcategory;
    }
    // If user does not have a mess pass subscription, do not send mess_pass in the order
    const orderData: any = {
      items: JSON.stringify(cart.map(({ id, quantity }) => ({
        menu_item_id: id,
        quantity
      })) ),
      name,
      preorder,
      category
    };
    // Only add mess_pass if the user has a subscription (not for pay-at-counter)
    if (!!currentSubscription && !!messPass) {
      orderData.mess_pass = messPass;
    } else {
      // For pay-at-counter, send a special flag to backend
      orderData.pay_at_counter = true;
    }
    console.log('Sending order:', orderData);
    try {
      const res = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setCart([]);
        if (preorder) {
          setPreOrderMsg('Your pre-order has been sent for admin approval. You will be notified once approved.');
          setTimeout(() => setPreOrderMsg(''), 4000);
        }
      } else {
        alert(data.detail || 'Order failed. Please check your mess pass.');
      }
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleBackToMenu = () => {
    setSubmitted(false);
    setShowCart(false);
    setPage('menu');
  };

  const handlePreOrder = (category: string) => {
    setPreOrderMsg(`Pre-order for ${category} sent for admin approval!`);
    setTimeout(() => setPreOrderMsg(""), 2500);
  };

  const handleSubscribe = async (duration: string) => {
    try {
      const res = await fetch(`${API_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ duration })
      });
      if (res.ok) {
        await fetchCurrentSubscription();
      } else {
        alert('Subscription failed');
      }
    } catch (err) {
      alert('Subscription failed');
    }
  };

  // If you use useEffect with functions, add them to the dependency array or define inside useEffect
  // Example:
  // useEffect(() => { fetchCurrentSubscription(); }, [auth]);

  if (auth === 'checking') {
    console.log('Rendering loading state');
    return <div className="centered"><h2>Loading...</h2></div>;
  }

  if (auth === 'login') {
    console.log('Rendering login page');
    return <LoginPage onLogin={handleLogin} switchToRegister={() => setAuth('register')} />;
  }

  if (auth === 'register') return <RegisterPage onRegister={handleRegister} switchToLogin={() => setAuth('login')} />;
  if (auth === 'admin') return <AdminDashboard />;
  if (!Array.isArray(menuSections)) return <div className="centered"><h2>Could not load menu. Please try logging in again.</h2></div>;

  return (
    <div>
      <NavBar
        categories={[
          ...menuSections
            .map(s => s.subcategory)
            .filter(cat => cat !== 'Mess-Pass Subscription' && cat !== 'Pre-Order'), // filter out both
          'Your Orders',
          'Mess-Pass Subscription'
        ]}
        selected={selectedTab === 'orders' ? 'Your Orders' : selectedTab === 'subscription' ? 'Mess-Pass Subscription' : selectedCategory}
        onSelect={(cat) => {
          if (cat === 'Your Orders') setSelectedTab('orders');
          else if (cat === 'Mess-Pass Subscription') setSelectedTab('subscription');
          else {
            setSelectedTab('menu');
            setSelectedCategory(cat);
          }
        }}
        onLogout={handleLogout}
      />
      {preOrderMsg && <div className="preorder-toast">{preOrderMsg}</div>}
      {selectedTab === 'orders' && (
        <div className="orders-section">
          <h2>Your Orders</h2>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Items</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign: 'center'}}>No orders yet.</td></tr>
              ) : (
                orders.map(order => {
                  const isPreOrderApproved = order.preorder === true || order.type === 'preorder' || order.status === 'approved' || order.is_preorder_approved;
                  const { date, time } = formatISTDateTime(order.created_at || order.timestamp || order.date);
                  return (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.items || (order.order_items?.map((item: any) => `${item.quantity}x ${item.menu_item_name}`).join(', '))}</td>
                      <td>{isPreOrderApproved ? 'Pre-Order (Approved)' : 'Order'}</td>
                      <td>{date}</td>
                      <td>{time}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {selectedTab === 'subscription' ? (
        <SubscriptionPage
          currentSubscription={currentSubscription}
          onSubscribe={handleSubscribe}
          setCurrentSubscription={setCurrentSubscription}
        />
      ) : (
        page === "cart" || showCart ? (
          <CartPage
            cart={cart}
            removeFromCartByIndex={removeFromCartByIndex}
            updateQty={updateQty}
            name={name}
            setName={setName}
            messPass={messPass}
            setMessPass={setMessPass}
            submitOrder={submitOrder}
            submitted={submitted}
            onBack={() => { setShowCart(false); handleBackToMenu(); }}
            hasMessPass={!!currentSubscription && !!messPass}
            currentSubscription={currentSubscription}
          />
        ) : (
          selectedTab === 'menu' && (
            <>
              <MenuPage
                menuSections={menuSections}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                selectedCategory={selectedCategory}
                onPreOrder={handlePreOrder}
              />
              <FloatingCart count={cart.reduce((a, b) => a + b.quantity, 0)} onClick={() => setShowCart(true)} />
            </>
          )
        )
      )}
    </div>
  );
}